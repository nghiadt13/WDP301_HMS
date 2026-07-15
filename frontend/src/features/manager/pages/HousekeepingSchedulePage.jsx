import { RefreshCw } from 'lucide-react';
import HousekeepingStatusBadge from '../components/HousekeepingStatusBadge.jsx';
import { useHousekeepingMaintenance } from '../hooks/use-housekeeping.js';
import '../styles/housekeeping.css';

const HousekeepingSchedulePage = () => {
  const { data, isLoading, isError, refetch } = useHousekeepingMaintenance();

  if (isLoading) {
    return (
      <div className="housekeeping-page">
        <div className="housekeeping-state-card">
          <h3>Loading maintenance reports</h3>
          <p>Reading maintenance requests from MongoDB.</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="housekeeping-page">
        <div className="housekeeping-state-card">
          <h3>Cannot load maintenance reports</h3>
          <p>Retry after backend is available.</p>
          <button className="housekeeping-btn" type="button" onClick={() => refetch()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="housekeeping-page">
      <div className="housekeeping-page-header">
        <div>
          <h2>Maintenance Report</h2>
          <p>Issues reported by housekeeping during cleaning workflow.</p>
        </div>
        <div className="housekeeping-task-actions">
          <button className="housekeeping-outline-btn" type="button" onClick={() => refetch()}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      <div className="housekeeping-card">
        <div className="housekeeping-table-wrap">
          <table className="housekeeping-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Description</th>
                <th>Status</th>
                <th>Assigned Technical</th>
              </tr>
            </thead>
            <tbody>
              {(data || []).map((item) => (
                <tr key={item.id}>
                  <td>{item.room}</td>
                  <td>{item.category}</td>
                  <td><HousekeepingStatusBadge value={item.priority} variant="priority" /></td>
                  <td>{item.description}</td>
                  <td><HousekeepingStatusBadge value={item.status} /></td>
                  <td>{item.assignedTech || 'Not assigned'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HousekeepingSchedulePage;
