"""
Cold Chain Logistics Calculator
================================
Core algorithm for calculating logistics parameters:
- Transit time (based on distance and auto-recommended transport mode)
- Optimal temperature (most restrictive food requirement)
- Cost (base + distance + refrigeration + food quantity)
- CO2 emissions (transport + refrigeration energy)

All values are based on research-backed cold chain logistics parameters.
"""

import math

# ========== CONSTANTS ==========

# Transport mode speeds (km/h) and characteristics
TRANSPORT_MODES = {
    'truck': {
        'speed_kmh': 60,           # Average highway speed
        'cost_per_km': 1.20,       # USD per km
        'co2_per_km': 0.062,       # kg CO2 per km per ton
        'max_distance': 2000,      # Maximum practical distance (km)
        'label': 'Refrigerated Truck',
    },
    'ship': {
        'speed_kmh': 30,           # Average container ship speed
        'cost_per_km': 0.15,       # USD per km (much cheaper)
        'co2_per_km': 0.008,       # kg CO2 per km per ton
        'max_distance': 20000,     # Practically unlimited
        'label': 'Refrigerated Container Ship',
    },
    'air': {
        'speed_kmh': 800,          # Average cargo plane speed
        'cost_per_km': 4.50,       # USD per km (most expensive)
        'co2_per_km': 0.500,       # kg CO2 per km per ton
        'max_distance': 15000,     # Long range
        'label': 'Air Freight',
    },
}

# Refrigeration energy cost: more extreme temperatures cost more
REFRIGERATION_COST_PER_HOUR = 2.50     # Base USD/hour for refrigeration
REFRIGERATION_CO2_PER_HOUR = 0.80      # kg CO2/hour for refrigeration unit

