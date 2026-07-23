import { useState, useEffect } from 'react';
import axios from 'axios';
import HubBarChart from '../components/HubBarChart';
import RouteTable from '../components/RouteTable';
import MLDatasetTable from '../components/MLDatasetTable';
import './DashboardPage.css';

const API_BASE_URL = 'https://ai-based-cold-chain-logistics-optim-virid.vercel.app';

/**
 * Research Dashboard Page.
 * Shows pre-computed network insights from the backend.
 */
function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('network');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get('http://localhost:5000/api/network-insights').catch(() => 
          axios.get(`${API_BASE_URL}/api/network-insights`) // fallback to correct backend
        );
        setData(res.data);
      } catch (err) {
        setError('Failed to load research data.');
        console.error(err);
      }
    }
    fetchData();
  }, []);

  const tabs = [
    { id: 'network', label: '🕸️ Network Hubs' },
    { id: 'routes',  label: '🚛 Top Routes'   },
    { id: 'dataset', label: '📊 ML Dataset'   },
  ];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Research Dashboard</h1>
        <p className="dashboard-subtitle">
          Pre-computed network analysis of the Cold Chain logistics graph
        </p>
      </header>

      {error && (
        <div className="dashboard-error glass">
          <span>⚠️</span> {error}
        </div>
      )}

      {!data && !error && (
        <div className="dashboard-loading">
          <p>Loading research data…</p>
        </div>
      )}

      {data && (
        <>
          {/* Summary KPI row */}
          <div className="dashboard-kpis">
            <div className="kpi-box glass">
              <span className="kpi-number">{data.summary?.total_nodes?.toLocaleString() ?? '—'}</span>
              <span className="kpi-label">Counties / Nodes</span>
            </div>
            <div className="kpi-box glass">
              <span className="kpi-number">{data.summary?.total_edges?.toLocaleString() ?? '—'}</span>
              <span className="kpi-label">Route Edges</span>
            </div>
            <div className="kpi-box glass">
              <span className="kpi-number">{data.summary?.total_flow_kg != null
                ? (data.summary.total_flow_kg / 1e9).toFixed(1) + ' B kg'
                : '—'}</span>
              <span className="kpi-label">Total Flow</span>
            </div>
            <div className="kpi-box glass">
              <span className="kpi-number">{data.top_hubs?.length ?? '—'}</span>
              <span className="kpi-label">Top Hubs Identified</span>
            </div>
          </div>

          {/* Tab bar */}
          <div className="dashboard-tabs">
            {tabs.map(t => (
              <button
                key={t.id}
                className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="dashboard-content glass">
            {activeTab === 'network' && data.top_hubs && (
              <HubBarChart hubs={data.top_hubs} />
            )}
            {activeTab === 'routes' && data.top_routes && (
              <RouteTable routes={data.top_routes} />
            )}
            {activeTab === 'dataset' && data.sample_records && (
              <MLDatasetTable records={data.sample_records} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardPage;
