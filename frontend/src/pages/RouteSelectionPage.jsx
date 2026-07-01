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
 */
function RouteSelectionPage({ selectedFoods, onResults }) {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get food details for the selected food IDs
  const selectedFoodDetails = selectedFoods
    .map((id) => ALL_FOODS.find((f) => f.id === id))
    .filter(Boolean);

  // Handle the "Calculate" button click
  const handleCalculate = async () => {
    if (!origin || !destination || selectedFoods.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await calculateLogistics(selectedFoods, origin, destination);
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

  const canCalculate = origin && destination && selectedFoods.length > 0;

  return (
    <div className="route-page">
      <header className="route-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Back to Foods
        </button>
        <h1 className="route-title">Choose Your Route</h1>
        <p className="route-subtitle">
          Click on the map to set your origin and destination points
        </p>
      </header>

      <div className="route-content">
        {/* Map Section */}
        <div className="route-map-section">
          <MapSelector
            origin={origin}
            destination={destination}
            onSetOrigin={setOrigin}
            onSetDestination={setDestination}
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
