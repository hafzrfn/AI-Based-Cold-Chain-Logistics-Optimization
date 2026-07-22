import { useState } from 'react';

function RouteTable({ routes }) {
  const [sortConfig, setSortConfig] = useState({ key: 'priority_score', direction: 'desc' });

  const sortedRoutes = [...routes].sort((a, b) => {
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

  const formatNumber = (num) => Math.round(num).toLocaleString();

  return (
    <div className="route-table-container glass" style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)' }}>
      <table className="route-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <th onClick={() => requestSort('origin_county')} style={{ padding: 'var(--spacing-md)', cursor: 'pointer' }}>Origin</th>
            <th onClick={() => requestSort('dest_county')} style={{ padding: 'var(--spacing-md)', cursor: 'pointer' }}>Destination</th>
            <th onClick={() => requestSort('ColdChainFlow')} style={{ padding: 'var(--spacing-md)', cursor: 'pointer' }}>Flow Volume</th>
            <th onClick={() => requestSort('total_cost')} style={{ padding: 'var(--spacing-md)', cursor: 'pointer' }}>Est. Cost ($)</th>
            <th onClick={() => requestSort('priority_tier')} style={{ padding: 'var(--spacing-md)', cursor: 'pointer' }}>Priority</th>
          </tr>
        </thead>
        <tbody>
          {sortedRoutes.map((route, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: 'var(--spacing-md)' }}>{route.origin_county}</td>
              <td style={{ padding: 'var(--spacing-md)' }}>{route.dest_county}</td>
              <td style={{ padding: 'var(--spacing-md)' }}>{formatNumber(route.ColdChainFlow)} tons</td>
              <td style={{ padding: 'var(--spacing-md)' }}>${formatNumber(route.total_cost)}</td>
              <td style={{ padding: 'var(--spacing-md)' }}>
                <span className={`alert-badge ${route.priority_tier.toLowerCase() === 'high' ? 'critical' : route.priority_tier.toLowerCase() === 'medium' ? 'warning' : 'nominal'}`}>
                  {route.priority_tier}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RouteTable;
