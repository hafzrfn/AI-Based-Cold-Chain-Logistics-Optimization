import pandas as pd
import networkx as nx
import json
import os

def generate_insights():
    print("Loading FoodFlows dataset...")
    # Path relative to the backend directory
    dataset_path = '../../Datasets/combined_cold_chain_datasets_for_analysis.xlsx'
    
    if not os.path.exists(dataset_path):
        print(f"Error: Dataset not found at {dataset_path}")
        return

    df = pd.read_excel(dataset_path, sheet_name='FoodFlows_2017')
    df['ColdChainFlow'] = df['SCTG.5'].clip(lower=0) + df['SCTG.7'].clip(lower=0)
    df_cc = df[df['ColdChainFlow'] > 0].copy()

    print(f"Processing {len(df_cc)} cold chain routes...")

    # Build directed graph: counties = nodes, flow volume = edge weight
    # We use name_ori and name_des as the county names (from empirical dataset columns)
    G = nx.from_pandas_edgelist(
        df_cc, source='name_ori', target='name_des',
        edge_attr='ColdChainFlow', create_using=nx.DiGraph()
    )

    print("Calculating centrality metrics...")
    # Centrality measures -> identify major hubs
    try:
        pagerank_c = nx.pagerank(G, weight='ColdChainFlow')
    except Exception as e:
        print(f"PageRank failed: {e}. Falling back to default PageRank.")
        pagerank_c = nx.pagerank(G)

    # Financial + sustainability scoring per route
    df_cc['transport_cost'] = df_cc['ColdChainFlow'] * 0.85          # $/ton assumption
    df_cc['refrigeration_cost'] = df_cc['ColdChainFlow'] * 0.35      # $/ton assumption
    df_cc['co2_cost'] = df_cc['ColdChainFlow'] * 0.12                # $/ton CO2-equivalent assumption
    df_cc['total_cost'] = df_cc[['transport_cost', 'refrigeration_cost', 'co2_cost']].sum(axis=1)

    # Composite priority score: flow importance + cost + centrality of origin hub
    df_cc['origin_pagerank'] = df_cc['name_ori'].map(pagerank_c).fillna(0)
    
    max_flow = df_cc['ColdChainFlow'].max() or 1
    max_cost = df_cc['total_cost'].max() or 1
    max_pagerank = df_cc['origin_pagerank'].max() or 1

    df_cc['priority_score'] = (
        0.4 * (df_cc['ColdChainFlow'] / max_flow) +
        0.35 * (df_cc['total_cost'] / max_cost) +
        0.25 * (df_cc['origin_pagerank'] / max_pagerank)
    )

    # Priority tier: quantile-based
    df_cc['priority_tier'] = pd.qcut(
        df_cc['priority_score'], q=[0, 0.33, 0.66, 1.0], labels=['Low', 'Medium', 'High']
    )

    # To render polylines, we need coordinates. 
    # Since we don't have a Census gazetteer handy in this environment, we'll assign pseudo-coordinates
    # based on a hash of the county name (just for the demo visualization), or we can skip drawing polylines
    # if we don't have real lat/lons. For the demo, let's extract unique counties and give them random coordinates
    # across the US bounding box so the map looks populated, or rely on actual reverse geocoding if we had it.
    # To be more realistic without calling an API 100 times, let's use a deterministic hash for lat/lon.
    import hashlib
    def get_pseudo_coords(name):
        h = int(hashlib.md5(name.encode('utf-8')).hexdigest(), 16)
        # Continental US bounds: lat ~25 to ~49, lon ~-125 to ~-65
        lat = 25 + (h % 2400) / 100.0
        lon = -125 + ((h // 2400) % 6000) / 100.0
        return {'lat': lat, 'lng': lon}

    print("Sorting top routes...")
    top_routes = df_cc.sort_values('priority_score', ascending=False).head(100)

    routes_export = []
    for _, row in top_routes.iterrows():
        origin_coords = get_pseudo_coords(row['name_ori'])
        dest_coords = get_pseudo_coords(row['name_des'])
        
        routes_export.append({
            'origin_county': row['name_ori'],
            'dest_county': row['name_des'],
            'origin_coords': origin_coords,
            'dest_coords': dest_coords,
            'ColdChainFlow': row['ColdChainFlow'],
            'total_cost': row['total_cost'],
            'priority_score': row['priority_score'],
            'priority_tier': row['priority_tier']
        })

    print("Formatting top hubs...")
    top_hubs = sorted(pagerank_c.items(), key=lambda x: -x[1])[:15]
    hubs_export = [{'county': h[0], 'pagerank': h[1]} for h in top_hubs]

    print("Loading ML dataset sample...")
    ml_path = '../../final_cold_chain_run_2026-07-06_14-17-20/integrated_empirical_dataset.csv'
    ml_export = []
    if os.path.exists(ml_path):
        try:
            df_ml = pd.read_csv(ml_path)
            # Sample 100 rows to keep JSON size reasonable for browser rendering
            df_ml_sample = df_ml.sample(n=min(100, len(df_ml)), random_state=42)
            ml_export = df_ml_sample.to_dict(orient='records')
            print(f"Sampled {len(ml_export)} rows from ML dataset.")
        except Exception as e:
            print(f"Failed to load ML dataset: {e}")
    else:
        print("ML dataset not found.")

    export = {
        'top_routes': routes_export,
        'top_hubs': hubs_export,
        'ml_dataset_sample': ml_export,
    }

    out_path = 'network_insights.json'
    with open(out_path, 'w') as f:
        json.dump(export, f, indent=2, default=str)

    print(f"Successfully generated {out_path} with {len(routes_export)} top routes and {len(hubs_export)} top hubs.")

if __name__ == '__main__':
    generate_insights()
