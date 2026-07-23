import { useEffect, useState } from 'react';
import './DecisionTreeConclusion.css';

/**
 * Renders a visual decision flow / tree diagram illustrating how input features
 * propagate through the individual risk models and combine into the final composite risk score.
 */
function DecisionTreeConclusion({ predictions, results, advancedSettings }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!predictions || !results || !advancedSettings) return null;

  const { spoilage, delay, failure, compositeScore, alertLevel } = predictions;

  // Features used as inputs
  const cargoLoad = advancedSettings.perishableLoadTons ?? 5.0;
  const distance = results.distance_miles ?? 0;
  const temp = results.optimal_temp ?? 2.0;
  const humidity = advancedSettings.humidityPct ?? 75;
  const expectedDelay = advancedSettings.delayHours ?? 2.5;
  const tempDev = Math.abs(temp - 4.0);

  // Helper to get CSS classes based on risk value
  const getRiskClass = (val) => {
    if (val >= 60) return 'high-risk';
    if (val >= 30) return 'medium-risk';
    return 'low-risk';
  };

  const getScoreColor = (score) => {
    if (score >= 75) return '#ef4444';
    if (score >= 45) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className={`decision-tree-container glass ${animated ? 'active' : ''}`} id="decision-tree-conclusion">
      <div className="tree-header">
        <h3 className="tree-title">🌿 Decision Flow & Logic Tree</h3>
        <p className="tree-subtitle">
          Visualizing how shipment inputs flow through Logistic Regression equations to output the Composite Risk Score
        </p>
      </div>

      <div className="tree-diagram">
        {/* Step 1: Input Features Layer */}
        <div className="tree-layer inputs-layer">
          <div className="layer-label">1. Inputs</div>
          
          <div className="tree-node input-node">
            <span className="node-emoji">🌡️</span>
            <div className="node-info">
              <span className="node-label">Optimal Temp</span>
              <span className="node-value">{temp.toFixed(1)}°C</span>
              <span className="node-sub">Dev: {tempDev.toFixed(1)}°C</span>
            </div>
          </div>

          <div className="tree-node input-node">
            <span className="node-emoji">💧</span>
            <div className="node-info">
              <span className="node-label">Humidity</span>
              <span className="node-value">{humidity}%</span>
              <span className="node-sub">Rh level</span>
            </div>
          </div>

          <div className="tree-node input-node">
            <span className="node-emoji">⏳</span>
            <div className="node-info">
              <span className="node-label">Expected Delay</span>
              <span className="node-value">{expectedDelay.toFixed(1)} hrs</span>
              <span className="node-sub">Buffer time</span>
            </div>
          </div>

          <div className="tree-node input-node">
            <span className="node-emoji">🚛</span>
            <div className="node-info">
              <span className="node-label">Distance & Load</span>
              <span className="node-value">{Math.round(distance).toLocaleString()} mi</span>
              <span className="node-sub">{cargoLoad.toFixed(1)} tons cargo</span>
            </div>
          </div>
        </div>

        {/* Connector column SVG lines */}
        <div className="tree-connector-column">
          <svg className="connector-svg" width="100%" height="100%" viewBox="0 0 100 400" preserveAspectRatio="none">
            {/* temp -> spoilage & failure */}
            <path d="M 0,50 C 50,50 50,80 100,80" className="connector-path" />
            <path d="M 0,50 C 50,50 50,200 100,200" className="connector-path" />
            
            {/* humidity -> spoilage */}
            <path d="M 0,150 C 50,150 50,80 100,80" className="connector-path" />
            <path d="M 0,150 C 50,150 50,200 100,200" className="connector-path" />
            
            {/* delay -> spoilage, failure, delay_risk */}
            <path d="M 0,250 C 50,250 50,80 100,80" className="connector-path" />
            <path d="M 0,250 C 50,250 50,200 100,200" className="connector-path" />
            <path d="M 0,250 C 50,250 50,320 100,320" className="connector-path" />
            
            {/* distance/load -> all three */}
            <path d="M 0,350 C 50,350 50,80 100,80" className="connector-path" />
            <path d="M 0,350 C 50,350 50,200 100,200" className="connector-path" />
            <path d="M 0,350 C 50,350 50,320 100,320" className="connector-path" />
          </svg>
        </div>

        {/* Step 2: Individual Logistic Regression Models */}
        <div className="tree-layer models-layer">
          <div className="layer-label">2. ML Risks</div>
          
          <div className={`tree-node model-node ${getRiskClass(spoilage)}`}>
            <span className="node-emoji">🧫</span>
            <div className="node-info">
              <span className="node-label">Spoilage Risk</span>
              <span className="node-value">{spoilage}%</span>
              <span className="node-sub">Logistic Equation</span>
            </div>
            <div className="node-formula">sigmoid(z_spoilage)</div>
          </div>

          <div className={`tree-node model-node ${getRiskClass(failure)}`}>
            <span className="node-emoji">❄️</span>
            <div className="node-info">
              <span className="node-label">Cold Chain Failure</span>
              <span className="node-value">{failure}%</span>
              <span className="node-sub">Logistic Equation</span>
            </div>
            <div className="node-formula">sigmoid(z_failure)</div>
          </div>

          <div className={`tree-node model-node ${getRiskClass(delay)}`}>
            <span className="node-emoji">⏳</span>
            <div className="node-info">
              <span className="node-label">Delay Risk</span>
              <span className="node-value">{delay}%</span>
              <span className="node-sub">Logistic Equation</span>
            </div>
            <div className="node-formula">sigmoid(z_delay)</div>
          </div>
        </div>

        {/* Connector column SVG lines */}
        <div className="tree-connector-column">
          <svg className="connector-svg" width="100%" height="100%" viewBox="0 0 100 400" preserveAspectRatio="none">
            {/* spoilage -> aggregation */}
            <path d="M 0,80 C 50,80 50,200 100,200" className="connector-path" />
            <span className="weight-label-overlay" style={{ top: '25%' }}>50% Wt</span>
            
            {/* failure -> aggregation */}
            <path d="M 0,200 C 50,200 50,200 100,200" className="connector-path" />
            <span className="weight-label-overlay" style={{ top: '50%' }}>30% Wt</span>
            
            {/* delay -> aggregation */}
            <path d="M 0,320 C 50,320 50,200 100,200" className="connector-path" />
            <span className="weight-label-overlay" style={{ top: '75%' }}>20% Wt</span>
          </svg>
        </div>

        {/* Step 3: Decision / Aggregation Node */}
        <div className="tree-layer aggregation-layer">
          <div className="layer-label">3. Logic Gate</div>
          
          <div className="tree-node decision-node">
            <span className="node-emoji">⚖️</span>
            <div className="node-info">
              <span className="node-label">Decision Node</span>
              <span className="node-value">Max Aggregator</span>
              <span className="node-sub">
                Max of:
                <br />
                • Weighted Avg: {Math.round(spoilage * 0.5 + failure * 0.3 + delay * 0.2)}%
                <br />
                • Max Single Risk: {Math.max(spoilage, failure, delay)}%
              </span>
            </div>
          </div>
        </div>

        {/* Connector column SVG lines */}
        <div className="tree-connector-column">
          <svg className="connector-svg" width="100%" height="100%" viewBox="0 0 100 400" preserveAspectRatio="none">
            <path d="M 0,200 C 50,200 50,200 100,200" className="connector-path" />
          </svg>
        </div>

        {/* Step 4: Final Conclusion Layer */}
        <div className="tree-layer conclusion-layer">
          <div className="layer-label">4. Conclusion</div>
          
          <div className="tree-node final-node" style={{ borderColor: getScoreColor(compositeScore) }}>
            <span className="node-emoji">🏁</span>
            <div className="node-info">
              <span className="node-label">Composite Risk</span>
              <span className="node-score" style={{ color: getScoreColor(compositeScore) }}>
                {compositeScore.toFixed(1)} / 100
              </span>
              <span className={`node-badge ${alertLevel.toLowerCase()}`}>
                {alertLevel} Priority
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Conclusion Text / Insight box */}
      <div className="tree-logic-explanation">
        <h4 className="explanation-title">📝 Logic Summary:</h4>
        <p className="explanation-text">
          Input features are standardized and passed through three Logistic Regression models. The weighted composite score (<strong>{compositeScore.toFixed(1)}/100</strong>) determines the final <strong>{alertLevel} Priority</strong> alert.
        </p>
      </div>
    </div>
  );
}

export default DecisionTreeConclusion;
