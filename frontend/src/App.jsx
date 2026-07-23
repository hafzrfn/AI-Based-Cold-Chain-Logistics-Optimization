import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import FoodSelectionPage from './pages/FoodSelectionPage';
import RouteSelectionPage from './pages/RouteSelectionPage';
import ResultsPage from './pages/ResultsPage';
import OperationsPage from './pages/OperationsPage';
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

  // Theme state with localStorage persistence
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Advanced settings for ML predictions
  const [advancedSettings, setAdvancedSettings] = useState({
    perishableLoadTons: 5.0,
    humidityPct: 75,
    delayHours: 2.5,
    tempDeviation: 0.0,
  });

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
      <Navbar theme={theme} toggleTheme={toggleTheme} />
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
                advancedSettings={advancedSettings}
                setAdvancedSettings={setAdvancedSettings}
              />
            }
          />
          <Route
            path="/results"
            element={
              <ResultsPage
                results={results}
                selectedFoods={selectedFoods}
                advancedSettings={advancedSettings}
              />
            }
          />

          <Route
            path="/operations"
            element={
              <OperationsPage 
                results={results} 
                advancedSettings={advancedSettings} 
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
