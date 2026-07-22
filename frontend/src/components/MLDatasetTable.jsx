import { useState } from 'react';

function MLDatasetTable({ dataset }) {
  const [sortConfig, setSortConfig] = useState({ key: 'source_row_id', direction: 'asc' });

  if (!dataset || dataset.length === 0) return <div>No ML dataset available.</div>;

  const sortedData = [...dataset].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const formatNumber = (num) => typeof num === 'number' ? Math.round(num * 100) / 100 : num;

  return (
    <div className="route-table-container glass" style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)' }}>
      <table className="route-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <th onClick={() => requestSort('name_ori')} style={{ padding: 'var(--spacing-md)', cursor: 'pointer' }}>Origin</th>
            <th onClick={() => requestSort('name_des')} style={{ padding: 'var(--spacing-md)', cursor: 'pointer' }}>Destination</th>
            <th onClick={() => requestSort('perishable_load_tons')} style={{ padding: 'var(--spacing-md)', cursor: 'pointer' }}>Load (Tons)</th>
            <th onClick={() => requestSort('distance_miles')} style={{ padding: 'var(--spacing-md)', cursor: 'pointer' }}>Distance (Mi)</th>
            <th onClick={() => requestSort('temp_c')} style={{ padding: 'var(--spacing-md)', cursor: 'pointer' }}>Temp (°C)</th>
            <th onClick={() => requestSort('delay_hours')} style={{ padding: 'var(--spacing-md)', cursor: 'pointer' }}>Delay (Hrs)</th>
            <th onClick={() => requestSort('spoilage_event')} style={{ padding: 'var(--spacing-md)', cursor: 'pointer' }}>Spoilage Event</th>
            <th onClick={() => requestSort('cold_chain_failure')} style={{ padding: 'var(--spacing-md)', cursor: 'pointer' }}>CC Failure</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: 'var(--spacing-md)' }}>{row.name_ori}</td>
              <td style={{ padding: 'var(--spacing-md)' }}>{row.name_des}</td>
              <td style={{ padding: 'var(--spacing-md)' }}>{formatNumber(row.perishable_load_tons)}</td>
              <td style={{ padding: 'var(--spacing-md)' }}>{formatNumber(row.distance_miles)}</td>
              <td style={{ padding: 'var(--spacing-md)' }}>{formatNumber(row.temp_c)}</td>
              <td style={{ padding: 'var(--spacing-md)' }}>{formatNumber(row.delay_hours)}</td>
              <td style={{ padding: 'var(--spacing-md)' }}>
                <span className={`alert-badge ${row.spoilage_event === 1 ? 'critical' : 'nominal'}`}>
                  {row.spoilage_event === 1 ? 'YES' : 'NO'}
                </span>
              </td>
              <td style={{ padding: 'var(--spacing-md)' }}>
                <span className={`alert-badge ${row.cold_chain_failure === 1 ? 'critical' : 'nominal'}`}>
                  {row.cold_chain_failure === 1 ? 'YES' : 'NO'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MLDatasetTable;
