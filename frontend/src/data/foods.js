/**
 * Food catalog data organized by category.
 * Each food has properties used in logistics calculations:
 * - optimalTemp: ideal storage temperature in Celsius
 * - shelfLife: maximum shelf life in days under optimal conditions
 */

export const FOOD_CATEGORIES = [
  {
    id: 'meat',
    name: 'Meat',
    emoji: '🥩',
    description: 'Fresh and frozen meat products',
    color: '#e74c3c',
    items: [
      { id: 'chicken', name: 'Chicken', emoji: '🍗', optimalTemp: -2, shelfLife: 5 },
      { id: 'beef', name: 'Beef', emoji: '🥩', optimalTemp: -1.5, shelfLife: 7 },
      { id: 'pork', name: 'Pork', emoji: '🐖', optimalTemp: -2, shelfLife: 5 },
      { id: 'fish', name: 'Fish', emoji: '🐟', optimalTemp: -1, shelfLife: 3 },
      { id: 'lamb', name: 'Lamb', emoji: '🐑', optimalTemp: -1.5, shelfLife: 7 },
      { id: 'shrimp', name: 'Shrimp', emoji: '🦐', optimalTemp: -2, shelfLife: 3 },
    ],
  },
  {
    id: 'vegetables_fruits',
    name: 'Vegetables & Fruits',
    emoji: '🥬',
    description: 'Fresh produce and fruits',
    color: '#27ae60',
    items: [
      { id: 'lettuce', name: 'Lettuce', emoji: '🥬', optimalTemp: 1, shelfLife: 10 },
      { id: 'tomato', name: 'Tomato', emoji: '🍅', optimalTemp: 10, shelfLife: 14 },
      { id: 'cauliflower', name: 'Cauliflower', emoji: '🥦', optimalTemp: 0, shelfLife: 14 },
      { id: 'apple', name: 'Apple', emoji: '🍎', optimalTemp: 1, shelfLife: 30 },
      { id: 'banana', name: 'Banana', emoji: '🍌', optimalTemp: 13, shelfLife: 7 },
      { id: 'strawberry', name: 'Strawberry', emoji: '🍓', optimalTemp: 0, shelfLife: 5 },
      { id: 'carrot', name: 'Carrot', emoji: '🥕', optimalTemp: 0, shelfLife: 21 },
      { id: 'spinach', name: 'Spinach', emoji: '🥬', optimalTemp: 0, shelfLife: 7 },
    ],
  },
  {
    id: 'dairy',
    name: 'Dairy',
    emoji: '🧀',
    description: 'Milk, cheese, and dairy products',
    color: '#f39c12',
    items: [
      { id: 'milk', name: 'Milk', emoji: '🥛', optimalTemp: 2, shelfLife: 10 },
      { id: 'yogurt', name: 'Yogurt', emoji: '🫙', optimalTemp: 3, shelfLife: 14 },
      { id: 'cheese', name: 'Cheese', emoji: '🧀', optimalTemp: 4, shelfLife: 30 },
      { id: 'butter', name: 'Butter', emoji: '🧈', optimalTemp: 2, shelfLife: 30 },
      { id: 'cream', name: 'Cream', emoji: '🍶', optimalTemp: 2, shelfLife: 7 },
      { id: 'ice_cream', name: 'Ice Cream', emoji: '🍦', optimalTemp: -18, shelfLife: 60 },
    ],
  },
];

/**
 * Flatten all food items across categories into a single array.
 * Useful for lookups by food ID.
 */
export const ALL_FOODS = FOOD_CATEGORIES.flatMap((category) =>
  category.items.map((item) => ({ ...item, category: category.id }))
);

/**
 * Find a food item by its ID.
 */
export const getFoodById = (id) => ALL_FOODS.find((food) => food.id === id);
