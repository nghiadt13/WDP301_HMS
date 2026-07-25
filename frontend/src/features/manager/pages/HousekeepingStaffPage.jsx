import { RefreshCw, Star } from 'lucide-react';
import { useHousekeepingStaff } from '../hooks/use-housekeeping.js';
import '../styles/housekeeping.css';

const HousekeepingStaffPage = () => {
  const { data, isLoading, isError, refetch } = useHousekeepingStaff();

  if (isLoading) {
    return (
      <div className="housekeeping-page">
        <div className="housekeeping-page-header">
          <div>
            <h2>Housekeeping staff</h2>
            <p>Loading assigned team status…</p>
          </div>
        </div>
        <div className="housekeeping-state-card">
          <h3>Loading staff roster</h3>
          <p>The team status board is being prepared.</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="housekeeping-page">
        <div className="housekeeping-state-card">
          <h3>We could not load staff data.</h3>
          <p>Please retry to refresh the roster.</p>
          <button className="housekeeping-btn" type="button" onClick={() => refetch()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="housekeeping-page">
      <div className="housekeeping-page-header">
        <div>
          <h2>Housekeeping staff</h2>
          <p>Monitor online status, rating, and daily productivity.</p>
        </div>
        <div className="housekeeping-task-actions">
          <button className="housekeeping-outline-btn" type="button" onClick={() => refetch()}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>
      <div className="housekeeping-grid">
        {(data || []).map((member) => (
          <div key={member.id} className="housekeeping-staff-card">
            <div className="housekeeping-staff-info">
              <strong>{member.name}</strong>
              <span>{member.role}</span>
              <span>{member.status}</span>
            </div>
            <div className="housekeeping-task-actions">
              <span className="housekeeping-badge ready"><Star size={12} /> {member.rating}</span>
              <span className="housekeeping-badge inspection">{member.completedToday} done</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HousekeepingStaffPage;
