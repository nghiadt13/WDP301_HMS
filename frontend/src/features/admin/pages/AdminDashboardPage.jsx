import { useState, useMemo } from 'react';
import { Home, Users, Shield, Briefcase, Activity, Settings, Plus, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useAccounts, useRoles } from '../hooks/use-admin';
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

  const accounts = accountsData?.items || [];
  const roles = rolesData?.items || [];

  const totalAccounts = accountsData?.pagination?.total || 0;
  const activeAccounts = accounts.filter(a => a.status === 'active').length;
  const totalRoles = roles.length;
  const activeRoles = roles.filter(r => r.is_active).length;

  // Calculate role distribution
  const roleDistribution = useMemo(() => {
    if (!accounts.length) return [];
    
    const dist = {};
    accounts.forEach(acc => {
      const roleName = acc.role_id?.name || 'Unassigned';
      dist[roleName] = (dist[roleName] || 0) + 1;
    });

    return Object.entries(dist).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / accounts.length) * 100)
    })).sort((a, b) => b.count - a.count);
  }, [accounts]);

  const colors = ['donut-blue', 'donut-lime', 'donut-gray', 'donut-dark'];
  const hexColors = ['blue', 'lime', 'gray', 'dark'];

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
          <StatCard title="Security Alerts" value="0" trendType="down" trendValue="0" subtitle="No alerts found" icon={Activity} tone="pale" />
        </section>

        {/* Charts / Insights */}
        <section className="admin-grid admin-charts">
          <article className="admin-card admin-chart-card">
            <div className="admin-card-heading">
              <h2>Account Growth</h2>
              <button type="button">Last 6 Months</button>
            </div>
            <div className="admin-line-chart">
              <div className="admin-y-axis"><span>40</span><span>30</span><span>20</span><span>10</span><span>0</span></div>
              <div className="admin-chart-canvas">
                <svg viewBox="0 0 350 150" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="adminChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <g className="admin-grid-lines">
                    <line x1="0" y1="0" x2="350" y2="0" />
                    <line x1="0" y1="37.5" x2="350" y2="37.5" />
                    <line x1="0" y1="75" x2="350" y2="75" />
                    <line x1="0" y1="112.5" x2="350" y2="112.5" />
                    <line x1="0" y1="150" x2="350" y2="150" />
                  </g>
                  {/* Decorative line representing data */}
                  <path d="M0,130 C30,130 50,110 80,110 C120,110 140,90 180,90 C220,90 240,120 280,120 C320,120 330,80 350,80 L350,150 L0,150 Z" fill="url(#adminChartGradient)" />
                  <path d="M0,130 C30,130 50,110 80,110 C120,110 140,90 180,90 C220,90 240,120 280,120 C320,120 330,80 350,80" fill="none" stroke="#10b981" strokeWidth="3" />
                  <circle cx="180" cy="90" r="5" fill="#fff" stroke="#10b981" strokeWidth="3" />
                  <line x1="180" y1="90" x2="180" y2="150" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" />
                </svg>
                <div className="admin-chart-tooltip" style={{ left: '50%', top: '50%' }}>
                  <span>Total Users</span>
                  <strong>{totalAccounts}</strong>
                </div>
                <div className="admin-x-axis"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span></div>
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
                  <circle cx="70" cy="70" r="55" />
                  <circle className="donut-blue" cx="70" cy="70" r="55" />
                  <circle className="donut-lime" cx="70" cy="70" r="55" />
                  <circle className="donut-gray" cx="70" cy="70" r="55" />
                </svg>
                <span><Shield size={24} /></span>
              </div>
              <div className="admin-source-list">
                {roleDistribution.map((item, index) => (
                  <div className="admin-progress" key={item.name}>
                    <p>
                      <span>{item.name}</span>
                      <strong>{item.percentage}% ({item.count})</strong>
                    </p>
                    <i><b className={hexColors[index % hexColors.length]} style={{ width: `${item.percentage}%` }} /></i>
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
