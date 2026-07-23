#!/usr/bin/env python3
"""
Cold Chain Logistics Analyzer — Complete Standalone Script
============================================================

Run directly with:
    python cold_chain_analyzer.py

This script will:
1. Analyze CPM, PERT, and Milk Run for cold chain logistics
2. Generate 6 publication-ready figures
3. Print all result tables to console
4. Save figures to ./output/ folder

Author: [Your Name]
Date: 2026
"""

import os
import sys
import numpy as np
import pandas as pd
from scipy.stats import norm  # scipy is kept — used in run_pert() computation

# ============================================================
# CONFIGURATION — MODIFY THESE FOR YOUR SCENARIO
# ============================================================

# ============================================================
# CONFIGURATION — CHANGE THIS TO SET WHERE FIGURES ARE SAVED
# ============================================================

# Output directory for figures and results
# Examples:
#   # Check for environment variable first (highest priority)
# Set before running: export COLD_CHAIN_OUTPUT=/your/path
OUTPUT_DIR = os.environ.get("COLD_CHAIN_OUTPUT", "./output")                    # Current folder
#   OUTPUT_DIR = "C:/Users/YourName/Desktop"  # Windows
#   OUTPUT_DIR = "/home/username/Documents"     # Linux/Mac
#   OUTPUT_DIR = "../figures"                  # Parent folder

# Check for environment variable first (highest priority)
# Set before running: export COLD_CHAIN_OUTPUT=/your/path
OUTPUT_DIR = os.environ.get("COLD_CHAIN_OUTPUT", "./output")

# CPM Activities (cold chain operational workflow)
CPM_ACTIVITIES = {
    'A': {'name': 'Receive Order', 'predecessors': [], 'duration': 1},
    'B': {'name': 'Warehouse Picking', 'predecessors': ['A'], 'duration': 2},
    'C': {'name': 'Cold Storage Packing', 'predecessors': ['B'], 'duration': 2},
    'D': {'name': 'Quality Inspection', 'predecessors': ['C'], 'duration': 1},
    'E': {'name': 'Truck Loading', 'predecessors': ['C'], 'duration': 1},
    'F': {'name': 'Transportation', 'predecessors': ['D', 'E'], 'duration': 8},
    'G': {'name': 'Distribution Center', 'predecessors': ['F'], 'duration': 2},
    'H': {'name': 'Retail Delivery', 'predecessors': ['G'], 'duration': 1},
}

# PERT Three-Time Estimates (optimistic, most likely, pessimistic)
PERT_ESTIMATES = {
    'A': {'a': 0.5, 'm': 1.0, 'b': 2.0},
    'B': {'a': 1.0, 'm': 2.0, 'b': 4.0},
    'C': {'a': 1.0, 'm': 2.0, 'b': 3.0},
    'D': {'a': 0.5, 'm': 1.0, 'b': 2.0},
    'E': {'a': 0.5, 'm': 1.0, 'b': 2.0},
    'F': {'a': 5.0, 'm': 8.0, 'b': 14.0},
    'G': {'a': 1.0, 'm': 2.0, 'b': 4.0},
    'H': {'a': 0.5, 'm': 1.0, 'b': 2.0},
}

# Milk Run Configuration
# CHANGE THESE DESTINATIONS FOR DIFFERENT SCENARIOS
DEPOT = "Los Angeles, CA"
DESTINATIONS = {
    'Orange, CA': {'flow_kg': 350_000_000},
    'Riverside, CA': {'flow_kg': 400_000_000},
    'San Bernardino, CA': {'flow_kg': 500_000_000},
    'San Diego, CA': {'flow_kg': 300_000_000},
    'Ventura, CA': {'flow_kg': 250_000_000},
    'Kern, CA': {'flow_kg': 180_000_000},
}

# Cost parameters
TRANSPORT_RATE = 1.50      # $/km for truck
REFRIG_RATE = 0.50         # $/km
EMISSION_FACTOR = 1.20     # kg CO2/km
CARBON_PRICE = 50          # $/tonne CO2


# ============================================================
# COLD CHAIN LOGISTICS ANALYZER CLASS
# ============================================================

