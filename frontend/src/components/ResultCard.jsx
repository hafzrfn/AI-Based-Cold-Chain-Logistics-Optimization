import { useEffect, useState } from 'react';
import './ResultCard.css';

/**
 * Reusable card for displaying a single result metric.
 * Animates the number counting up on mount.
 *
 * @param {string} icon - Emoji icon
 * @param {string} label - Metric label (e.g., "Transit Time")
 * @param {number} value - Numeric value
 * @param {string} unit - Unit of measurement (e.g., "hours", "°C")
 * @param {string} color - Accent color for the card
 * @param {number} delay - Animation delay in ms
 */
function ResultCard({ icon, label, value, unit, color, delay = 0 }) {
  const [displayValue, setDisplayValue] = useState(0);

  // Animate counter from 0 to value
  useEffect(() => {
    const duration = 1200; // ms
    const startTime = Date.now();
    const startDelay = delay;

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime - startDelay;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic for smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(eased * value);

        if (progress >= 1) {
          clearInterval(interval);
          setDisplayValue(value);
        }
      }, 16);

      return () => clearInterval(interval);
    }, startDelay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  // Format the displayed number
  const formatNumber = (num) => {
    if (Math.abs(num) < 1) return num.toFixed(2);
    if (Math.abs(num) < 100) return num.toFixed(1);
    return Math.round(num).toLocaleString();
  };

  return (
    <div
      className="result-card glass"
      style={{ '--result-color': color, animationDelay: `${delay}ms` }}
    >
      <div className="result-icon-wrapper">
        <span className="result-icon">{icon}</span>
      </div>
      <div className="result-content">
        <span className="result-label">{label}</span>
        <div className="result-value-row">
          <span className="result-value">{formatNumber(displayValue)}</span>
          <span className="result-unit">{unit}</span>
        </div>
      </div>
      <div className="result-glow"></div>
    </div>
  );
}

export default ResultCard;
