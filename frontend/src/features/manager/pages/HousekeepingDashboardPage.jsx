import { AlertTriangle, CheckCircle2, House, RefreshCw, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HousekeepingTaskTable from '../components/HousekeepingTaskTable.jsx';
import HousekeepingStatusBadge from '../components/HousekeepingStatusBadge.jsx';
import { useHousekeepingDashboard } from '../hooks/use-housekeeping.js';
import '../styles/housekeeping.css';

const iconByTone = {
  primary: House,
  warning: AlertTriangle,
  success: CheckCircle2,
  neutral: Wrench,
};

const SummaryCard = ({ item }) => {
  const Icon = iconByTone[item.tone] || House;
  return (
    <div className="housekeeping-summary-card">
      <div className={`housekeeping-summary-icon ${item.tone}`}>
        <Icon size={18} />
      </div>
      <div>
        <span className="housekeeping-summary-value">{item.value}</span>
        <span className="housekeeping-summary-subtitle">{item.title}</span>
      </div>
    </div>
  );
};

const HousekeepingDashboardPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useHousekeepingDashboard();

  const tasks = data?.tasks || [];
  const maintenance = data?.maintenance || [];

  if (isLoading) {
    return (
      <div className="housekeeping-page">
        <div className="housekeeping-state-card">
          <h3>Loading housekeeping operations</h3>
          <p>Reading cleaning tasks and room statuses from MongoDB.</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="housekeeping-page">
        <div className="housekeeping-state-card">
          <h3>Cannot load housekeeping data</h3>
          <p>The API request failed. Retry after backend is available.</p>
          <button className="housekeeping-btn" type="button" onClick={() => refetch()}>Retry</button>
        </div>
      </div>
    );
  }

  const pendingMaintenance = maintenance.filter((item) => ['Open', 'InProgress'].includes(String(item.status)));

  return (
    <div className="housekeeping-page">
      <div className="housekeeping-page-header">
        <div>
          <h2>Housekeeping Operations</h2>
          <p>Real-time cleaning workflow for assigned housekeeping staff.</p>
        </div>
        <div className="housekeeping-task-actions">
          <button className="housekeeping-outline-btn" type="button" onClick={() => refetch()}><RefreshCw size={14} /> Refresh</button>
          <button className="housekeeping-btn" type="button" onClick={() => navigate('/manager/housekeeping/tasks')}>Open Cleaning Tasks</button>
        </div>
      </div>

      <div className="housekeeping-grid">
        {(data?.summary || []).map((item) => <SummaryCard key={item.title} item={item} />)}
      </div>

      <div className="housekeeping-grid housekeeping-grid-2">
        <div className="housekeeping-card">
          <div className="housekeeping-card-header">
            <h3>Incoming Cleaning Requests</h3>
            <span className="housekeeping-subtle">Assigned from receptionist checkout and manager operations</span>
          </div>
          <div className="housekeeping-list">
            {tasks.filter((task) => task.status === 'Assigned').slice(0, 6).map((task) => (
              <div key={task.id} className="housekeeping-task-item">
                <div>
                  <strong>Room {task.roomNumber}</strong>
                  <span>{task.cleaningType} • {task.receptionistNote || 'No note'}</span>
                </div>
                <HousekeepingStatusBadge value={task.status} />
              </div>
            ))}
            {!tasks.filter((task) => task.status === 'Assigned').length ? (
              <div className="housekeeping-subtle">No new cleaning requests.</div>
            ) : null}
          </div>
        </div>

        <div className="housekeeping-card">
          <div className="housekeeping-card-header">
            <h3>Waiting Maintenance</h3>
            <span className="housekeeping-subtle">Cleaning is blocked until maintenance closes</span>
          </div>
          <div className="housekeeping-list">
            {pendingMaintenance.slice(0, 6).map((item) => (
              <div key={item.id} className="housekeeping-task-item">
                <div>
                  <strong>Room {item.room}</strong>
                  <span>{item.category} • {item.description}</span>
                </div>
                <HousekeepingStatusBadge value={item.status} />
              </div>
            ))}
            {!pendingMaintenance.length ? (
              <div className="housekeeping-subtle">No active maintenance blockage.</div>
            ) : null}
          </div>
        </div>
      </div>

      <HousekeepingTaskTable tasks={tasks.slice(0, 8)} />
    </div>
  );
};

export default HousekeepingDashboardPage;
