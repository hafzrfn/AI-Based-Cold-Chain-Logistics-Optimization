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
 * Compute the composite risk score (0–100) and alert level.
 * Matches compute_risk_scores_and_alerts() from FinalizedModelv3.py.
 *
 * Weights: Spoilage 50%, Cold Chain Failure 30%, Delay 20%
 */
function computeCompositeRisk(spoilageProb, delayProb, failureProb, tempC, delayHours) {
  const weightedAvg = (spoilageProb * 0.5 + failureProb * 0.3 + delayProb * 0.2) * 100;
  const maxProb = Math.max(spoilageProb, delayProb, failureProb);

  // The composite score is the HIGHER of the weighted average and the max
  // individual risk. This prevents a single low-risk component from diluting
  // two dangerously high components down to a "safe" number.
  const score = Math.max(weightedAvg, maxProb * 100);

  let alertLevel;
  if (score >= 75 || tempC > 10.0 || maxProb >= 0.70) {
    alertLevel = 'High';
  } else if (score >= 45 || delayHours > 4.0 || maxProb >= 0.50) {
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
 * @returns {object} { spoilage, delay, failure, compositeScore, alertLevel }
 */
export function predictRisks({
  perishableLoadTons = 5.0,
  distanceMiles,
  tempC,
  humidityPct = 75,
  delayHours = 2.5,
}) {
  // Derive temp_deviation_abs (same transform used during training)
  const tempDeviationAbs = Math.abs(tempC - 4.0);

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

  return {
    spoilage: Math.round(spoilage * 1000) / 10,   // percentage with 1 decimal
    delay: Math.round(delay * 1000) / 10,
    failure: Math.round(failure * 1000) / 10,
    compositeScore: score,
    alertLevel,
  };
}