# Base costs
BASE_HANDLING_COST = 150.0             # USD for loading/unloading
COST_PER_FOOD_ITEM = 25.0             # Additional cost per distinct food type


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great-circle distance between two points
    on Earth using the Haversine formula.
    
    Returns distance in kilometers.
    """
    R = 6371  # Earth's radius in km

    # Convert to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))

    return R * c


def recommend_transport(distance):
    """
    Auto-recommend the best transport mode based on distance.
    
    Rules:
    - Under 1500 km: Truck (fastest door-to-door for short distances)
    - 1500–5000 km: Air (when speed matters for perishables)
    - Over 5000 km: Ship (cost-effective for long distances)
    """
    if distance < 1500:
        return 'truck'
    elif distance < 5000:
        return 'air'
    else:
        return 'ship'


def calculate_optimal_temp(foods):
    """
    Determine the optimal transport temperature.
    Uses the MOST RESTRICTIVE (lowest) temperature among all foods,
    because the truck must be cold enough for the most sensitive item.
    
    Args:
        foods: list of dicts with 'optimal_temp' key
    
    Returns:
        float: optimal temperature in Celsius
    """
    if not foods:
        return 2.0  # Default refrigerator temp
    return min(food['optimal_temp'] for food in foods)


def calculate_time(distance, transport_mode):
    """
    Calculate transit time based on distance and transport mode.
    Includes additional time for loading/unloading and customs.
    
    Returns:
        float: time in hours
    """
    mode = TRANSPORT_MODES[transport_mode]
    travel_time = distance / mode['speed_kmh']

    # Add handling time (loading + unloading)
    handling_time = 4.0  # hours

    # Add customs/border time for longer distances
    if distance > 1000:
        handling_time += 6.0  # International customs

    return round(travel_time + handling_time, 1)


def calculate_cost(distance, num_food_types, transport_mode, optimal_temp):
    """
    Calculate the estimated logistics cost in USD.
    
    Components:
    1. Base handling cost (loading/unloading)
    2. Per-km transport cost
    3. Per-food-type cost (different foods need different handling)
    4. Refrigeration premium (colder = more expensive)
    5. Time-based refrigeration energy cost
    """
    mode = TRANSPORT_MODES[transport_mode]

    # Base transport cost
    transport_cost = distance * mode['cost_per_km']

    # Food handling cost
    food_cost = num_food_types * COST_PER_FOOD_ITEM

    # Refrigeration premium: colder temperatures cost more energy
    # Frozen goods (below 0°C) have significantly higher cooling costs
    temp_factor = 1.0
    if optimal_temp < -10:
        temp_factor = 2.5  # Deep freeze
    elif optimal_temp < 0:
        temp_factor = 1.8  # Frozen
    elif optimal_temp < 5:
        temp_factor = 1.3  # Chilled
    
    # Time-based refrigeration cost
    travel_time = distance / mode['speed_kmh']
    refrigeration_cost = REFRIGERATION_COST_PER_HOUR * travel_time * temp_factor

    total_cost = BASE_HANDLING_COST + transport_cost + food_cost + refrigeration_cost

    return round(total_cost, 2)


def calculate_emissions(distance, transport_mode, time_hours, optimal_temp):
    """
    Calculate CO2 emissions in kg.
    
    Components:
    1. Transport emissions (fuel combustion)
    2. Refrigeration unit emissions (electricity/diesel for cooling)
    """
    mode = TRANSPORT_MODES[transport_mode]

    # Transport emissions (assuming ~1 ton cargo)
    transport_co2 = distance * mode['co2_per_km']

    # Refrigeration emissions (colder = more energy = more CO2)
    temp_factor = 1.0
    if optimal_temp < -10:
        temp_factor = 2.0
    elif optimal_temp < 0:
        temp_factor = 1.5
    elif optimal_temp < 5:
        temp_factor = 1.2

    refrigeration_co2 = REFRIGERATION_CO2_PER_HOUR * time_hours * temp_factor

    total_co2 = transport_co2 + refrigeration_co2

    return round(total_co2, 2)


def calculate_logistics(foods, waypoints, driving_distance_km=None):
    """
    Main calculation function — the heart of the application.
    
    Args:
        foods: list of food dicts with 'optimal_temp' and 'id' keys
        waypoints: list of dicts with 'lat', 'lng', 'name'
        driving_distance_km: float or None
    
    Returns:
        dict with all logistics calculation results
    """
    # Step 1: Use actual driving distance, fallback to Haversine formula across waypoints
    if driving_distance_km is not None:
        distance = float(driving_distance_km)
    else:
        distance = 0
        for i in range(len(waypoints) - 1):
            distance += haversine_distance(
                waypoints[i]['lat'], waypoints[i]['lng'],
                waypoints[i+1]['lat'], waypoints[i+1]['lng']
            )

    # Step 2: Auto-recommend the best transport mode
    transport_mode = recommend_transport(distance)

    # Step 3: Determine optimal temperature (most restrictive)
    optimal_temp = calculate_optimal_temp(foods)

    # Step 4: Calculate transit time
    time_hours = calculate_time(distance, transport_mode)

    # Step 5: Calculate cost
    cost_usd = calculate_cost(distance, len(foods), transport_mode, optimal_temp)

    # Step 6: Calculate CO2 emissions
    co2_kg = calculate_emissions(distance, transport_mode, time_hours, optimal_temp)

    return {
        'distance': round(distance, 1),
        'distance_miles': round(distance / 1.60934, 1),
        'transport_mode': transport_mode,
        'transport_label': TRANSPORT_MODES[transport_mode]['label'],
        'time_hours': time_hours,
        'optimal_temp': optimal_temp,
        'temp_deviation_abs': round(abs(optimal_temp - 4.0), 2),
        'cost_usd': cost_usd,
        'co2_kg': co2_kg,
        'origin_name': waypoints[0].get('name', 'Unknown'),
        'destination_name': waypoints[-1].get('name', 'Unknown') if len(waypoints) > 1 else 'Unknown',
        'stop_count': len(waypoints),
        'waypoints': waypoints,
    }
