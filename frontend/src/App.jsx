import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import FoodSelectionPage from './pages/FoodSelectionPage';
import RouteSelectionPage from './pages/RouteSelectionPage';
import ResultsPage from './pages/ResultsPage';
import './App.css';

/**
 * Main App component.
 * Manages global state (selected foods, results) and routes between pages.
 * The 3-step flow: Food Selection → Route Selection → Results Dashboard
 */
function App() {
  // Global state shared across pages
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [results, setResults] = useState(null);

  /**
   * Toggle a food item's selection state.
   * If already selected, remove it. Otherwise, add it.
   */
  const handleToggleFood = (foodId) => {
    setSelectedFoods((prev) =>
      prev.includes(foodId)
        ? prev.filter((id) => id !== foodId)
        : [...prev, foodId]
    );
  };

  /**
   * Store results from the backend calculation.
   */
  const handleResults = (data) => {
    setResults(data);
  };

  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <FoodSelectionPage
                selectedFoods={selectedFoods}
                onToggleFood={handleToggleFood}
              />
            }
          />
          <Route
            path="/route"
            element={
              <RouteSelectionPage
                selectedFoods={selectedFoods}
                onResults={handleResults}
              />
            }
          />
          <Route
            path="/results"
            element={
              <ResultsPage
                results={results}
                selectedFoods={selectedFoods}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
