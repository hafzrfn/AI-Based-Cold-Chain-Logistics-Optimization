import { useEffect, useState } from 'react';
import './RiskPanel.css';

/**
 * Alert level descriptions shown below the composite gauge.
 */
const ALERT_DESCRIPTIONS = {
  Low: 'All risk indicators are within acceptable thresholds. Standard operating procedures are sufficient.',
  Medium: 'Moderate risk detected. Consider additional monitoring or route adjustments to mitigate delay and spoilage exposure.',
  High: 'Severe risk detected. Immediate action recommended — temperature excursion or spoilage probability is dangerously high.',
};

/**
 * Determine the CSS risk-level class from a percentage value.
 */
function getRiskClass(pct) {
  if (pct >= 60) return 'risk-high';
  if (pct >= 30) return 'risk-moderate';
  return 'risk-low';
}

/**
 * Determine the stroke color for the composite gauge SVG.
 * Uses the alert level so the gauge always matches the badge.
 */
function getGaugeColor(alertLevel) {
  if (alertLevel === 'High') return '#ef4444';
  if (alertLevel === 'Medium') return '#f59e0b';
  return '#10b981';
}

/**
 * Map risk label to the factors key.
 */
const RISK_FACTOR_KEY = {
  'Spoilage Risk': 'spoilage',
  'Delay Risk': 'delay',
  'Cold Chain Failure': 'failure',
};

/**
 * Color for factor impact levels.
 */
function getFactorBarColor(level) {
  if (level === 'high') return 'linear-gradient(90deg, #ef4444, #f87171)';
  if (level === 'moderate') return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
  return 'linear-gradient(90deg, #10b981, #34d399)';
}

/**
 * Format a factor value for display.
 */
function formatFactorValue(value, unit) {
  if (typeof value !== 'number') return `${value} ${unit}`;
  if (Math.abs(value) >= 1000) return `${value.toLocaleString()} ${unit}`;
  if (Number.isInteger(value)) return `${value} ${unit}`;
  return `${value.toFixed(1)} ${unit}`;
}

/**
 * AI Risk Assessment Panel
 * Renders three risk probability bars, a composite score gauge, and an alert badge.
 * Now also renders per-risk contributing factor details.
 *
 * @param {object} predictions - Output from predictRisks()
 * @param {number} predictions.spoilage - Spoilage risk percentage (0–100)
 * @param {number} predictions.delay - Delay risk percentage (0–100)
 * @param {number} predictions.failure - Cold chain failure percentage (0–100)
 * @param {object} predictions.factors - Per-risk factor analysis
 * @param {number} predictions.compositeScore - Weighted composite (0–100)
 * @param {string} predictions.alertLevel - 'Low' | 'Medium' | 'High'
 */
function RiskPanel({ predictions }) {
  const [animated, setAnimated] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});

  // Trigger bar animations after mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!predictions) return null;

  const { spoilage, delay, failure, factors, compositeScore, alertLevel } = predictions;

  // SVG gauge calculations (circumference of r=42 circle)
  const circumference = 2 * Math.PI * 42;
  const gaugeOffset = circumference - (compositeScore / 100) * circumference;

  const risks = [
    { label: 'Spoilage Risk', icon: '🧫', value: spoilage },
    { label: 'Delay Risk', icon: '⏳', value: delay },
    { label: 'Cold Chain Failure', icon: '❄️', value: failure },
  ];

  const toggleCard = (label) => {
    setExpandedCards((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="risk-panel" id="risk-panel">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div>
          <h2 className="risk-panel-title">
            🤖 AI Risk Assessment
          </h2>
          <p className="risk-panel-subtitle">
            Logistic Regression predictions
          </p>
        </div>
        <span className={`alert-badge ${alertLevel.toLowerCase()}`}>
          <span className="alert-dot"></span>
          {alertLevel} Priority
        </span>
      </div>

      {/* Risk Cards Grid */}
      <div className="risk-grid">
        {risks.map((risk) => {
          const riskClass = getRiskClass(risk.value);
          const factorKey = RISK_FACTOR_KEY[risk.label];
          const riskFactors = factors ? factors[factorKey] : null;
          const isExpanded = expandedCards[risk.label];

          return (
            <div key={risk.label} className={`risk-card glass ${riskClass}`}>
              <div className="risk-card-header">
                <span className="risk-card-label">
                  <span>{risk.icon}</span>
                  {risk.label}
                </span>
                <span className="risk-card-value">{risk.value}%</span>
              </div>
              <div className="risk-bar-track">
                <div
                  className={`risk-bar-fill ${animated ? 'animated' : ''}`}
                  style={{ width: animated ? `${Math.min(risk.value, 100)}%` : '0%' }}
                />
              </div>

              {/* Contributing Factors */}
              {riskFactors && (
                <div className="risk-factors-section">
                  <button
                    className="risk-factors-toggle"
                    onClick={() => toggleCard(risk.label)}
                    aria-expanded={isExpanded}
                  >
                    <span className="risk-factors-toggle-label">
                      📊 Contributing Factors
                    </span>
                    <span className={`risk-factors-chevron ${isExpanded ? 'expanded' : ''}`}>
                      ▾
                    </span>
                  </button>

                  <div className={`risk-factors-content ${isExpanded ? 'expanded' : ''}`}>
                    {riskFactors.map((factor, idx) => (
                      <div key={idx} className="risk-factor-row">
                        <div className="risk-factor-info">
                          <span className="risk-factor-name">{factor.feature}</span>
                          <span className={`risk-factor-level ${factor.level}`}>
                            {factor.level}
                          </span>
                        </div>
                        <div className="risk-factor-detail">
                          <span className="risk-factor-value">
                            {formatFactorValue(factor.value, factor.unit)}
                          </span>
                          <span className="risk-factor-direction">
                            {factor.direction === 'increases' ? '↑' : '↓'} risk
                          </span>
                        </div>
                        <div className="risk-factor-bar-track">
                          <div
                            className="risk-factor-bar-fill"
                            style={{
                              width: `${factor.relativeStrength}%`,
                              background: getFactorBarColor(factor.level),
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Composite Score Gauge */}
      <div className="composite-section glass">
        <div className="composite-gauge">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle className="composite-gauge-bg" cx="50" cy="50" r="42" />
            <circle
              className="composite-gauge-fill"
              cx="50" cy="50" r="42"
              stroke={getGaugeColor(alertLevel)}
              strokeDasharray={circumference}
              strokeDashoffset={animated ? gaugeOffset : circumference}
            />
          </svg>
          <div className="composite-gauge-text">
            <span className="composite-score-number" style={{ color: getGaugeColor(alertLevel) }}>
              {compositeScore}
            </span>
            <span className="composite-score-label">/ 100</span>
          </div>
        </div>

        <div className="composite-info">
          <h4>Composite Risk Score</h4>
          <p>{ALERT_DESCRIPTIONS[alertLevel]}</p>
          <div className="composite-weights">
            <span className="weight-tag">Spoilage 50%</span>
            <span className="weight-tag">Failure 30%</span>
            <span className="weight-tag">Delay 20%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RiskPanel;

