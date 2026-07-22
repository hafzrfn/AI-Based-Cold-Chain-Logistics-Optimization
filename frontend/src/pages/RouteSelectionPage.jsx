import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MapSelector from '../components/MapSelector';
import { ALL_FOODS } from '../data/foods';
import { calculateLogistics } from '../api/logistics';
import './RouteSelectionPage.css';

/**
 * Step 2: Route Selection Page.
 * Users click on the interactive map to set origin and destination.
 * Shows a summary of selected foods and a button to calculate logistics.
 *
 * @param {string[]} selectedFoods - Array of selected food IDs
 * @param {function} onResults - Callback when results are received from the backend
 * @param {object} advancedSettings - ML advanced settings state
 * @param {function} setAdvancedSettings - Setter for advanced settings
 */
function RouteSelectionPage({ selectedFoods, onResults, advancedSettings, setAdvancedSettings }) {
  const navigate = useNavigate();
  const [waypoints, setWaypoints] = useState([]);
  const [drivingDistanceKm, setDrivingDistanceKm] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Get food details for the selected food IDs
  const selectedFoodDetails = selectedFoods
    .map((id) => ALL_FOODS.find((f) => f.id === id))
    .filter(Boolean);

  // Handle the "Calculate" button click
  const handleCalculate = async () => {
    if (waypoints.length < 2 || selectedFoods.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await calculateLogistics(selectedFoods, waypoints, drivingDistanceKm);
      onResults(result);
      navigate('/results');
    } catch (err) {
      console.error('Calculation error:', err);
      setError(
        err.response?.data?.error ||
        'Failed to calculate logistics. Make sure the backend is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const canCalculate = waypoints.length >= 2 && selectedFoods.length > 0;

  return (
    <div className="route-page">
      <header className="route-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Back to Foods
        </button>
        <h1 className="route-title">Choose Your Route</h1>
        <p className="route-subtitle">
          Click on the map to set your origin and multiple destinations
        </p>
      </header>

      <div className="route-content">
        {/* Map Section */}
        <div className="route-map-section">
          <MapSelector
            waypoints={waypoints}
            onSetWaypoints={setWaypoints}
            onSetDistance={setDrivingDistanceKm}
          />
        </div>

        {/* Sidebar — Selected Foods + Actions */}
        <aside className="route-sidebar glass">
          <h3 className="sidebar-title">Selected Foods</h3>
          <div className="sidebar-foods">
            {selectedFoodDetails.map((food) => (
              <div key={food.id} className="sidebar-food-item">
                <span>{food.emoji}</span>
                <span>{food.name}</span>
                <span className="food-temp-tag">{food.optimalTemp}°C</span>
              </div>
            ))}
          </div>

          <div className="advanced-settings-container">
            <button
              className="btn-text"
              style={{ padding: '0', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-md)' }}
              onClick={() => setShowSettings(!showSettings)}
            >
              {showSettings ? '▼ Hide' : '▶ Show'} Advanced ML Settings
            </button>
            
            {showSettings && (
              <div className="advanced-settings-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div className="setting-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    Load Weight: {advancedSettings.perishableLoadTons} Tons
                  </label>
                  <input
                    type="range"
                    min="1" max="25" step="0.5"
                    value={advancedSettings.perishableLoadTons}
                    onChange={(e) => setAdvancedSettings({...advancedSettings, perishableLoadTons: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="setting-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    Environment Humidity: {advancedSettings.humidityPct}%
                  </label>
                  <input
                    type="range"
                    min="30" max="100" step="1"
                    value={advancedSettings.humidityPct}
                    onChange={(e) => setAdvancedSettings({...advancedSettings, humidityPct: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="setting-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    Expected Delay: {advancedSettings.delayHours} Hours
                  </label>
                  <input
                    type="range"
                    min="0" max="24" step="0.5"
                    value={advancedSettings.delayHours}
                    onChange={(e) => setAdvancedSettings({...advancedSettings, delayHours: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            id="calculate-btn"
            className="btn-primary btn-calculate"
            onClick={handleCalculate}
            disabled={!canCalculate || isLoading}
          >
            {isLoading ? (
              <span className="loading-text">
                <span className="spinner"></span>
                Calculating...
              </span>
            ) : (
              '🚀 Calculate Logistics'
            )}
          </button>
        </aside>
      </div>
    </div>
  );
}

export default RouteSelectionPage;
