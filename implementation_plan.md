# Integrating ML Predictions into the Cold Chain Website

## Background

Your FinalizedModelv3.py trains three ML models (Logistic Regression, Random Forest, XGBoost) to predict three risk targets:
- **Spoilage Risk** — probability of food spoiling
- **Delay Risk** — probability of a significant delay event
- **Cold Chain Failure** — probability the cold chain breaks (temperature excursion)

It already has an `export_model_for_web()` function that dumps Logistic Regression coefficients as JSON. The goal is to take those exported models and wire them into your existing website so users see AI-powered risk predictions alongside the current logistics calculations.

## User Review Required

> [!IMPORTANT]
> **Feature Mapping Decision**: Your ML model expects 6 input features: `perishable_load_tons`, `distance_miles`, `temp_c`, `temp_deviation_abs`, `humidity_pct`, `delay_hours`. The current website only provides the distance and the food optimal temperature from user input. The other features (load weight, humidity, delay hours) are not collected from the user. I propose we **derive sensible defaults** from the existing inputs and expose optional "Advanced Settings" sliders so users *can* tweak them if they want. See the mapping table below.

> [!IMPORTANT]
> **Which model to use on the web?** Your v3 exports Logistic Regression as JSON. This is the simplest and most deployment-friendly option — the math runs in pure JavaScript with zero Python dependency in the browser. XGBoost/Random Forest would require keeping the Flask backend in the prediction loop (slower, needs the server). **I recommend Logistic Regression for the web integration** since it's already set up for export and runs instantly client-side.

## Open Questions

1. **Do you want the predictions to run entirely in the browser (client-side JS) or go through the Flask backend?**
   - Client-side (recommended): Faster, no server roundtrip, uses the JSON exports you already have
   - Server-side: More flexible (could use XGBoost), but adds latency and requires `joblib`/`scikit-learn`/`xgboost` on Vercel (heavy)

2. **Are you okay with deriving default values for features the user doesn't directly input?** For example, estimating `perishable_load_tons` as a fixed default (e.g. 5 tons) and letting users optionally adjust it?

## Proposed Changes

### How the ML features will be sourced

| ML Feature | Source | How |
|---|---|---|
| `distance_miles` | Already calculated | Haversine distance ÷ 1.609 to convert km → miles |
| `temp_c` | Already calculated | `optimal_temp` from the most restrictive food selection |
| `temp_deviation_abs` | Derived | `abs(temp_c - 4.0)` — same as model training |
| `humidity_pct` | Default + optional slider | Default: 75% (median of training data). User can adjust via advanced panel |
| `perishable_load_tons` | Default + optional slider | Default: 5.0 tons. User can adjust |
| `delay_hours` | Default + optional slider | Default: 2.5 hours (mean of exponential distribution used in training). User can adjust |

---

### Step 1: Run FinalizedModelv3.py to generate JSON exports

Before any code changes, you need to run your model script once to produce the three JSON files:
- `Cold_Chain_Failure_logreg_web_export.json`
- `Delay_Risk_logreg_web_export.json`
- `Spoilage_Risk_logreg_web_export.json`

These get copied into the frontend.

---

### Frontend Changes

#### [NEW] [ml_models/](file:///c:/Users/User/Documents/Kuliah/FSci%20Thailand%20Internship/Cold%20Chain%20Website/frontend/src/ml_models/)
A new directory containing:
- The 3 exported JSON model files (coefficients, scaler params)
- A `predict.js` module that implements the Logistic Regression prediction in pure JavaScript:
  1. Takes raw feature values
  2. Standardizes them using the exported `scaler_mean` and `scaler_scale`
  3. Computes the dot product with `coefficients` + `intercept`
  4. Passes through a sigmoid to get a probability (0–1)
  5. Computes the composite risk score and alert level

