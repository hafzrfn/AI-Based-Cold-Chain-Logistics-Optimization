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
 * AI Risk Assessment Panel
 * Renders three risk probability bars, a composite score gauge, and an alert badge.
 *
 * @param {object} predictions - Output from predictRisks()
 * @param {number} predictions.spoilage - Spoilage risk percentage (0–100)
 * @param {number} predictions.delay - Delay risk percentage (0–100)
 * @param {number} predictions.failure - Cold chain failure percentage (0–100)
 * @param {number} predictions.compositeScore - Weighted composite (0–100)
 * @param {string} predictions.alertLevel - 'Low' | 'Medium' | 'High'
 */
function RiskPanel({ predictions }) {
  const [animated, setAnimated] = useState(false);

  // Trigger bar animations after mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!predictions) return null;

  const { spoilage, delay, failure, compositeScore, alertLevel } = predictions;

  // SVG gauge calculations (circumference of r=42 circle)
  const circumference = 2 * Math.PI * 42;
  const gaugeOffset = circumference - (compositeScore / 100) * circumference;

  const risks = [
    { label: 'Spoilage Risk', icon: '🧫', value: spoilage },
    { label: 'Delay Risk', icon: '⏳', value: delay },
    { label: 'Cold Chain Failure', icon: '❄️', value: failure },
  ];

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
