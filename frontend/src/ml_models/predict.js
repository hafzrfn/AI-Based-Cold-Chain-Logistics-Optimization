/**
 * Client-side Logistic Regression Prediction Engine
 * ==================================================
 * Replicates scikit-learn's StandardScaler + LogisticRegression pipeline
 * using the exported JSON model weights. Runs entirely in the browser —
 * no Python runtime or server roundtrip needed.
 *
 * The math: sigmoid( dot(standardize(features), coefficients) + intercept )
 */

import spoilageModel from './Spoilage_Risk_logreg_web_export.json';
import delayModel from './Delay_Risk_logreg_web_export.json';
import failureModel from './Cold_Chain_Failure_logreg_web_export.json';

/**
 * Human-readable labels for model features.
 */
const FEATURE_LABELS = [
  'Cargo Load',
  'Distance',
  'Temperature',
  'Temp. Deviation',
  'Humidity',
  'Delay Hours',
];

/**
 * Units for each feature, used in the factor detail display.
 */
const FEATURE_UNITS = [
  'tons',
  'miles',
  '°C',
  '°C from 4°C',
  '%',
  'hours',
];

/**
 * Sigmoid activation function.
 * Clamps input to [-500, 500] to avoid floating-point overflow.
 */
function sigmoid(x) {
  const clamped = Math.max(-500, Math.min(500, x));
  return 1 / (1 + Math.exp(-clamped));
}

/**
 * Run a single Logistic Regression prediction.
 *
 * @param {number[]} rawFeatures - Raw feature values in the same order as model.features
 * @param {object} model - Exported model JSON (scaler_mean, scaler_scale, coefficients, intercept)
 * @returns {number} Probability (0–1)
 */
function predictSingle(rawFeatures, model) {
  // Step 1: Standardize (replicate StandardScaler.transform)
  const scaled = rawFeatures.map((val, i) =>
    (val - model.scaler_mean[i]) / model.scaler_scale[i]
  );

  // Step 2: Weighted sum + intercept (replicate coef_ @ X + intercept_)
  const z = scaled.reduce(
    (sum, val, i) => sum + val * model.coefficients[i],
    model.intercept
  );

  // Step 3: Sigmoid → probability
  return sigmoid(z);
}

/**
 * Analyze per-feature contributions for a single model.
 * Computes scaled[i] * coefficient[i] — the additive contribution
 * each feature makes to the logit (z) before the sigmoid.
 *
 * @param {number[]} rawFeatures - Raw feature values
 * @param {object} model - Model JSON
 * @returns {object[]} Sorted array of factor objects (highest impact first)
 */
function analyzeFactors(rawFeatures, model) {
  const scaled = rawFeatures.map((val, i) =>
    (val - model.scaler_mean[i]) / model.scaler_scale[i]
  );

  const contributions = scaled.map((sVal, i) => {
    const impact = sVal * model.coefficients[i];
    return {
      feature: FEATURE_LABELS[i],
      value: rawFeatures[i],
      unit: FEATURE_UNITS[i],
      impact: Math.round(impact * 1000) / 1000,
      absImpact: Math.abs(impact),
    };
  });

  // Sort by absolute impact descending so the biggest driver is first
  contributions.sort((a, b) => b.absImpact - a.absImpact);

  // Determine the max absolute impact for relative scaling
  const maxAbs = contributions[0]?.absImpact || 1;

  return contributions.map((c) => {
    // Relative strength as 0–100 for bar rendering
    const relativeStrength = Math.round((c.absImpact / maxAbs) * 100);
    
    let level = 'low';
    if (relativeStrength >= 60) level = 'high';
    else if (relativeStrength >= 25) level = 'moderate';

    return {
      feature: c.feature,
      value: c.value,
      unit: c.unit,
      impact: c.impact,
      direction: c.impact >= 0 ? 'increases' : 'decreases',
      level: level,
      relativeStrength,
    };
  });
}

/**
 * Compute the composite risk score (0–100) and alert level.
 * Matches compute_risk_scores_and_alerts() from FinalizedModelv3.py.
 *
 * Weights: Spoilage 50%, Cold Chain Failure 30%, Delay 20%
 */
function computeCompositeRisk(spoilageProb, delayProb, failureProb, tempC, delayHours) {
  const weightedAvg = (spoilageProb * 0.5 + failureProb * 0.3 + delayProb * 0.2) * 100;
  const maxProb = Math.max(spoilageProb, delayProb, failureProb);

  // A single critical risk pulls the composite up, but capped at 70% of that risk to avoid false High.
  const score = Math.max(weightedAvg, maxProb * 70);

  let alertLevel = 'Low';

  if (score >= 66 || tempC >= 20.0 || delayHours >= 24.0) {
    alertLevel = 'High';
  } else if (score >= 33 || delayHours >= 12.0) {
    alertLevel = 'Medium';
  } else {
    alertLevel = 'Low';
  }

  return { score: Math.round(score * 10) / 10, alertLevel };
}

/**
 * Main prediction function — call this from the UI.
 *
 * @param {object} params
 * @param {number} params.perishableLoadTons - Cargo weight (default: 5.0)
 * @param {number} params.distanceMiles - Route distance in miles
 * @param {number} params.tempC - Transport temperature in Celsius
 * @param {number} params.humidityPct - Humidity percentage (default: 75)
 * @param {number} params.delayHours - Expected delay in hours (default: 2.5)
 * @returns {object} { spoilage, delay, failure, factors, compositeScore, alertLevel }
 */
export function predictRisks({
  perishableLoadTons = 5.0,
  distanceMiles,
  tempC,
  tempDeviation = 0.0,
  humidityPct = 75,
  delayHours = 2.5,
}) {
  // Use the user-provided temperature deviation
  const tempDeviationAbs = tempDeviation;

  // Feature order MUST match model.features:
  // [perishable_load_tons, distance_miles, temp_c, temp_deviation_abs, humidity_pct, delay_hours]
  const features = [
    perishableLoadTons,
    distanceMiles,
    tempC,
    tempDeviationAbs,
    humidityPct,
    delayHours,
  ];

  const spoilage = predictSingle(features, spoilageModel);
  const delay = predictSingle(features, delayModel);
  const failure = predictSingle(features, failureModel);

  const { score, alertLevel } = computeCompositeRisk(
    spoilage, delay, failure, tempC, delayHours
  );

  // Factor analysis: expose per-feature contributions for each risk
  const factors = {
    spoilage: analyzeFactors(features, spoilageModel),
    delay: analyzeFactors(features, delayModel),
    failure: analyzeFactors(features, failureModel),
  };

  return {
    spoilage: Math.round(spoilage * 1000) / 10,   // percentage with 1 decimal
    delay: Math.round(delay * 1000) / 10,
    failure: Math.round(failure * 1000) / 10,
    factors,
    compositeScore: score,
    alertLevel,
  };
}
