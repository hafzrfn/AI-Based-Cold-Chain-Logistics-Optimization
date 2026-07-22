import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Polyline, Tooltip as LeafletTooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import RouteTable from '../components/RouteTable';
import HubBarChart from '../components/HubBarChart';
import MLDatasetTable from '../components/MLDatasetTable';
import './DashboardPage.css';

const API_BASE_URL = 'https://ai-based-cold-chain-logistics-optim-virid.vercel.app'; // Can be env var

function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'network', 'ml'

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get('http://localhost:5000/api/network-insights').catch(() => 
          axios.get('/api/network-insights') // fallback
        );
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load research data.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="dashboard-page"><div className="loading-spinner">Loading network data...</div></div>;
  }

  if (error) {
    return <div className="dashboard-page"><div className="error-message">{error}</div></div>;
  }

  const { top_routes, top_hubs, ml_dataset_sample } = data;

  const getPriorityColor = (tier) => {
    if (tier === 'High') return '#ef4444'; // critical red
    if (tier === 'Medium') return '#f59e0b'; // warning amber
    return '#10b981'; // nominal green
  };

  const highPriorityCount = top_routes.filter(r => r.priority_tier === 'High').length;
  const topHubName = top_hubs[0]?.county || 'N/A';
  const totalCost = top_routes.reduce((sum, r) => sum + r.total_cost, 0);

  return (
    <div className="dashboard-page animate-fade-in">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Research Dashboard</h1>
        <p className="dashboard-subtitle">
          Macro-level analysis of the FoodFlows 2017 supply chain
        </p>

        {/* Tab Navigation */}
        <div className="dashboard-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Executive Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'network' ? 'active' : ''}`}
            onClick={() => setActiveTab('network')}
          >
            🗺️ Network Analysis
          </button>
          <button 
            className={`tab-btn ${activeTab === 'ml' ? 'active' : ''}`}
            onClick={() => setActiveTab('ml')}
          >
            🤖 ML Training Context
          </button>
        </div>
      </header>

      <div className="tab-content">
        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in-up">
            <div className="kpi-grid">
              <div className="kpi-card glass">
                <div className="kpi-label">High Priority Routes</div>
                <div className="kpi-value" style={{ color: '#ef4444' }}>{highPriorityCount}</div>
              </div>
              <div className="kpi-card glass">
                <div className="kpi-label">Top Centrality Hub</div>
                <div className="kpi-value" style={{ color: '#3b82f6' }}>{topHubName}</div>
              </div>
              <div className="kpi-card glass">
                <div className="kpi-label">Est. Network Cost (Top 100)</div>
                <div className="kpi-value" style={{ color: '#10b981' }}>${(totalCost / 1000000).toFixed(1)}M</div>
              </div>
            </div>

            <div style={{ marginTop: 'var(--spacing-xl)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Top Priority Routes Database (FoodFlows 2017)</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}>
                This table highlights the most financially sensitive corridors, serving as the basis for logistics prioritization.
              </p>
              <RouteTable routes={top_routes} />
            </div>
          </div>
        )}

        {/* TAB 2: NETWORK ANALYSIS */}
        {activeTab === 'network' && (
          <div className="animate-fade-in-up">
            <div className="dashboard-content">
              {/* Map Overlay */}
              <div className="dashboard-map glass">
                <h3 style={{ padding: 'var(--spacing-md)' }}>Priority Route Network Overlay</h3>
                {/* Note: Leaflet maps sometimes struggle to render correctly if initialized while hidden. 
                    Because we conditionally render this tab, the map initializes visibly, avoiding issues. */}
                <MapContainer
                  center={[39.8283, -98.5795]} // Center of US
                  zoom={4}
                  className="leaflet-dashboard-map"
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />
                  {top_routes.map((route, idx) => (
                    <Polyline
                      key={idx}
                      positions={[
                        [route.origin_coords.lat, route.origin_coords.lng],
                        [route.dest_coords.lat, route.dest_coords.lng]
                      ]}
                      pathOptions={{
                        color: getPriorityColor(route.priority_tier),
                        weight: route.priority_tier === 'High' ? 4 : 2,
                        opacity: 0.7,
                      }}
                    >
                      <LeafletTooltip>
                        {route.origin_county} → {route.dest_county} <br/>
                        Flow: {Math.round(route.ColdChainFlow).toLocaleString()} tons <br/>
                        Tier: {route.priority_tier}
                      </LeafletTooltip>
                    </Polyline>
                  ))}
                </MapContainer>
              </div>

              {/* Hub Chart */}
              <HubBarChart hubs={top_hubs} />
            </div>
          </div>
        )}

        {/* TAB 3: ML CONTEXT */}
        {activeTab === 'ml' && (
          <div className="animate-fade-in-up">
            {ml_dataset_sample && ml_dataset_sample.length > 0 ? (
              <div style={{ marginTop: 'var(--spacing-md)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-xs)' }}>Machine Learning Training Data (Sample)</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}>
                  This table displays a 100-row sample of the synthetically generated <code>integrated_empirical_dataset.csv</code>. This data was specifically engineered to train the client-side predictive Logistic Regression models for Spoilage, Delay, and Failure risk.
                </p>
                <MLDatasetTable dataset={ml_dataset_sample} />
              </div>
            ) : (
              <p>No ML training data available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
