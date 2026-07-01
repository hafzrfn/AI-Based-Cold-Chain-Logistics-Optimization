import { useState } from 'react';
import FoodCard from './FoodCard';
import './CategoryRow.css';

/**
 * Expandable category row that displays food items when clicked.
 * Shows category name, emoji, item count, and selected count badge.
 *
 * @param {object} category - Category data (id, name, emoji, description, color, items)
 * @param {string[]} selectedFoods - Currently selected food IDs
 * @param {function} onToggleFood - Callback to toggle a food item's selection
 */
function CategoryRow({ category, selectedFoods, onToggleFood }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Count how many items in this category are selected
  const selectedCount = category.items.filter((item) =>
    selectedFoods.includes(item.id)
  ).length;

  return (
    <div
      className={`category-row ${isExpanded ? 'expanded' : ''}`}
      id={`category-${category.id}`}
      style={{ '--category-color': category.color }}
    >
      {/* Category Header — click to expand/collapse */}
      <button
        className="category-header glass"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={`category-items-${category.id}`}
      >
        <div className="category-info">
          <span className="category-emoji">{category.emoji}</span>
          <div className="category-text">
            <h2 className="category-name">{category.name}</h2>
            <p className="category-description">{category.description}</p>
          </div>
        </div>

        <div className="category-meta">
          {selectedCount > 0 && (
            <span className="category-badge">{selectedCount} selected</span>
          )}
          <span className="category-count">{category.items.length} items</span>
          <span className={`category-chevron ${isExpanded ? 'rotated' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {/* Expandable Food Items Grid */}
      <div
        id={`category-items-${category.id}`}
        className={`category-items ${isExpanded ? 'visible' : ''}`}
      >
        <div className="category-items-grid">
          {category.items.map((food, index) => (
            <div
              key={food.id}
              className="category-item-wrapper"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <FoodCard
                food={food}
                isSelected={selectedFoods.includes(food.id)}
                onToggle={onToggleFood}
                accentColor={category.color}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CategoryRow;
