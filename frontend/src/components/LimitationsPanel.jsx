import { useState } from 'react';
import './LimitationsPanel.css';

/**
 * Collapsible panel displaying all assumptions, limitations,
 * and conditions under which the analysis results are valid.
 */
const LIMITATIONS = [
  {
    icon: '🌤️',
    title: 'Normal Conditions Only',
    detail: 'Results assume no extreme weather, mechanical failures, or geopolitical disruptions.',
  },
  {
    icon: '❄️',
    title: 'Single Temperature Zone',
    detail: 'Mixed loads use the coldest required temperature — multi-zone containers are not modeled.',
  },
  {
    icon: '📏',
    title: 'Straight-Line Distance',
    detail: 'Distance is Haversine (crow-flies), not actual road routing — typically 15–30% shorter than reality.',
  },
  {
    icon: '🤖',
    title: 'Static ML Model',
    detail: 'Risk scores are based on historical training data and do not reflect live IoT or traffic conditions.',
  },
];

function LimitationsPanel() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="limitations-panel glass" id="limitations-panel">
      <button
        className="limitations-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="limitations-content"
      >
        <div className="limitations-toggle-left">
          <span className="limitations-icon">⚠️</span>
          <div>
            <h3 className="limitations-title">Assumptions & Limitations</h3>
            <p className="limitations-hint">
              All results are subject to the following conditions
            </p>
          </div>
        </div>
        <span className={`limitations-chevron ${isExpanded ? 'expanded' : ''}`}>
          ▾
        </span>
      </button>

      <div
        id="limitations-content"
        className={`limitations-content ${isExpanded ? 'expanded' : ''}`}
      >
        <div className="limitations-grid">
          {LIMITATIONS.map((item, idx) => (
            <div
              key={idx}
              className="limitation-item"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <span className="limitation-item-icon">{item.icon}</span>
              <div>
                <h4 className="limitation-item-title">{item.title}</h4>
                <p className="limitation-item-detail">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LimitationsPanel;
