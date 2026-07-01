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
        "origin": { "lat": 13.75, "lng": 100.5, "name": "Bangkok" },
        "destination": { "lat": 35.68, "lng": 139.69, "name": "Tokyo" }
    }
    """
    data = request.get_json()

    # Validate input
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    food_ids = data.get('foods', [])
    origin = data.get('origin')
    destination = data.get('destination')

    if not food_ids:
        return jsonify({'error': 'No foods selected'}), 400
    if not origin or not destination:
        return jsonify({'error': 'Origin and destination are required'}), 400
    if 'lat' not in origin or 'lng' not in origin:
        return jsonify({'error': 'Origin must have lat and lng'}), 400
    if 'lat' not in destination or 'lng' not in destination:
        return jsonify({'error': 'Destination must have lat and lng'}), 400

    # Look up food data for each selected food ID
    foods = []
    for food_id in food_ids:
        food = FOOD_DATA.get(food_id)
        if food:
            foods.append(food)
        else:
            return jsonify({'error': f'Unknown food: {food_id}'}), 400

    # Run the calculation algorithm
    result = calculate_logistics(foods, origin, destination)

    # Save to database (non-blocking — don't fail if DB is down)
    try:
        calc_id = save_calculation_result(food_ids, origin, destination, result)
        result['calculation_id'] = calc_id
    except Exception as e:
        print(f"[WARN] Failed to save to database: {e}")

    return jsonify(result)


# ========== MAIN ==========

if __name__ == '__main__':
    print("[*] ColdChain AI Backend starting...")
    print("[*] API running at http://localhost:5000")
    app.run(debug=True, port=5000)
