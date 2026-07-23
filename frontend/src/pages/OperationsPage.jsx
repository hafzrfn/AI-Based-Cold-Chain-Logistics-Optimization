import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

function OperationsPage({ results, advancedSettings }) {
  const navigate = useNavigate();
  const [opsData, setOpsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [hasRun, setHasRun] = useState(false);

  const runAnalysis = async () => {
    if (!results) return;
    setIsLoading(true);
    setHasRun(true);
    try {
      let simulatedWaypoints = [...results.waypoints];
      // If there are only 2 waypoints (Origin, Destination), simulate a Milk Run
      // by adding two nearby delivery points around the destination.
      if (simulatedWaypoints.length === 2) {
        const dest = simulatedWaypoints[1];
        simulatedWaypoints.push({ name: `${dest.name} North`, lat: dest.lat + 0.15, lng: dest.lng + 0.05 });
        simulatedWaypoints.push({ name: `${dest.name} East`, lat: dest.lat - 0.05, lng: dest.lng + 0.15 });
      }

      const payload = {
        waypoints: simulatedWaypoints,
        time_hours: results.time_hours,
        perishableLoadTons: advancedSettings?.perishableLoadTons || 5.0
      };

      let res;
      try {
        res = await axios.post('http://localhost:5000/api/operations_analysis', payload);
      } catch (localErr) {
        // Only fallback to Vercel if localhost is not running at all
        if (localErr.code === 'ERR_NETWORK' || !localErr.response) {
          res = await axios.post(`${API_BASE_URL}/api/operations_analysis`, payload);
        } else {
          throw localErr; // Forward the actual 4xx/5xx from localhost
        }
      }
      
      setOpsData(res.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch operations analysis", err);
      const backendError = err.response?.data?.error;
      setError(backendError ? `Backend Error: ${backendError}` : "Failed to load operations analysis. Please ensure backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!results) {
    return (
      <div className="operations-page animate-fade-in" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2 style={{ marginBottom: '20px' }}>No Route Selected</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '30px' }}>
          You must select a route first to perform Operations Analysis.
        </p>
        <button className="btn-primary" onClick={() => navigate('/route')}>
          ← Go to Route Selection
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="operations-page animate-fade-in" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2 style={{ marginBottom: '12px' }}>Analyzing Cold Chain Network...</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>Calculating CPM, PERT, and Milk Run parameters. This may take a few seconds.</p>
      </div>
    );
  }

  if (!hasRun && !opsData) {
    return (
      <div className="operations-page animate-fade-in" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h1 className="operations-title" style={{ marginBottom: '12px' }}>Operations Planning</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '1.1em' }}>
          Route: <strong>{results.origin_name}</strong> → <strong>{results.destination_name}</strong>
        </p>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px', fontSize: '0.9em' }}>
          Transit Time: {results.time_hours} hrs &nbsp;|&nbsp; Distance: {Number(results.distance).toLocaleString()} km
        </p>
        <button className="btn-primary" style={{ padding: '14px 36px', fontSize: '1.1em' }} onClick={runAnalysis}>
          🔬 Run Milk Run, CPM & PERT Analysis
        </button>
      </div>
    );
  }

  if (error || (!isLoading && hasRun && !opsData)) {
    return (
      <div className="operations-page animate-fade-in" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2 style={{ color: 'var(--color-danger)', marginBottom: '12px' }}>Analysis Failed</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
          {error || "An unexpected error occurred while analyzing the network."}
        </p>
        <button className="btn-primary" onClick={runAnalysis}>
          Retry Analysis
        </button>
      </div>
    );
  }

  // Map route names back to coordinates for rendering
  let simulatedWaypoints = [...results.waypoints];
  if (simulatedWaypoints.length === 2) {
    const dest = simulatedWaypoints[1];
    simulatedWaypoints.push({ name: `${dest.name} North`, lat: dest.lat + 0.15, lng: dest.lng + 0.05 });
    simulatedWaypoints.push({ name: `${dest.name} East`, lat: dest.lat - 0.05, lng: dest.lng + 0.15 });
  }

  const wpMap = {};
  simulatedWaypoints.forEach(wp => {
    wpMap[wp.name] = { lat: wp.lat, lng: wp.lng };
  });

  const mr = opsData.milk_run.results;
  const mrRouteCoords = mr.route.map(name => wpMap[name]).filter(Boolean);

  const cpm = opsData.cpm;
  const pert = opsData.pert;
  const comp = opsData.milk_run.comparison;

  return (
    <div className="operations-page animate-fade-in">
      <header className="operations-header">
        <h1 className="operations-title">Operations Planning</h1>
        <p className="operations-subtitle">
          Dynamic Milk Run Optimization & CPM/PERT Scheduling based on your route
        </p>
      </header>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      {/* MILK RUN SECTION */}
      <section className="ops-section glass">
        <h2>1. Milk Run Optimization</h2>
        <p className="ops-description">
          Optimized delivery loop starting from <strong>{mr.route[0]}</strong>, minimizing total distance traveled compared to direct point-to-point deliveries.
        </p>
        
        <div className="milkrun-container">
          <div className="milkrun-controls">
            <h3>Route Sequence</h3>
            <ol style={{ marginLeft: '20px', marginBottom: '20px', color: 'var(--color-text-secondary)' }}>
              {mr.route.map((node, i) => (
                <li key={i}>{node} {i === 0 ? '(Depot)' : ''}</li>
              ))}
            </ol>
            
            <div className="milkrun-results animate-fade-in-up">
              <h4>Direct vs Milk Run Comparison</h4>
              <div className="table-container">
                <table className="ops-table" style={{ fontSize: '0.9em' }}>
                  <thead>
                    <tr>
                      <th>KPI</th>
                      <th>Direct Delivery</th>
                      <th>Milk Run</th>
                      <th>Savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comp.map((row, i) => (
                      <tr key={i}>
                        <td><strong>{row['KPI']}</strong></td>
                        <td>{row['Direct Delivery']}</td>
                        <td className="highlight-success">{row['Milk Run']}</td>
                        <td><strong>{row['Savings']}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="milkrun-map">
            {mrRouteCoords.length > 0 && (
              <MapContainer center={[mrRouteCoords[0].lat, mrRouteCoords[0].lng]} zoom={5} className="leaflet-ops-map">
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                
                {mrRouteCoords.map((c, i) => (
                  <Marker key={i} position={[c.lat, c.lng]}>
                    <LeafletTooltip permanent={i===0}>{mr.route[i]} {i===0 ? '(Depot)' : ''}</LeafletTooltip>
                  </Marker>
                ))}

                <Polyline 
                  positions={mrRouteCoords.map(c => [c.lat, c.lng])}
                  pathOptions={{ color: '#10b981', weight: 3, dashArray: '5, 10' }}
                />
              </MapContainer>
            )}
          </div>
        </div>
      </section>

      {/* CPM / PERT SECTION */}
      <section className="ops-section glass" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h2>2. CPM & PERT Scheduling</h2>
        <p className="ops-description">
          Analyzes a standard cold chain delivery sequence using the Critical Path Method and PERT. The <strong>Transportation</strong> activity duration is dynamically linked to your selected route's estimated transit time ({results.time_hours} hrs).
        </p>

        <div className="schedule-kpis">
          <div className="kpi-card">
            <span className="kpi-label">Expected Project Duration (TE)</span>
            <span className="kpi-value">{pert.expected_duration.toFixed(2)} hrs</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Project Std Dev (σ)</span>
            <span className="kpi-value">{pert.std_dev.toFixed(2)} hrs</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Critical Path</span>
            <span className="kpi-value" style={{ fontSize: '1.2em' }}>{cpm.critical_path.join(' → ')}</span>
          </div>
        </div>

        {/* GANTT CHART */}
        <div className="gantt-chart-container">
          <h3>CPM Gantt Chart</h3>
          <div className="gantt-timeline">
            {cpm.table.map(act => {
              const leftPct = (act.ES / cpm.project_duration) * 100;
              const widthPct = (act['Duration (h)'] / cpm.project_duration) * 100;
              const isCritical = act.Critical === 'YES';
              return (
                <div className="gantt-row" key={act.Activity}>
                  <div className="gantt-label" title={act.Description}>{act.Activity}: {act.Description}</div>
                  <div className="gantt-track">
                    <div 
                      className={`gantt-bar ${isCritical ? 'critical' : 'normal'}`}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    >
                      <span className="gantt-bar-text">{act['Duration (h)']}h</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PERT TABLE */}
        <div className="table-container" style={{ marginTop: 'var(--spacing-lg)' }}>
          <h3>PERT Three-Time Estimates</h3>
          <table className="ops-table">
            <thead>
              <tr>
                <th>Activity</th>
                <th>Description</th>
                <th>Opt (a)</th>
                <th>Most Likely (m)</th>
                <th>Pess (b)</th>
                <th>Expected (Te)</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              {pert.table.map((act, i) => {
                const cpmAct = cpm.table.find(c => c.Activity === act.Activity);
                return (
                  <tr key={act.Activity} className={cpmAct?.Critical === 'YES' ? 'row-critical' : ''}>
                    <td><strong>{act.Activity}</strong></td>
                    <td>{cpmAct?.Description}</td>
                    <td>{act['Optimistic (a)'].toFixed(2)}</td>
                    <td>{act['Most Likely (m)'].toFixed(2)}</td>
                    <td>{act['Pessimistic (b)'].toFixed(2)}</td>
                    <td>{act['Expected (Te)'].toFixed(2)}</td>
                    <td>{act['Variance'].toFixed(4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* PROBABILITY TABLE */}
        <div className="table-container" style={{ marginTop: 'var(--spacing-lg)' }}>
          <h3>Delivery Probability (Z-Scores)</h3>
          <table className="ops-table" style={{ width: '50%' }}>
            <thead>
              <tr>
                <th>Target Time (hrs)</th>
                <th>Z-Score</th>
                <th>Probability of Completion</th>
              </tr>
            </thead>
            <tbody>
              {pert.probabilities.map((prob, i) => (
                <tr key={i}>
                  <td><strong>{prob['Target Time (h)']}</strong></td>
                  <td>{prob['Z-Score'].toFixed(3)}</td>
                  <td className={prob['Probability (%)'] > 80 ? 'highlight-success' : ''}>
                    {prob['Probability (%)'].toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default OperationsPage;
