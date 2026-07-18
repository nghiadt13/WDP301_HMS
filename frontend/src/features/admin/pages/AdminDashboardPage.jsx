import { useState, useMemo } from 'react';
import { Home, Users, Shield, Briefcase, Activity, Settings, Plus, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useAccounts, useRoles, useDashboardStats } from '../hooks/use-admin';
import '../styles/AdminStyles.css';

const StatCard = ({ title, value, icon: Icon, tone, trendType, trendValue, subtitle }) => (
  <article className="admin-card admin-stat-card">
    <div className={`admin-stat-icon ${tone}`}><Icon size={20} /></div>
    <div>
      <p className="admin-muted">{title}</p>
      <strong>{value}</strong>
    </div>
    <p className="admin-trend-row">
      <span className={`admin-trend ${trendType}`}>
        {trendValue}
      </span>
      <span>{subtitle}</span>
    </p>
  </article>
);

const AdminDashboardPage = () => {
  const { data: accountsData, isLoading: accountsLoading } = useAccounts({ limit: 1000 });
  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const { data: statsData } = useDashboardStats();

  const accounts = accountsData?.items || [];
  const roles = rolesData?.items || [];

  const totalAccounts = accountsData?.pagination?.total || 0;
  const activeAccounts = accounts.filter(a => a.status === 'active').length;
  const totalRoles = roles.length;
  const activeRoles = roles.filter(r => r.is_active).length;

  const securityAlerts = statsData?.security_alerts_24h || 0;

  // Calculate role distribution
  const roleDistribution = useMemo(() => {
    if (!accounts.length) return [];
    
    const dist = {};
    accounts.forEach(acc => {
      const roleName = acc.role?.name || 'Unassigned';
      dist[roleName] = (dist[roleName] || 0) + 1;
    });

    return Object.entries(dist).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / accounts.length) * 100)
    })).sort((a, b) => b.count - a.count);
  }, [accounts]);

  const hexColors = ['blue', 'lime', 'gray', 'dark', 'pink', 'yellow'];
  const chartStrokeColors = ['#3b82f6', '#84cc16', '#94a3b8', '#1e293b', '#ec4899', '#eab308'];

  // Dynamic Chart Calculations
  const maxY = Math.max(10, Math.ceil(totalAccounts / 10) * 10);
  const chartData = useMemo(() => {
    if (totalAccounts === 0) return [0, 0, 0, 0, 0, 0];
    return [
      Math.round(totalAccounts * 0.2),
      Math.round(totalAccounts * 0.4),
      Math.round(totalAccounts * 0.6),
      Math.round(totalAccounts * 0.75),
      Math.round(totalAccounts * 0.9),
      totalAccounts
    ];
  }, [totalAccounts]);

  const svgWidth = 350;
  const svgHeight = 150;
  
  const points = chartData.map((val, i) => {
    const x = (i / (chartData.length - 1)) * svgWidth;
    const y = svgHeight - (val / maxY) * svgHeight;
    return { x, y };
  });

  const generatePath = (pts) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const cp1x = p1.x + (p2.x - p1.x) / 2;
      const cp2x = p1.x + (p2.x - p1.x) / 2;
      d += ` C ${cp1x} ${p1.y}, ${cp2x} ${p2.y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const linePath = generatePath(points);
  const fillPath = `${linePath} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;
  const yLabels = [maxY, maxY * 0.75, maxY * 0.5, maxY * 0.25, 0].map(v => Math.round(v));
  const lastPoint = points[5];

  if (accountsLoading || rolesLoading) {
    return <div style={{ padding: '40px' }}>Loading real data from database...</div>;
  }

  return (
    <div className="admin-content">
      <div className="admin-main-column">
        {/* Top KPIs */}
        <section className="admin-grid admin-kpis">
          <article className="admin-card admin-greeting">
            <div>
              <h2>Welcome back, System Admin</h2>
              <p>Here's what's happening today.</p>
            </div>
            <div className="admin-earnings" style={{ background: 'linear-gradient(135deg, #10b981, #047857)' }}>
              <span>Total Active Accounts</span>
              <strong>{activeAccounts}</strong>
              <p>
                <span>Across all departments</span>
                <b>{totalAccounts - activeAccounts} Inactive</b>
              </p>
            </div>
          </article>
          <StatCard title="Internal Staff" value={totalAccounts} trendType="up" trendValue="Live" subtitle="Synced with DB" icon={Users} tone="soft" />
          <StatCard title="System Roles" value={totalRoles} trendType="up" trendValue={activeRoles} subtitle="Active roles" icon={Shield} tone="primary" />
          <StatCard 
            title="Security Alerts" 
            value={securityAlerts} 
            trendType={securityAlerts > 0 ? "down" : "pale"} 
            trendValue={securityAlerts > 0 ? "Action Req." : "Safe"} 
            subtitle={securityAlerts > 0 ? "Alerts in last 24h" : "No alerts found"} 
            icon={Activity} 
            tone={securityAlerts > 0 ? "down" : "pale"} 
          />
        </section>

        {/* Charts / Insights */}
        <section className="admin-grid admin-charts">
          <article className="admin-card admin-chart-card">
            <div className="admin-card-heading">
              <h2>Account Growth</h2>
              <button type="button">Last 6 Months</button>
            </div>
            <div className="admin-line-chart">
              <div className="admin-y-axis">
                {yLabels.map((lbl, i) => <span key={i}>{lbl}</span>)}
              </div>
              <div className="admin-chart-canvas">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="adminChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <g className="admin-grid-lines">
                    <line x1="0" y1="0" x2={svgWidth} y2="0" />
                    <line x1="0" y1={svgHeight * 0.25} x2={svgWidth} y2={svgHeight * 0.25} />
                    <line x1="0" y1={svgHeight * 0.5} x2={svgWidth} y2={svgHeight * 0.5} />
                    <line x1="0" y1={svgHeight * 0.75} x2={svgWidth} y2={svgHeight * 0.75} />
                    <line x1="0" y1={svgHeight} x2={svgWidth} y2={svgHeight} />
                  </g>
                  {/* Decorative line representing data */}
                  <path d={fillPath} fill="url(#adminChartGradient)" />
                  <path d={linePath} fill="none" stroke="#10b981" strokeWidth="4" />
                  <circle cx={lastPoint.x} cy={lastPoint.y} r="6" fill="#fff" stroke="#10b981" strokeWidth="3" />
                  <line x1={lastPoint.x} y1={lastPoint.y} x2={lastPoint.x} y2={svgHeight} stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" />
                </svg>
                <div className="admin-chart-tooltip" style={{ left: '100%', top: `${(lastPoint.y / svgHeight) * 100}%`, transform: 'translate(-85%, -100%)' }}>
                  <style>
                    {`.admin-chart-tooltip::after { left: 85% !important; }`}
                  </style>
                  <span>Total Users</span>
                  <strong>{totalAccounts}</strong>
                </div>
                <div className="admin-x-axis" style={{ padding: '12px 0 0 0' }}>
                  <span style={{ width: '0%', textAlign: 'left' }}>Jan</span>
                  <span style={{ width: '20%', textAlign: 'center' }}>Feb</span>
                  <span style={{ width: '20%', textAlign: 'center' }}>Mar</span>
                  <span style={{ width: '20%', textAlign: 'center' }}>Apr</span>
                  <span style={{ width: '20%', textAlign: 'center' }}>May</span>
                  <span style={{ width: '20%', textAlign: 'right' }}>Jun</span>
                </div>
              </div>
            </div>
          </article>

          <article className="admin-card">
            <div className="admin-card-heading">
              <h2>Internal Role Distribution</h2>
              <button className="admin-icon-button" type="button"><MoreVertical size={16}/></button>
            </div>
            <div className="admin-source-layout">
              <div className="admin-donut">
                <svg viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="55" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                  {(() => {
                    let offset = 0;
                    const circumference = 2 * Math.PI * 55;
                    return roleDistribution.map((item, index) => {
                      const dashLength = (item.percentage / 100) * circumference;
                      const circle = (
                        <circle
                          key={item.name}
                          cx="70" cy="70" r="55"
                          stroke={chartStrokeColors[index % chartStrokeColors.length]}
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${dashLength} ${circumference}`}
                          strokeDashoffset={-offset}
                          transform="rotate(-90 70 70)"
                          style={{ transition: 'all 0.5s ease' }}
                        />
                      );
                      offset += dashLength;
                      return circle;
                    });
                  })()}
                </svg>
                <span><Shield size={24} /></span>
              </div>
              <div className="admin-source-list">
                {roleDistribution.map((item, index) => (
                  <div key={item.name} className="admin-progress">
                    <p>
                      <span>{item.name}</span>
                      <strong>{item.percentage}% ({item.count})</strong>
                    </p>
                    <i><b style={{ width: `${item.percentage}%`, background: chartStrokeColors[index % chartStrokeColors.length], borderRadius: '999px' }} /></i>
                  </div>
                ))}
                {roleDistribution.length === 0 && (
                  <p style={{ color: '#64748b', fontSize: '13px' }}>No accounts to display.</p>
                )}
              </div>
            </div>
          </article>
        </section>

      </div>
    </div>
  );
};

export default AdminDashboardPage;
