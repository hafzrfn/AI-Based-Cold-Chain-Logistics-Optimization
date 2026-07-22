import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function HubBarChart({ hubs }) {
  // Take top 10 for cleaner display
  const data = hubs.slice(0, 10).map(hub => ({
    name: hub.county,
    Centrality: Math.round(hub.pagerank * 1000) / 1000,
  }));

  return (
    <div className="hub-chart-container glass" style={{ padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)', height: '400px' }}>
      <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Top Hub Counties (PageRank Centrality)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis type="number" stroke="var(--color-text-secondary)" />
          <YAxis dataKey="name" type="category" width={120} stroke="var(--color-text-secondary)" tick={{fontSize: 12}} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
            itemStyle={{ color: 'var(--color-accent)' }}
          />
          <Bar dataKey="Centrality" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default HubBarChart;
