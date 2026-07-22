import { useLocation, Link } from 'react-router-dom';
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

function Navbar({ theme, toggleTheme }) {
  const location = useLocation();

  // Determine which step is currently active
  const currentStepIndex = STEPS.findIndex((step) => step.path === location.pathname);

  return (
    <nav className="navbar glass" id="main-navbar">
      <Link to="/" className="navbar-brand" style={{ textDecoration: 'none' }}>
        <span className="navbar-logo">❄️</span>
        <h1 className="navbar-title">ColdChain AI</h1>
      </Link>

      <div className="navbar-steps">
        {STEPS.map((step, index) => (
          <div key={step.path} style={{ display: 'flex', alignItems: 'center' }}>
            <Link
              to={step.path}
              className={`step-item ${index === currentStepIndex ? 'active' : ''} ${
                index < currentStepIndex ? 'completed' : ''
              }`}
              style={{ textDecoration: 'none' }}
            >
              <span className="step-icon">{step.icon}</span>
              <span className="step-label">{step.label}</span>
            </Link>
            {index < STEPS.length - 1 && <span className="step-divider">→</span>}
          </div>
        ))}
      </div>

      <div className="navbar-actions">
        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn"
          aria-label="Toggle theme"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <Link to="/operations" className={`dashboard-link ${location.pathname === '/operations' ? 'active' : ''}`}>
          ⚙️ Operations Planning
        </Link>
        <Link to="/dashboard" className={`dashboard-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
          📈 Research Dashboard
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