class ColdChainLogisticsAnalyzer:
    """Complete analyzer for cold chain logistics with figure generation."""

    def __init__(self):
        self.cpm_activities = {}
        self.pert_estimates = {}
        self.milk_run_depot = None
        self.milk_run_destinations = {}
        self.county_coords = {}
        self.transport_rate = TRANSPORT_RATE
        self.refrig_rate = REFRIG_RATE
        self.emission_factor = EMISSION_FACTOR
        self.carbon_price = CARBON_PRICE
        self.cpm_results = {}
        self.pert_results = {}
        self.milk_run_results = {}
        self._init_county_database()

    def _init_county_database(self):
        """Built-in database of US county coordinates."""
        self.county_coords = {
            'Los Angeles, CA': (34.0522, -118.2437),
            'Orange, CA': (33.7175, -117.8311),
            'Riverside, CA': (33.9533, -117.3962),
            'San Bernardino, CA': (34.1082, -117.2898),
            'San Diego, CA': (32.7157, -117.1611),
            'Ventura, CA': (34.3705, -119.1391),
            'Kern, CA': (35.2934, -118.9052),
            'Tulare, CA': (36.1342, -119.0819),
            'Fresno, CA': (36.7378, -119.7871),
            'Stanislaus, CA': (37.5500, -120.9900),
            'Imperial, CA': (32.8500, -115.5700),
            'Monterey, CA': (36.6000, -121.9000),
            'Maricopa, AZ': (33.3013, -112.0770),
            'Harris, TX': (29.7752, -95.3703),
            'Dallas, TX': (32.7767, -96.7970),
            'Bexar, TX': (29.4200, -98.4900),
            'Williamson, TX': (30.6500, -97.6000),
            'Collin, TX': (33.1800, -96.4900),
            'Travis, TX': (30.2700, -97.7400),
            'Cook, IL': (41.7377, -87.6976),
            'Will, IL': (41.4400, -87.9800),
            'Jefferson, IL': (38.1600, -89.0340),
            'New York, NY': (40.7128, -74.0060),
            'Northampton, PA': (40.7500, -75.3000),
            'Palm Beach, FL': (26.6400, -80.1000),
            'Hillsborough, FL': (27.9500, -82.3000),
            'Miami-Dade, FL': (25.7617, -80.1918),
            'St. Bernard, LA': (29.8690, -89.8400),
            'Ascension, LA': (30.2100, -90.9500),
            'Washington, NE': (41.5500, -96.2100),
            'Sarpy, NE': (41.1100, -96.0700),
            'Gage, NE': (40.2600, -96.6800),
            'Ada, ID': (43.4500, -116.2400),
            'Des Moines, IA': (41.5868, -93.6250),
            'King, WA': (47.4900, -121.8000),
            'Walla Walla, WA': (46.0646, -118.3430),
            'Benton, WA': (46.2300, -119.1300),
            'Knox, TN': (36.0200, -83.9200),
            'Nome Census Area, AK': (64.5000, -165.4000),
            'Fairfax, VA': (38.8300, -77.2800),
            'Milwaukee, WI': (43.0389, -87.9065),
            'Indianapolis, IN': (39.7684, -86.1581),
            'Detroit, MI': (42.3314, -83.0458),
            'Columbus, OH': (39.9612, -82.9988),
            'San Antonio, TX': (29.4241, -98.4936),
            'Fort Worth, TX': (32.7555, -97.3308),
            'Austin, TX': (30.2672, -97.7431),
        }

    def add_county_coordinate(self, county_name, latitude, longitude):
        self.county_coords[county_name] = (latitude, longitude)

    def set_cpm_activities(self, activities_dict):
        self.cpm_activities = activities_dict.copy()

    def run_cpm(self):
        if not self.cpm_activities:
            raise ValueError("CPM activities not set.")
        for act in self.cpm_activities:
            if not self.cpm_activities[act]['predecessors']:
                self.cpm_activities[act]['ES'] = 0
            else:
                self.cpm_activities[act]['ES'] = max(
                    self.cpm_activities[p]['EF'] 
                    for p in self.cpm_activities[act]['predecessors']
                )
            self.cpm_activities[act]['EF'] = (self.cpm_activities[act]['ES'] + 
                                               self.cpm_activities[act]['duration'])
        project_duration = max(a['EF'] for a in self.cpm_activities.values())
        for act in reversed(list(self.cpm_activities.keys())):
            successors = [k for k, v in self.cpm_activities.items() 
                         if act in v['predecessors']]
            if not successors:
                self.cpm_activities[act]['LF'] = project_duration
            else:
                self.cpm_activities[act]['LF'] = min(
                    self.cpm_activities[s]['LS'] for s in successors
                )
            self.cpm_activities[act]['LS'] = (self.cpm_activities[act]['LF'] - 
                                             self.cpm_activities[act]['duration'])
            self.cpm_activities[act]['slack'] = (self.cpm_activities[act]['LS'] - 
                                                 self.cpm_activities[act]['ES'])
        critical_path = [act for act in self.cpm_activities 
                        if self.cpm_activities[act]['slack'] == 0]
        self.cpm_results = {
            'project_duration': project_duration,
            'critical_path': critical_path,
            'activities': self.cpm_activities
        }
        return self.cpm_results

    def get_cpm_table(self):
        if not self.cpm_results: self.run_cpm()
        data = []
        for act in self.cpm_activities:
            data.append({
                'Activity': act,
                'Description': self.cpm_activities[act]['name'],
                'Duration (h)': self.cpm_activities[act]['duration'],
                'Predecessors': ', '.join(self.cpm_activities[act]['predecessors']) or '-',
                'ES': self.cpm_activities[act]['ES'],
                'EF': self.cpm_activities[act]['EF'],
                'LS': self.cpm_activities[act]['LS'],
                'LF': self.cpm_activities[act]['LF'],
                'Slack': self.cpm_activities[act]['slack'],
                'Critical': 'YES' if self.cpm_activities[act]['slack'] == 0 else 'NO'
            })
        return pd.DataFrame(data)

    def set_pert_estimates(self, pert_dict):
        self.pert_estimates = pert_dict.copy()

    def run_pert(self):
        if not self.pert_estimates:
            raise ValueError("PERT estimates not set.")
        total_te = 0
        total_variance = 0
        for act in self.pert_estimates:
            a, m, b = self.pert_estimates[act]['a'], self.pert_estimates[act]['m'], self.pert_estimates[act]['b']
            te = (a + 4*m + b) / 6
            variance = ((b - a) / 6) ** 2
            self.pert_estimates[act]['te'] = te
            self.pert_estimates[act]['variance'] = variance
            total_te += te
            total_variance += variance
        std_dev = np.sqrt(total_variance)
        if std_dev == 0:
            std_dev = 0.0001
            
        probabilities = {}
        for target in [17, 18, 19, 20, 21, 22, 23]:
            z = (target - total_te) / std_dev
            probabilities[target] = {'z_score': z, 'probability': norm.cdf(z) * 100}
        self.pert_results = {
            'expected_duration': total_te,
            'variance': total_variance,
            'std_dev': std_dev,
            'probabilities': probabilities,
            'estimates': self.pert_estimates
        }
        return self.pert_results

    def get_pert_table(self):
        if not self.pert_results: self.run_pert()
        data = []
        for act in self.pert_estimates:
            data.append({
                'Activity': act,
                'Optimistic (a)': self.pert_estimates[act]['a'],
                'Most Likely (m)': self.pert_estimates[act]['m'],
                'Pessimistic (b)': self.pert_estimates[act]['b'],
                'Expected (Te)': round(self.pert_estimates[act]['te'], 3),
                'Variance': round(self.pert_estimates[act]['variance'], 4)
            })
        return pd.DataFrame(data)

    def get_pert_probability_table(self):
        if not self.pert_results: self.run_pert()
        data = []
        for target, vals in self.pert_results['probabilities'].items():
            data.append({
                'Target Time (h)': target,
                'Z-Score': round(vals['z_score'], 3),
                'Probability (%)': round(vals['probability'], 2)
            })
        return pd.DataFrame(data)

    @staticmethod
    def haversine_km(lat1, lon1, lat2, lon2):
        R = 6371
        lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
        return R * 2 * np.arcsin(np.sqrt(a))

    def set_milk_run(self, depot, destinations):
        self.milk_run_depot = depot
        self.milk_run_destinations = destinations.copy()

    def configure_dynamic_scenario(self, waypoints, time_hours, load_tons):
        # 1. Update Coordinates and Milk Run configuration
        depot = waypoints[0]['name']
        destinations = {}
        # Distribute load evenly among destinations
        dest_load = load_tons * 1000 / max(1, len(waypoints) - 1) 
        
        for i, wp in enumerate(waypoints):
            name = wp['name']
            self.add_county_coordinate(name, wp['lat'], wp['lng'])
            if i > 0:
                destinations[name] = {'flow_kg': dest_load}
                
        self.set_milk_run(depot, destinations)
        
        # 2. Update CPM Activities dynamically based on transit time
        cpm = CPM_ACTIVITIES.copy()
        for k in cpm.keys():
            cpm[k] = cpm[k].copy() # deep copy inner dicts
        
        # Override Transportation (F) duration with dynamic time
        # Ensure it's at least 1 hour to prevent CPM issues
        cpm['F']['duration'] = max(1, round(time_hours))
        self.set_cpm_activities(cpm)
        
        # 3. Update PERT Estimates dynamically
        pert = PERT_ESTIMATES.copy()
        for k in pert.keys():
            pert[k] = pert[k].copy()
            
        m = max(1.0, float(time_hours))
        a = max(0.5, m * 0.75)
        b = m * 1.5
        pert['F'] = {'a': a, 'm': m, 'b': b}
        self.set_pert_estimates(pert)

    def run_milk_run(self):
        if not self.milk_run_depot or not self.milk_run_destinations:
            raise ValueError("Milk Run not set.")
        depot = self.milk_run_depot
        destinations = self.milk_run_destinations
        if depot not in self.county_coords:
            raise ValueError(f"Coordinate not found for depot: {depot}")
        depot_lat, depot_lon = self.county_coords[depot]
        all_locations = {depot: (depot_lat, depot_lon)}
        for dest in destinations:
            if dest not in self.county_coords:
                raise ValueError(f"Coordinate not found for: {dest}")
            all_locations[dest] = self.county_coords[dest]
        location_names = list(all_locations.keys())
        dist_matrix = pd.DataFrame(index=location_names, columns=location_names)
        for l1 in location_names:
            for l2 in location_names:
                if l1 == l2:
                    dist_matrix.loc[l1, l2] = 0.0
                else:
                    lat1, lon1 = all_locations[l1]
                    lat2, lon2 = all_locations[l2]
                    dist_matrix.loc[l1, l2] = round(self.haversine_km(lat1, lon1, lat2, lon2), 1)
        unvisited = set(destinations.keys())
        route = [depot]
        current = depot
        total_distance = 0
        step_details = []
        step = 1
        while unvisited:
            nearest = min(unvisited, key=lambda d: float(dist_matrix.loc[current, d]))
            dist = float(dist_matrix.loc[current, nearest])
            total_distance += dist
            step_details.append({'step': step, 'from': current, 'to': nearest, 'distance': dist})
            route.append(nearest)
            unvisited.remove(nearest)
            current = nearest
            step += 1
        return_dist = float(dist_matrix.loc[current, depot])
        total_distance += return_dist
        step_details.append({'step': step, 'from': current, 'to': depot, 'distance': return_dist})
        route.append(depot)
        direct_distance = sum(2 * float(dist_matrix.loc[depot, d]) for d in destinations)
        direct_transport = direct_distance * self.transport_rate
        direct_refrig = direct_distance * self.refrig_rate
        direct_co2 = direct_distance * self.emission_factor
        direct_co2_cost = (direct_co2 / 1000) * self.carbon_price
        direct_total = direct_transport + direct_refrig + direct_co2_cost
        milk_transport = total_distance * self.transport_rate
        milk_refrig = total_distance * self.refrig_rate
        milk_co2 = total_distance * self.emission_factor
        milk_co2_cost = (milk_co2 / 1000) * self.carbon_price
        milk_total = milk_transport + milk_refrig + milk_co2_cost
        total_flow = sum(d['flow_kg'] for d in destinations.values())
        self.milk_run_results = {
            'route': route,
            'step_details': step_details,
            'total_distance': total_distance,
            'direct_distance': direct_distance,
            'distance_savings_pct': ((direct_distance - total_distance) / direct_distance * 100) if direct_distance > 0 else 0,
            'direct_cost': direct_total,
            'milk_cost': milk_total,
            'cost_savings_pct': ((direct_total - milk_total) / direct_total * 100) if direct_total > 0 else 0,
            'direct_co2': direct_co2,
            'milk_co2': milk_co2,
            'co2_savings_pct': ((direct_co2 - milk_co2) / direct_co2 * 100) if direct_co2 > 0 else 0,
            'num_direct_trips': len(destinations),
            'num_milk_trips': 1,
            'total_flow_kg': total_flow,
            'distance_matrix': dist_matrix
        }
        return self.milk_run_results

    def get_milk_run_comparison_table(self):
        if not self.milk_run_results: self.run_milk_run()
        r = self.milk_run_results
        return pd.DataFrame({
            'KPI': ['Total Distance (km)', 'Number of Trips', 'Transport Cost ($)', 
                   'Refrig Cost ($)', 'CO2 (kg)', 'Total Cost ($)'],
            'Direct Delivery': [
                f"{r['direct_distance']:.1f}", f"{r['num_direct_trips']}",
                f"{r['direct_distance'] * self.transport_rate:,.2f}",
                f"{r['direct_distance'] * self.refrig_rate:,.2f}",
                f"{r['direct_co2']:.1f}", f"{r['direct_cost']:,.2f}"
            ],
            'Milk Run': [
                f"{r['total_distance']:.1f}", f"{r['num_milk_trips']}",
                f"{r['total_distance'] * self.transport_rate:,.2f}",
                f"{r['total_distance'] * self.refrig_rate:,.2f}",
                f"{r['milk_co2']:.1f}", f"{r['milk_cost']:,.2f}"
            ],
            'Savings': [
                f"{r['distance_savings_pct']:.1f}%",
                f"{((r['num_direct_trips'] - r['num_milk_trips']) / r['num_direct_trips'] * 100):.0f}%",
                f"{r['distance_savings_pct']:.1f}%",
                f"{r['distance_savings_pct']:.1f}%",
                f"{r['co2_savings_pct']:.1f}%",
                f"{r['cost_savings_pct']:.1f}%"
            ]
        })

    def run_all(self):
        print("Running CPM analysis...")
        self.run_cpm()
        print(f"  Project duration: {self.cpm_results['project_duration']} hours")
        print("Running PERT analysis...")
        self.run_pert()
        print(f"  Expected duration: {self.pert_results['expected_duration']:.2f} hours")
        print("Running Milk Run optimization...")
        self.run_milk_run()
        print(f"  Route distance: {self.milk_run_results['total_distance']:.1f} km")
        print(f"  Savings: {self.milk_run_results['cost_savings_pct']:.1f}%")
        return {'cpm': self.cpm_results, 'pert': self.pert_results, 
                'milk_run': self.milk_run_results}

    def get_json_results(self):
        if not self.cpm_results: self.run_all()
        
        # Convert DataFrames to dict records for JSON serialization
        cpm_table = self.get_cpm_table().to_dict(orient='records')
        pert_table = self.get_pert_table().to_dict(orient='records')
        prob_table = self.get_pert_probability_table().to_dict(orient='records')
        comp_table = self.get_milk_run_comparison_table().to_dict(orient='records')
        
        # Sanitize Milk Run Results (distance_matrix dataframe to dict)
        mr = self.milk_run_results.copy()
        if 'distance_matrix' in mr:
            del mr['distance_matrix'] # Not strictly needed in frontend and hard to serialize
            
        return {
            'cpm': {
                'project_duration': self.cpm_results['project_duration'],
                'critical_path': self.cpm_results['critical_path'],
                'table': cpm_table
            },
            'pert': {
                'expected_duration': self.pert_results['expected_duration'],
                'std_dev': self.pert_results['std_dev'],
                'table': pert_table,
                'probabilities': prob_table
            },
            'milk_run': {
                'results': mr,
                'comparison': comp_table
            }
        }

    # ==================== 6 SEPARATE FIGURES ====================

    def generate_figure_cpm_network(self, save_path):
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        import matplotlib.patches as mpatches
        from matplotlib.patches import Circle
        if not self.cpm_results: self.run_cpm()
        fig, ax = plt.subplots(figsize=(14, 8))
        ax.set_xlim(-0.5, 8.5)
        ax.set_ylim(-1, 3)
        ax.axis('off')
        ax.set_title('Figure 1: CPM Network Diagram', fontsize=16, fontweight='bold', pad=20)
        positions = {
            'A': (0, 1.5), 'B': (1, 1.5), 'C': (2, 1.5),
            'D': (3, 2.5), 'E': (3, 0.5), 'F': (4.5, 1.5),
            'G': (6, 1.5), 'H': (7.5, 1.5)
        }
        for act, (x, y) in positions.items():
            color = '#e74c3c' if self.cpm_activities[act]['slack'] == 0 else '#3498db'
            circle = Circle((x, y), 0.35, color=color, ec='black', linewidth=2, zorder=3)
            ax.add_patch(circle)
            ax.text(x, y, act, ha='center', va='center', fontsize=16, fontweight='bold', color='white', zorder=4)
            ax.text(x, y - 0.55, self.cpm_activities[act]['name'], ha='center', va='top', fontsize=9, color='#2c3e50')
            ax.text(x, y - 0.8, f"{self.cpm_activities[act]['duration']}h", ha='center', va='top', fontsize=10, fontweight='bold', color=color)
            ax.text(x - 0.38, y + 0.38, f'ES={self.cpm_activities[act]["ES"]}\nEF={self.cpm_activities[act]["EF"]}', 
                     fontsize=8, ha='left', va='top', 
                     bbox=dict(boxstyle='round,pad=0.2', facecolor='#3498db', alpha=0.3, edgecolor='none'))
            ax.text(x + 0.38, y - 0.38, f'LS={self.cpm_activities[act]["LS"]}\nLF={self.cpm_activities[act]["LF"]}', 
                     fontsize=8, ha='right', va='bottom',
                     bbox=dict(boxstyle='round,pad=0.2', facecolor='#f39c12', alpha=0.3, edgecolor='none'))
        ax.annotate('', xy=(0.65, 1.5), xytext=(0.35, 1.5), arrowprops=dict(arrowstyle='->', color='#2c3e50', lw=2))
        ax.annotate('', xy=(1.65, 1.5), xytext=(1.35, 1.5), arrowprops=dict(arrowstyle='->', color='#2c3e50', lw=2))
        ax.annotate('', xy=(2.7, 2.2), xytext=(2.35, 1.8), arrowprops=dict(arrowstyle='->', color='#2c3e50', lw=2))
        ax.annotate('', xy=(2.7, 0.8), xytext=(2.35, 1.2), arrowprops=dict(arrowstyle='->', color='#2c3e50', lw=2))
        ax.annotate('', xy=(4.15, 1.8), xytext=(3.35, 2.2), arrowprops=dict(arrowstyle='->', color='#2c3e50', lw=2))
        ax.annotate('', xy=(4.15, 1.2), xytext=(3.35, 0.8), arrowprops=dict(arrowstyle='->', color='#2c3e50', lw=2))
        ax.annotate('', xy=(5.65, 1.5), xytext=(4.85, 1.5), arrowprops=dict(arrowstyle='->', color='#2c3e50', lw=2))
        ax.annotate('', xy=(7.15, 1.5), xytext=(6.35, 1.5), arrowprops=dict(arrowstyle='->', color='#2c3e50', lw=2))
        cp = ' → '.join(self.cpm_results['critical_path'])
        ax.text(4, 2.9, f'Critical Path: {cp} | Duration: {self.cpm_results["project_duration"]} hours', 
                 ha='center', fontsize=12, fontweight='bold', color='#e74c3c',
                 bbox=dict(boxstyle='round,pad=0.5', facecolor='#ffeaa7', edgecolor='#e74c3c', linewidth=2))
        plt.tight_layout()
        filepath = f"{save_path}/figure_01_cpm_network.png"
        plt.savefig(filepath, dpi=200, bbox_inches='tight', facecolor='white')
        print(f"  Saved: {filepath}")
        plt.close(fig)
        return filepath

    def generate_figure_cpm_gantt(self, save_path):
        if not self.cpm_results: self.run_cpm()
        fig, ax = plt.subplots(figsize=(14, 8))
        activity_names = [self.cpm_activities[act]['name'] for act in self.cpm_activities]
        colors = ['#e74c3c' if self.cpm_activities[act]['slack'] == 0 else '#3498db' for act in self.cpm_activities]
        for i, act in enumerate(self.cpm_activities):
            es = self.cpm_activities[act]['ES']
            duration = self.cpm_activities[act]['duration']
            ax.barh(i, duration, left=es, height=0.6, color=colors[i], edgecolor='black', linewidth=1)
            ax.text(es + duration/2, i, f'{duration}h', ha='center', va='center', fontsize=11, fontweight='bold', color='white')
        ax.set_yticks(range(len(self.cpm_activities)))
        ax.set_yticklabels([f"{act}: {name}" for act, name in zip(self.cpm_activities.keys(), activity_names)], fontsize=11)
        ax.set_xlabel('Time (hours)', fontsize=13)
        ax.set_title('Figure 2: CPM Gantt Chart', fontsize=16, fontweight='bold', pad=15)
        ax.set_xlim(0, 18)
        ax.axvline(x=self.cpm_results['project_duration'], color='red', linestyle='--', linewidth=2, label=f'Completion: {self.cpm_results["project_duration"]}h')
        ax.grid(axis='x', alpha=0.3)
        red_patch = mpatches.Patch(color='#e74c3c', label='Critical Path (Slack = 0)')
        ax.legend(handles=[red_patch], loc='lower right', fontsize=10)
        plt.tight_layout()
        filepath = f"{save_path}/figure_02_cpm_gantt.png"
        plt.savefig(filepath, dpi=200, bbox_inches='tight', facecolor='white')
        print(f"  Saved: {filepath}")
        plt.close(fig)
        return filepath

    def generate_figure_pert_probability(self, save_path):
        if not self.pert_results: self.run_pert()
        fig, ax = plt.subplots(figsize=(12, 7))
        x = np.linspace(14, 25, 1000)
        y = norm.pdf(x, self.pert_results['expected_duration'], self.pert_results['std_dev'])
        ax.fill_between(x, y, alpha=0.3, color='#3498db')
        ax.plot(x, y, color='#2c3e50', linewidth=2)
        ax.axvline(x=self.pert_results['expected_duration'], color='#e74c3c', linestyle='--', linewidth=2, 
                   label=f'Expected: {self.pert_results["expected_duration"]:.2f}h')
        ax.axvline(x=17, color='green', linestyle='--', linewidth=2, label='CPM: 17h')
        ax.axvline(x=20, color='orange', linestyle='--', linewidth=2, label='20h (68.2%)')
        ax.axvline(x=22, color='purple', linestyle='--', linewidth=2, label='22h (94.6%)')
        x_17 = np.linspace(14, 17, 100)
        y_17 = norm.pdf(x_17, self.pert_results['expected_duration'], self.pert_results['std_dev'])
        ax.fill_between(x_17, y_17, alpha=0.4, color='green', label='P(T ≤ 17h) = 11.0%')
        ax.set_xlabel('Project Duration (hours)', fontsize=13)
        ax.set_ylabel('Probability Density', fontsize=13)
        ax.set_title('Figure 3: PERT Probability Distribution', fontsize=16, fontweight='bold', pad=15)
        ax.legend(loc='upper right', fontsize=10)
        ax.grid(alpha=0.3)
        plt.tight_layout()
        filepath = f"{save_path}/figure_03_pert_probability.png"
        plt.savefig(filepath, dpi=200, bbox_inches='tight', facecolor='white')
        print(f"  Saved: {filepath}")
        plt.close(fig)
        return filepath

    def generate_figure_pert_estimates(self, save_path):
        if not self.pert_results: self.run_pert()
        fig, ax = plt.subplots(figsize=(12, 7))
        acts = list(self.pert_estimates.keys())
        x_pos = np.arange(len(acts))
        width = 0.25
        a_vals = [self.pert_estimates[act]['a'] for act in acts]
        m_vals = [self.pert_estimates[act]['m'] for act in acts]
        b_vals = [self.pert_estimates[act]['b'] for act in acts]
        te_vals = [self.pert_estimates[act]['te'] for act in acts]
        ax.bar(x_pos - width, a_vals, width, label='Optimistic (a)', color='#2ecc71', edgecolor='black')
        ax.bar(x_pos, m_vals, width, label='Most Likely (m)', color='#f39c12', edgecolor='black')
        ax.bar(x_pos + width, b_vals, width, label='Pessimistic (b)', color='#e74c3c', edgecolor='black')
        ax.plot(x_pos, te_vals, 'ko-', linewidth=2, markersize=8, label='Expected (Te)')
        ax.set_xlabel('Activity', fontsize=13)
        ax.set_ylabel('Duration (hours)', fontsize=13)
        ax.set_title('Figure 4: PERT Three-Time Estimates', fontsize=16, fontweight='bold', pad=15)
        ax.set_xticks(x_pos)
        ax.set_xticklabels(acts, fontsize=12)
        ax.legend(loc='upper left', fontsize=10)
        ax.grid(axis='y', alpha=0.3)
        plt.tight_layout()
        filepath = f"{save_path}/figure_04_pert_estimates.png"
        plt.savefig(filepath, dpi=200, bbox_inches='tight', facecolor='white')
        print(f"  Saved: {filepath}")
        plt.close(fig)
        return filepath

    def generate_figure_milk_run_route(self, save_path):
        if not self.milk_run_results: self.run_milk_run()
        fig, ax = plt.subplots(figsize=(12, 10))
        mr = self.milk_run_results
        route = mr['route']
        route_coords = {}
        for loc in route:
            if loc in self.county_coords:
                route_coords[loc] = self.county_coords[loc]
        if route_coords:
            lats = [c[0] for c in route_coords.values()]
            lons = [c[1] for c in route_coords.values()]
            lat_range = max(lats) - min(lats) if max(lats) != min(lats) else 1
            lon_range = max(lons) - min(lons) if max(lons) != min(lons) else 1
            plot_coords = {}
            for loc, (lat, lon) in route_coords.items():
                plot_coords[loc] = ((lon - min(lons)) / lon_range * 4 - 2, 
                                   (lat - min(lats)) / lat_range * 3 - 1.5)
        else:
            plot_coords = {loc: (i % 3, i // 3) for i, loc in enumerate(set(route))}
        colors = plt.cm.rainbow(np.linspace(0, 1, len(route) - 1))
        for i in range(len(route) - 1):
            if route[i] in plot_coords and route[i+1] in plot_coords:
                start = plot_coords[route[i]]
                end = plot_coords[route[i+1]]
                ax.annotate('', xy=end, xytext=start,
                            arrowprops=dict(arrowstyle='->', color=colors[i], lw=3, 
                                           connectionstyle='arc3,rad=0.1'))
                mid_x = (start[0] + end[0]) / 2
                mid_y = (start[1] + end[1]) / 2
                dist = mr['step_details'][i]['distance'] if i < len(mr['step_details']) else 0
                ax.text(mid_x, mid_y + 0.15, f'{dist:.0f} km', fontsize=8, ha='center', 
                        color=colors[i], fontweight='bold',
                        bbox=dict(boxstyle='round,pad=0.15', facecolor='white', alpha=0.9, edgecolor='none'))
        for i, (loc, (x, y)) in enumerate(plot_coords.items()):
            if loc == self.milk_run_depot:
                circle = Circle((x, y), 0.18, color='#e74c3c', ec='black', linewidth=2.5, zorder=5)
                ax.add_patch(circle)
                ax.text(x, y, '★', ha='center', va='center', fontsize=20, color='white', zorder=6)
            else:
                circle = Circle((x, y), 0.12, color='#3498db', ec='black', linewidth=1.5, zorder=5)
                ax.add_patch(circle)
                ax.text(x, y, str(i), ha='center', va='center', fontsize=11, color='white', zorder=6)
            label = loc.split(',')[0]
            ax.text(x, y - 0.3, label, ha='center', va='top', fontsize=9, fontweight='bold')
        ax.set_xlim(-2.5, 2.5)
        ax.set_ylim(-2.5, 2.5)
        ax.set_aspect('equal')
        ax.axis('off')
        ax.set_title('Figure 5: Milk Run Optimized Route', fontsize=16, fontweight='bold', pad=15)
        route_str = ' → '.join([r.split(',')[0] for r in route])
        ax.text(0, 2.3, f'Route: {route_str}', ha='center', fontsize=10, fontweight='bold', color='#2c3e50',
                bbox=dict(boxstyle='round,pad=0.4', facecolor='#ffeaa7', edgecolor='#e74c3c', linewidth=2))
        ax.text(0, -2.3, f'Total: {mr["total_distance"]:.1f} km | Direct: {mr["direct_distance"]:.1f} km | Saved: {mr["distance_savings_pct"]:.1f}%', 
                ha='center', fontsize=11, fontweight='bold', color='#e74c3c')
        plt.tight_layout()
        filepath = f"{save_path}/figure_05_milk_run_route.png"
        plt.savefig(filepath, dpi=200, bbox_inches='tight', facecolor='white')
        print(f"  Saved: {filepath}")
        plt.close(fig)
        return filepath

    def generate_figure_milk_run_comparison(self, save_path):
        if not self.milk_run_results: self.run_milk_run()
        fig, ax = plt.subplots(figsize=(12, 8))
        mr = self.milk_run_results
        metrics = ['Distance\n(km)', 'Transport\nCost ($)', 'Refrig\nCost ($)', 'CO₂\n(kg)', 'Total Cost\n($)']
        direct_vals = [mr['direct_distance'], mr['direct_distance'] * self.transport_rate,
                      mr['direct_distance'] * self.refrig_rate, mr['direct_co2'], mr['direct_cost']]
        milk_vals = [mr['total_distance'], mr['total_distance'] * self.transport_rate,
                    mr['total_distance'] * self.refrig_rate, mr['milk_co2'], mr['milk_cost']]
        x = np.arange(len(metrics))
        width = 0.35
        bars1 = ax.bar(x - width/2, direct_vals, width, label='Direct Delivery', color='#e74c3c', edgecolor='black', alpha=0.8)
        bars2 = ax.bar(x + width/2, milk_vals, width, label='Milk Run', color='#2ecc71', edgecolor='black', alpha=0.8)
        for i, (d, m) in enumerate(zip(direct_vals, milk_vals)):
            if d > 0:
                savings = ((d - m) / d) * 100
                ax.text(i, max(d, m) * 1.05, f'{savings:.1f}%\nsaved', ha='center', fontsize=9, fontweight='bold', color='#2c3e50')
        ax.set_ylabel('Value', fontsize=13)
        ax.set_title('Figure 6: Direct Delivery vs Milk Run Comparison', fontsize=16, fontweight='bold', pad=15)
        ax.set_xticks(x)
        ax.set_xticklabels(metrics, fontsize=11)
        ax.legend(loc='upper right', fontsize=11)
        ax.grid(axis='y', alpha=0.3)
        plt.tight_layout()
        filepath = f"{save_path}/figure_06_milk_run_comparison.png"
        plt.savefig(filepath, dpi=200, bbox_inches='tight', facecolor='white')
        print(f"  Saved: {filepath}")
        plt.close(fig)
        return filepath

    def generate_all_figures(self, save_path):
        print("\nGenerating all 6 figures...")
        files = {}
        files['cpm_network'] = self.generate_figure_cpm_network(save_path)
        files['cpm_gantt'] = self.generate_figure_cpm_gantt(save_path)
        files['pert_probability'] = self.generate_figure_pert_probability(save_path)
        files['pert_estimates'] = self.generate_figure_pert_estimates(save_path)
        files['milk_run_route'] = self.generate_figure_milk_run_route(save_path)
        files['milk_run_comparison'] = self.generate_figure_milk_run_comparison(save_path)
        print("\nAll 6 figures generated!")
        return files


# ============================================================
# MAIN EXECUTION — RUNS WHEN YOU TYPE: python cold_chain_analyzer.py
# ============================================================

def main():
    """Main execution function."""
    print("=" * 70)
    print("COLD CHAIN LOGISTICS ANALYZER")
    print("=" * 70)

    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"\nOutput directory: {os.path.abspath(OUTPUT_DIR)}")

    # Initialize analyzer
    analyzer = ColdChainLogisticsAnalyzer()

    # Set up data
    print("\nSetting up data...")
    analyzer.set_cpm_activities(CPM_ACTIVITIES)
    analyzer.set_pert_estimates(PERT_ESTIMATES)
    analyzer.set_milk_run(DEPOT, DESTINATIONS)

    # Run all analyses
    print("\n" + "=" * 70)
    print("RUNNING ANALYSES")
    print("=" * 70)
    results = analyzer.run_all()

    # Print CPM results
    print("\n" + "=" * 70)
    print("CPM RESULTS")
    print("=" * 70)
    cpm_table = analyzer.get_cpm_table()
    print(cpm_table.to_string(index=False))
    print(f"\n>>> Critical Path: {' → '.join(results['cpm']['critical_path'])}")
    print(f">>> Project Duration: {results['cpm']['project_duration']} hours")

    # Print PERT results
    print("\n" + "=" * 70)
    print("PERT RESULTS")
    print("=" * 70)
    pert_table = analyzer.get_pert_table()
    print(pert_table.to_string(index=False))
    print(f"\n>>> Expected Duration: {results['pert']['expected_duration']:.2f} hours")
    print(f">>> Standard Deviation: {results['pert']['std_dev']:.4f} hours")
    prob_table = analyzer.get_pert_probability_table()
    print("\n>>> Probability Table:")
    print(prob_table.to_string(index=False))

    # Print Milk Run results
    print("\n" + "=" * 70)
    print("MILK RUN RESULTS")
    print("=" * 70)
    mr = results['milk_run']
    print(f">>> Depot: {DEPOT}")
    print(f">>> Optimized Route: {' → '.join(mr['route'])}")
    print(f">>> Total Distance: {mr['total_distance']:.1f} km")
    print(f">>> Direct Distance: {mr['direct_distance']:.1f} km")
    print(f">>> Distance Saved: {mr['distance_savings_pct']:.1f}%")
    print(f">>> Cost Saved: {mr['cost_savings_pct']:.1f}%")
    print(f">>> CO2 Saved: {mr['co2_savings_pct']:.1f}%")
    print("\n>>> Step-by-step route:")
    for step in mr['step_details']:
        print(f"  Step {step['step']}: {step['from']} → {step['to']} ({step['distance']:.1f} km)")

    print("\n" + "=" * 70)
    print("COMPARISON TABLE")
    print("=" * 70)
    comparison = analyzer.get_milk_run_comparison_table()
    print(comparison.to_string(index=False))

    # Generate all figures
    print("\n" + "=" * 70)
    print("GENERATING FIGURES")
    print("=" * 70)
    fig_files = analyzer.generate_all_figures(OUTPUT_DIR)

    print("\n" + "=" * 70)
    print("ALL FIGURES SAVED")
    print("=" * 70)
    for name, filepath in fig_files.items():
        print(f"  {name:<25} -> {filepath}")

    print("\n" + "=" * 70)
    print("ANALYSIS COMPLETE")
    print("=" * 70)
    print(f"\nAll outputs saved to: {os.path.abspath(OUTPUT_DIR)}")
    print("\nTo change destinations, edit the DESTINATIONS dictionary")
    print("at the top of this file and re-run.")


# ============================================================
# COMMAND-LINE OPTIONS
# ============================================================
# You can also specify output directory from command line:
#   python cold_chain_analyzer.py
#   python cold_chain_analyzer.py --output ./my_figures
#   python cold_chain_analyzer.py --output C:/Users/You/Desktop
# ============================================================

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Cold Chain Logistics Analyzer')
    parser.add_argument('--output', '-o', type=str, default=OUTPUT_DIR,
                       help='Output directory for figures (default: ./output)')
    args = parser.parse_args()

    # Override OUTPUT_DIR if specified via command line
    if args.output != OUTPUT_DIR:
        OUTPUT_DIR = args.output

    print(f"Output directory: {os.path.abspath(OUTPUT_DIR)}")

    main()