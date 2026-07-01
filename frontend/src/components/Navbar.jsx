import { useLocation } from 'react-router-dom';
import './Navbar.css';

/**
 * Navigation bar with step indicator.
 * Highlights the current step based on the active route.
 */
const STEPS = [
  { path: '/', label: 'Select Foods', icon: '🛒' },
  { path: '/route', label: 'Choose Route', icon: '🗺️' },
  { path: '/results', label: 'View Results', icon: '📊' },
];

function Navbar() {
  const location = useLocation();

  // Determine which step is currently active
  const currentStepIndex = STEPS.findIndex((step) => step.path === location.pathname);

  return (
    <nav className="navbar glass" id="main-navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">❄️</span>
        <h1 className="navbar-title">ColdChain AI</h1>
      </div>

      <div className="navbar-steps">
        {STEPS.map((step, index) => (
          <div
            key={step.path}
            className={`step-item ${index === currentStepIndex ? 'active' : ''} ${
              index < currentStepIndex ? 'completed' : ''
            }`}
          >
            <span className="step-icon">{step.icon}</span>
            <span className="step-label">{step.label}</span>
            {index < STEPS.length - 1 && <span className="step-divider">→</span>}
          </div>
        ))}
      </div>
    </nav>
  );
}

export default Navbar;
