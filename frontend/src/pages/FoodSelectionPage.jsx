import { useNavigate } from 'react-router-dom';
import { FOOD_CATEGORIES } from '../data/foods';
import CategoryRow from '../components/CategoryRow';
import './FoodSelectionPage.css';

/**
 * Landing page — Step 1: Select foods from 3 categories.
 * Each category (Meat, Vegetables & Fruits, Dairy) is an expandable row.
 *
 * @param {string[]} selectedFoods - Array of selected food IDs
 * @param {function} onToggleFood - Callback to toggle a food item
 */
function FoodSelectionPage({ selectedFoods, onToggleFood }) {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate('/route');
  };

  return (
    <div className="food-selection-page">
      {/* Hero Section */}
      <header className="page-hero">
        <h1 className="page-title">
          <span className="title-icon">❄️</span>
          Cold Chain Logistics Optimizer
        </h1>
        <p className="page-subtitle">
          Select the perishable foods you need to transport. Our AI will calculate
          the optimal logistics parameters for your shipment.
        </p>
      </header>

      {/* Food Categories */}
      <section className="categories-section" id="food-categories">
        <div className="categories-list">
          {FOOD_CATEGORIES.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              selectedFoods={selectedFoods}
              onToggleFood={onToggleFood}
            />
          ))}
        </div>
      </section>

      {/* Bottom Bar — Selected items summary + Continue button */}
      <div className={`bottom-bar glass ${selectedFoods.length > 0 ? 'visible' : ''}`}>
        <div className="bottom-bar-info">
          <span className="bottom-bar-count">{selectedFoods.length}</span>
          <span className="bottom-bar-label">
            {selectedFoods.length === 1 ? 'item' : 'items'} selected
          </span>
        </div>
        <button
          id="continue-to-route-btn"
          className="btn-primary"
          onClick={handleContinue}
          disabled={selectedFoods.length === 0}
        >
          Continue to Route Selection →
        </button>
      </div>
    </div>
  );
}

export default FoodSelectionPage;
