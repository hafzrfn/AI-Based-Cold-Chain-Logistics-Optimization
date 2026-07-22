import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Polyline, Tooltip as LeafletTooltip, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './OperationsPage.css';

// Fix Leaflet's default icon issue
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const API_BASE_URL = 'https://ai-based-cold-chain-logistics-optim-virid.vercel.app';

let DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function OperationsPage() {
  const [scheduleData, setScheduleData] = useState(null);
  const [milkRunResult, setMilkRunResult] = useState(null);
  
  // Fake inputs for Milk Run Demo
  const [depot] = useState({ lat: 40.7128, lng: -74.0060, name: 'New York Depot' });
  const [destinations] = useState([
    { lat: 42.3601, lng: -71.0589, name: 'Boston' },
    { lat: 39.9526, lng: -75.1652, name: 'Philadelphia' },
    { lat: 38.9072, lng: -77.0369, name: 'Washington D.C.' },
    { lat: 43.0481, lng: -76.1474, name: 'Syracuse' }
  ]);
  
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const res = await axios.get('http://localhost:5000/api/schedule').catch(() =>
          axios.get(`${API_BASE_URL}/api/schedule`)
        );
        setScheduleData(res.data);
      } catch (err) {
        console.error("Failed to fetch schedule", err);
      }
    }
    fetchSchedule();
  }, []);

  const handleOptimizeMilkRun = async () => {
    setIsOptimizing(true);
    try {
      const waypoints = [depot, ...destinations];
      const res = await axios.post('http://localhost:5000/api/milkrun', { waypoints }).catch(() =>
        axios.post(`${API_BASE_URL}/api/milkrun`, { waypoints })
      );
      setMilkRunResult(res.data);
    } catch (err) {
      console.error("Milk run failed", err);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="operations-page animate-fade-in">
      <header className="operations-header">
        <h1 className="operations-title">Operations Planning</h1>
        <p className="operations-subtitle">
          Milk Run Route Optimization and CPM/PERT Scheduling
        </p>
      </header>

      {/* MILK RUN SECTION */}
      <section className="ops-section glass">
        <h2>1. Milk Run Optimization</h2>
        <p className="ops-description">
          Demonstrates Nearest Neighbor heuristic to create a multi-stop delivery loop starting from a central depot, minimizing total distance traveled compared to direct point-to-point deliveries.
        </p>
        
        <div className="milkrun-container">
          <div className="milkrun-controls">
            <h3>Delivery Waypoints</h3>
            <ul>
              <li><strong>Depot:</strong> {depot.name}</li>
              {destinations.map(d => <li key={d.name}>{d.name}</li>)}
            </ul>
            <button 
              className="btn-primary" 
              onClick={handleOptimizeMilkRun}
              disabled={isOptimizing}
            >
              {isOptimizing ? 'Optimizing...' : 'Optimize Milk Run'}
            </button>

            {milkRunResult && (
              <div className="milkrun-results animate-fade-in-up">
                <h4>Optimization Results</h4>
                <div className="metric">
                  <span>Baseline Distance:</span>
                  <span>{milkRunResult.baseline_distance} km</span>
                </div>
                <div className="metric">
                  <span>Optimized Distance:</span>
                  <span className="highlight-success">{milkRunResult.total_distance} km</span>
                </div>
                <div className="metric">
                  <span>Distance Saved:</span>
                  <span className="highlight-success">{milkRunResult.distance_saved} km</span>
                </div>
              </div>
            )}
          </div>

          <div className="milkrun-map">
            <MapContainer center={[40.7128, -74.0060]} zoom={6} className="leaflet-ops-map">
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              
              <Marker position={[depot.lat, depot.lng]}>
                <LeafletTooltip permanent>Depot</LeafletTooltip>
              </Marker>
              
              {destinations.map((d, i) => (
                <Marker key={i} position={[d.lat, d.lng]}>
                  <LeafletTooltip>{d.name}</LeafletTooltip>
                </Marker>
              ))}

              {milkRunResult && (
                <Polyline 
                  positions={milkRunResult.optimized_route.map(r => [r.lat, r.lng])}
                  pathOptions={{ color: '#10b981', weight: 3, dashArray: '5, 10' }}
                />
              )}
            </MapContainer>
          </div>
        </div>
      </section>

      {/* CPM / PERT SECTION */}
      <section className="ops-section glass" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h2>2. CPM & PERT Scheduling</h2>
        <p className="ops-description">
          Analyzes a standard cold chain delivery sequence using the Critical Path Method and PERT (Program Evaluation and Review Technique) to account for time uncertainty.
        </p>

        {scheduleData ? (
          <>
            <div className="schedule-kpis">
              <div className="kpi-card">
                <span className="kpi-label">Expected Project Duration (TE)</span>
                <span className="kpi-value">{scheduleData.project_duration} hrs</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Project Variance (σ²)</span>
                <span className="kpi-value">{scheduleData.project_variance}</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Standard Deviation (σ)</span>
                <span className="kpi-value">{scheduleData.project_std_dev} hrs</span>
              </div>
            </div>

            {/* GANTT CHART */}
            <div className="gantt-chart-container">
              <h3>Gantt Chart (Critical Path Highlighted)</h3>
              <div className="gantt-timeline">
                {scheduleData.activities.map(act => {
                  const leftPct = (act.es / scheduleData.project_duration) * 100;
                  const widthPct = (act.te / scheduleData.project_duration) * 100;
                  return (
                    <div className="gantt-row" key={act.id}>
                      <div className="gantt-label">{act.id}: {act.name}</div>
                      <div className="gantt-track">
                        <div 
                          className={`gantt-bar ${act.is_critical ? 'critical' : 'normal'}`}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        >
                          <span className="gantt-bar-text">{act.te}h</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CPM/PERT TABLE */}
            <div className="table-container" style={{ marginTop: 'var(--spacing-lg)' }}>
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Act.</th>
                    <th>Name</th>
                    <th>Predecessors</th>
                    <th>Opt (O)</th>
                    <th>Most Likely (M)</th>
                    <th>Pess (P)</th>
                    <th>Expected (TE)</th>
                    <th>Var (σ²)</th>
                    <th>ES</th>
                    <th>EF</th>
                    <th>LS</th>
                    <th>LF</th>
                    <th>Slack</th>
                    <th>Critical?</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleData.activities.map(act => (
                    <tr key={act.id} className={act.is_critical ? 'row-critical' : ''}>
                      <td>{act.id}</td>
                      <td>{act.name}</td>
                      <td>{act.dependencies.join(', ') || '-'}</td>
                      <td>{act.optimistic}</td>
                      <td>{act.most_likely}</td>
                      <td>{act.pessimistic}</td>
                      <td>{act.te}</td>
                      <td>{act.variance}</td>
                      <td>{act.es}</td>
                      <td>{act.ef}</td>
                      <td>{act.ls}</td>
                      <td>{act.lf}</td>
                      <td>{act.slack}</td>
                      <td>{act.is_critical ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div>Loading scheduling data...</div>
        )}
      </section>
    </div>
  );
}

export default OperationsPage;