```js
// The core prediction is literally just this:
function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

function predict(features, model) {
  // Step 1: Standardize (same as StandardScaler)
  const scaled = features.map((val, i) =>
    (val - model.scaler_mean[i]) / model.scaler_scale[i]
  );
  // Step 2: Weighted sum + intercept
  const z = scaled.reduce((sum, val, i) =>
    sum + val * model.coefficients[i], model.intercept
  );
  // Step 3: Sigmoid → probability
  return sigmoid(z);
}
```

#### [MODIFY] [calculator.py](file:///c:/Users/User/Documents/Kuliah/FSci%20Thailand%20Internship/Cold%20Chain%20Website/backend/calculator.py)
Add `distance_miles` and `temp_deviation_abs` to the returned result dict so the frontend has all the values it needs for ML prediction without recalculating.

#### [MODIFY] [ResultsPage.jsx](file:///c:/Users/User/Documents/Kuliah/FSci%20Thailand%20Internship/Cold%20Chain%20Website/frontend/src/pages/ResultsPage.jsx)
- Import the `predict.js` module and the 3 JSON model files
- After receiving backend results, immediately run the 3 predictions client-side
- Display a new **"AI Risk Assessment"** section below the existing result cards, showing:
  - Spoilage Risk % (with color-coded progress bar)
  - Delay Risk % (with color-coded progress bar)
  - Cold Chain Failure Risk % (with color-coded progress bar)
  - Overall Composite Risk Score (0–100)
  - Alert Level badge (NOMINAL / WARNING / CRITICAL)

#### [NEW] [RiskPanel.jsx](file:///c:/Users/User/Documents/Kuliah/FSci%20Thailand%20Internship/Cold%20Chain%20Website/frontend/src/components/RiskPanel.jsx) + [RiskPanel.css](file:///c:/Users/User/Documents/Kuliah/FSci%20Thailand%20Internship/Cold%20Chain%20Website/frontend/src/components/RiskPanel.css)
A new component that renders the AI risk assessment section. Takes the three probabilities and renders:
- Animated progress bars for each risk category
- A composite score gauge
- The triage alert badge (CRITICAL = red, WARNING = amber, NOMINAL = green)

#### [MODIFY] [RouteSelectionPage.jsx](file:///c:/Users/User/Documents/Kuliah/FSci%20Thailand%20Internship/Cold%20Chain%20Website/frontend/src/pages/RouteSelectionPage.jsx)
Add an optional **"Advanced Settings"** collapsible panel in the sidebar where users can override the default values for `perishable_load_tons`, `humidity_pct`, and `delay_hours`. These values get passed through to the results page for ML prediction.

---

### Backend Changes

#### [MODIFY] [calculator.py](file:///c:/Users/User/Documents/Kuliah/FSci%20Thailand%20Internship/Cold%20Chain%20Website/backend/calculator.py)
Add two new fields to the return dict of `calculate_logistics()`:
```python
'distance_miles': round(distance / 1.609, 1),
'temp_deviation_abs': round(abs(optimal_temp - 4.0), 2),
```

No other backend changes needed — all ML inference happens in the browser.

---

## Data Flow (After Integration)

```
User selects foods + clicks map
        ↓
Frontend sends to Flask: { foods, origin, destination }
        ↓
Flask returns: { distance, cost, co2, optimal_temp, distance_miles, temp_deviation_abs, ... }
        ↓
Frontend runs predict.js locally (no server call):
  → Spoilage probability
  → Delay probability  
  → Cold Chain Failure probability
  → Composite Risk Score + Alert Level
        ↓
ResultsPage renders everything: logistics cards + AI risk panel
```

## Verification Plan

### Manual Verification
- Run FinalizedModelv3.py to generate JSON exports
- Compare a few manual predictions (pick known input values, compute by hand) against the website's output to confirm the JS sigmoid math matches Python's output exactly
- Test edge cases: very short routes, very long routes, frozen goods vs. room-temp goods
- Verify the UI renders correctly with all three alert states (NOMINAL, WARNING, CRITICAL)
