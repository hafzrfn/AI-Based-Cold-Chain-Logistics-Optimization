"""
Flask Backend — ColdChain AI
=============================
REST API for cold chain logistics optimization.

Endpoints:
  GET  /api/health     → Health check
  GET  /api/foods      → Fetch food catalog from database
  POST /api/calculate  → Calculate logistics for selected foods and route
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from calculator import calculate_logistics
from models import get_all_foods, save_calculation_result
from operations import optimize_milk_run, calculate_cpm_pert

# ========== APP SETUP ==========

app = Flask(__name__)
CORS(app)  # Allow frontend to make requests


# ========== FOOD DATA (fallback if DB is empty) ==========
# This mirrors the frontend food data for calculation purposes
FOOD_DATA = {
    'chicken':     {'id': 'chicken',     'name': 'Chicken',     'optimal_temp': -2,  'shelf_life': 5},
    'beef':        {'id': 'beef',        'name': 'Beef',        'optimal_temp': -1.5,'shelf_life': 7},
    'pork':        {'id': 'pork',        'name': 'Pork',        'optimal_temp': -2,  'shelf_life': 5},
    'fish':        {'id': 'fish',        'name': 'Fish',        'optimal_temp': -1,  'shelf_life': 3},
    'lamb':        {'id': 'lamb',        'name': 'Lamb',        'optimal_temp': -1.5,'shelf_life': 7},
    'shrimp':      {'id': 'shrimp',      'name': 'Shrimp',      'optimal_temp': -2,  'shelf_life': 3},
    'lettuce':     {'id': 'lettuce',     'name': 'Lettuce',     'optimal_temp': 1,   'shelf_life': 10},
    'tomato':      {'id': 'tomato',      'name': 'Tomato',      'optimal_temp': 10,  'shelf_life': 14},
    'cauliflower': {'id': 'cauliflower', 'name': 'Cauliflower', 'optimal_temp': 0,   'shelf_life': 14},
    'apple':       {'id': 'apple',       'name': 'Apple',       'optimal_temp': 1,   'shelf_life': 30},
    'banana':      {'id': 'banana',      'name': 'Banana',      'optimal_temp': 13,  'shelf_life': 7},
    'strawberry':  {'id': 'strawberry',  'name': 'Strawberry',  'optimal_temp': 0,   'shelf_life': 5},
    'carrot':      {'id': 'carrot',      'name': 'Carrot',      'optimal_temp': 0,   'shelf_life': 21},
    'spinach':     {'id': 'spinach',     'name': 'Spinach',     'optimal_temp': 0,   'shelf_life': 7},
    'milk':        {'id': 'milk',        'name': 'Milk',        'optimal_temp': 2,   'shelf_life': 10},
    'yogurt':      {'id': 'yogurt',      'name': 'Yogurt',      'optimal_temp': 3,   'shelf_life': 14},
    'cheese':      {'id': 'cheese',      'name': 'Cheese',      'optimal_temp': 4,   'shelf_life': 30},
    'butter':      {'id': 'butter',      'name': 'Butter',      'optimal_temp': 2,   'shelf_life': 30},
    'cream':       {'id': 'cream',       'name': 'Cream',       'optimal_temp': 2,   'shelf_life': 7},
    'ice_cream':   {'id': 'ice_cream',   'name': 'Ice Cream',   'optimal_temp': -18, 'shelf_life': 60},
}


# ========== ROUTES ==========

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'ok', 'service': 'coldchain-api'})


@app.route('/api/foods', methods=['GET'])
def get_foods():
    """
    Fetch the food catalog.
    Tries the database first, falls back to in-memory data.
    """
    try:
        foods = get_all_foods()
        if foods:
            return jsonify(foods)
    except Exception as e:
        print(f"[WARN] Database fetch failed, using fallback: {e}")

    # Fallback: return in-memory data
    return jsonify(list(FOOD_DATA.values()))


@app.route('/api/calculate', methods=['POST'])
def calculate():
    """
    Calculate logistics for selected foods and route.
    
    Expected JSON body:
    {
        "foods": ["chicken", "milk", ...],
        "waypoints": [
            { "lat": 13.75, "lng": 100.5, "name": "Bangkok" },
            { "lat": 35.68, "lng": 139.69, "name": "Tokyo" }
        ],
        "drivingDistanceKm": 4500
    }
    """
    data = request.get_json()

    # Validate input
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    food_ids = data.get('foods', [])
    waypoints = data.get('waypoints', [])
    driving_distance_km = data.get('drivingDistanceKm')

    if not food_ids:
        return jsonify({'error': 'No foods selected'}), 400
    if not waypoints or len(waypoints) < 2:
        return jsonify({'error': 'At least two waypoints are required'}), 400
    for wp in waypoints:
        if 'lat' not in wp or 'lng' not in wp:
            return jsonify({'error': 'All waypoints must have lat and lng'}), 400

    # Look up food data for each selected food ID
    foods = []
    for food_id in food_ids:
        food = FOOD_DATA.get(food_id)
        if food:
            foods.append(food)
        else:
            return jsonify({'error': f'Unknown food: {food_id}'}), 400

    # Run the calculation algorithm
    result = calculate_logistics(foods, waypoints, driving_distance_km)

    # Save to database (non-blocking — don't fail if DB is down)
    try:
        calc_id = save_calculation_result(food_ids, waypoints[0], waypoints[-1], result)
        result['calculation_id'] = calc_id
    except Exception as e:
        print(f"[WARN] Failed to save to database: {e}")

    return jsonify(result)

@app.route('/api/network-insights', methods=['GET'])
def get_network_insights():
    """Returns static precomputed route network analysis."""
    import os
    import json
    file_path = os.path.join(os.path.dirname(__file__), 'network_insights.json')
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            return jsonify(json.load(f))
    return jsonify({'error': 'Insights not generated yet'}), 404

@app.route('/api/milkrun', methods=['POST'])
def milkrun():
    """Calculates optimized milk run route for given waypoints."""
    data = request.get_json()
    if not data or 'waypoints' not in data:
        return jsonify({'error': 'No waypoints provided'}), 400
    
    result = optimize_milk_run(data['waypoints'])
    return jsonify(result)

@app.route('/api/schedule', methods=['GET'])
def schedule():
    """Returns CPM and PERT analysis for cold chain operations."""
    result = calculate_cpm_pert()
    return jsonify(result)

# ========== MAIN ==========

if __name__ == '__main__':
    print("[*] ColdChain AI Backend starting...")
    print("[*] API running at http://localhost:5000")
    app.run(debug=True, port=5000)
