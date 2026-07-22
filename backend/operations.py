from calculator import haversine_distance
import math

def optimize_milk_run(waypoints):
    """
    Optimizes a route using Nearest Neighbor heuristic.
    First waypoint is assumed to be the depot.
    """
    if not waypoints or len(waypoints) < 2:
        return waypoints, 0

    depot = waypoints[0]
    unvisited = waypoints[1:]
    optimized_route = [depot]
    
    current_location = depot
    total_optimized_distance = 0
    
    while unvisited:
        # Find nearest neighbor
        nearest_idx = 0
        min_dist = float('inf')
        
        for i, wp in enumerate(unvisited):
            dist = haversine_distance(
                current_location['lat'], current_location['lng'],
                wp['lat'], wp['lng']
            )
            if dist < min_dist:
                min_dist = dist
                nearest_idx = i
                
        # Move to nearest
        next_location = unvisited.pop(nearest_idx)
        optimized_route.append(next_location)
        total_optimized_distance += min_dist
        current_location = next_location

    # Return to depot (closed loop milk run)
    return_dist = haversine_distance(
        current_location['lat'], current_location['lng'],
        depot['lat'], depot['lng']
    )
    optimized_route.append({**depot, 'name': depot.get('name', '') + " (Return)"})
    total_optimized_distance += return_dist

    # Calculate baseline distance (direct back and forth from depot to each stop)
    baseline_distance = 0
    for wp in waypoints[1:]:
        dist = haversine_distance(
            depot['lat'], depot['lng'],
            wp['lat'], wp['lng']
        )
        baseline_distance += (dist * 2)

    return {
        'optimized_route': optimized_route,
        'total_distance': round(total_optimized_distance, 1),
        'baseline_distance': round(baseline_distance, 1),
        'distance_saved': round(baseline_distance - total_optimized_distance, 1)
    }

def calculate_cpm_pert():
    """
    Standard CPM/PERT calculation for a typical cold chain delivery.
    """
    activities = [
        {'id': 'A', 'name': 'Vehicle Pre-cooling', 'optimistic': 1, 'most_likely': 2, 'pessimistic': 4, 'dependencies': []},
        {'id': 'B', 'name': 'Loading & Securing', 'optimistic': 1, 'most_likely': 2, 'pessimistic': 3, 'dependencies': ['A']},
        {'id': 'C', 'name': 'Documentation & QA Check', 'optimistic': 0.5, 'most_likely': 1, 'pessimistic': 2, 'dependencies': ['B']},
        {'id': 'D', 'name': 'Transport (Main Leg)', 'optimistic': 8, 'most_likely': 12, 'pessimistic': 18, 'dependencies': ['C']},
        {'id': 'E', 'name': 'Customs / Border Clearance', 'optimistic': 1, 'most_likely': 3, 'pessimistic': 8, 'dependencies': ['D']},
        {'id': 'F', 'name': 'Transport (Final Leg)', 'optimistic': 2, 'most_likely': 4, 'pessimistic': 6, 'dependencies': ['E']},
        {'id': 'G', 'name': 'Unloading at Destination', 'optimistic': 1, 'most_likely': 2, 'pessimistic': 4, 'dependencies': ['F']},
        {'id': 'H', 'name': 'Final Quality Inspection', 'optimistic': 0.5, 'most_likely': 1, 'pessimistic': 1.5, 'dependencies': ['G']},
    ]

    # Calculate TE and Variance
    for act in activities:
        act['te'] = round((act['optimistic'] + 4 * act['most_likely'] + act['pessimistic']) / 6, 2)
        act['variance'] = round(((act['pessimistic'] - act['optimistic']) / 6) ** 2, 2)
        act['es'] = 0
        act['ef'] = 0
        act['ls'] = 0
        act['lf'] = 0
        act['slack'] = 0

    # Forward Pass
    activity_dict = {a['id']: a for a in activities}
    
    for act in activities:
        max_ef_of_dependencies = 0
        for dep in act['dependencies']:
            if activity_dict[dep]['ef'] > max_ef_of_dependencies:
                max_ef_of_dependencies = activity_dict[dep]['ef']
        
        act['es'] = max_ef_of_dependencies
        act['ef'] = round(act['es'] + act['te'], 2)

    project_duration = max(a['ef'] for a in activities)

    # Backward Pass
    for act in reversed(activities):
        # find all activities that depend on this one
        dependents = [a for a in activities if act['id'] in a['dependencies']]
        
        if not dependents:
            act['lf'] = project_duration
        else:
            act['lf'] = min(a['ls'] for a in dependents)
            
        act['ls'] = round(act['lf'] - act['te'], 2)
        act['slack'] = round(act['ls'] - act['es'], 2)
        act['is_critical'] = (act['slack'] <= 0.01) # Use small epsilon for float comparison

    total_variance = sum(a['variance'] for a in activities if a['is_critical'])
    project_std_dev = round(math.sqrt(total_variance), 2)

    return {
        'activities': activities,
        'project_duration': project_duration,
        'project_variance': total_variance,
        'project_std_dev': project_std_dev
    }
