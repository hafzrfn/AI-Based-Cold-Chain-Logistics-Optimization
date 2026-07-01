import { useNavigate } from 'react-router-dom';
import ResultCard from '../components/ResultCard';
import { ALL_FOODS } from '../data/foods';
import './ResultsPage.css';

/**
 * Step 3: Results Dashboard Page.
 * Displays the logistics calculation results with animated cards.
 *
 * @param {object} results - Calculation results from the backend
 * @param {string[]} selectedFoods - Array of selected food IDs
 */
function ResultsPage({ results, selectedFoods }) {
  const navigate = useNavigate();

  // If no results, redirect back
  if (!results) {
    return (
      <div className="results-page">
        <div className="no-results glass">
          <h2>No results available</h2>
          <p>Please select foods and a route first.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            ← Start Over
          </button>
        </div>
      </div>
    );
  }

  const selectedFoodDetails = selectedFoods
    .map((id) => ALL_FOODS.find((f) => f.id === id))
    .filter(Boolean);

  // Transport mode labels
  const transportLabels = {
    truck: '🚛 Truck',
    ship: '🚢 Ship',
    air: '✈️ Air Freight',
  };

  return (
    <div className="results-page">
      <header className="results-header">
        <h1 className="results-title">Logistics Results</h1>
        <p className="results-subtitle">
          AI-optimized cold chain parameters for your shipment
        </p>
      </header>

      {/* Route Summary */}
      <div className="route-summary glass">
        <div className="route-summary-row">
          <div className="route-point">
            <span className="route-dot origin"></span>
            <div>
              <span className="route-label">Origin</span>
              <span className="route-name">{results.origin_name}</span>
            </div>
          </div>
          <div className="route-line">
            <span className="route-distance">{Number(results.distance).toLocaleString()} km</span>
            <span className="route-transport">
              {transportLabels[results.transport_mode] || results.transport_mode}
            </span>
          </div>
          <div className="route-point">
            <span className="route-dot destination"></span>
            <div>
              <span className="route-label">Destination</span>
              <span className="route-name">{results.destination_name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Result Cards Grid */}
      <div className="results-grid" id="results-grid">
        <ResultCard
          icon="⏱️"
          label="Transit Time"
          value={results.time_hours}
          unit="hours"
          color="#3b82f6"
          delay={0}
        />
        <ResultCard
          icon="🌡️"
          label="Optimal Temperature"
          value={results.optimal_temp}
          unit="°C"
          color="#10b981"
          delay={150}
        />
        <ResultCard
          icon="💰"
          label="Estimated Cost"
          value={results.cost_usd}
          unit="USD"
          color="#f59e0b"
          delay={300}
        />
        <ResultCard
          icon="🌿"
          label="CO₂ Emissions"
          value={results.co2_kg}
          unit="kg CO₂"
          color="#8b5cf6"
          delay={450}
        />
      </div>

      {/* Selected Foods Summary */}
      <div className="foods-summary glass">
        <h3 className="foods-summary-title">Transported Foods</h3>
        <div className="foods-summary-grid">
          {selectedFoodDetails.map((food) => (
            <div key={food.id} className="food-summary-chip">
              <span>{food.emoji}</span>
              <span>{food.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="results-actions">
        <button
          id="start-over-btn"
          className="btn-primary"
          onClick={() => navigate('/')}
        >
          ↺ Start Over
        </button>
        <button
          className="btn-secondary"
          onClick={() => navigate('/route')}
        >
          ← Change Route
        </button>
      </div>
    </div>
  );
}

export default ResultsPage;
