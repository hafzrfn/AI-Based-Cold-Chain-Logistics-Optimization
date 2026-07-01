import './FoodCard.css';

/**
 * Reusable card component for a single food item.
 * Displays emoji, name, and optimal temperature.
 * Toggles selection state on click.
 *
 * @param {object} food - Food item data (id, name, emoji, optimalTemp)
 * @param {boolean} isSelected - Whether the food is currently selected
 * @param {function} onToggle - Callback when the card is clicked
 * @param {string} accentColor - Category color for selection glow
 */
function FoodCard({ food, isSelected, onToggle, accentColor }) {
  return (
    <button
      id={`food-card-${food.id}`}
      className={`food-card glass ${isSelected ? 'selected' : ''}`}
      onClick={() => onToggle(food.id)}
      style={{
        '--card-accent': accentColor,
      }}
      aria-pressed={isSelected}
      aria-label={`${food.name} - optimal temperature ${food.optimalTemp}°C`}
    >
      <span className="food-card-emoji">{food.emoji}</span>
      <span className="food-card-name">{food.name}</span>
      <span className="food-card-temp">{food.optimalTemp}°C</span>
      {isSelected && <span className="food-card-check">✓</span>}
    </button>
  );
}

export default FoodCard;
