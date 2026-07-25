import HousekeepingStatusBadge from './HousekeepingStatusBadge.jsx';

const HousekeepingTaskTable = ({ tasks = [], onAction }) => {
  const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="housekeeping-card">
      <div className="housekeeping-card-header">
        <h3>Cleaning Tasks</h3>
        <span className="housekeeping-subtle">Assigned by receptionist workflow</span>
      </div>
      <div className="housekeeping-table-wrap">
        <table className="housekeeping-table">
          <thead>
            <tr>
              <th>Room Number</th>
              <th>Cleaning Type</th>
              <th>Priority</th>
              <th>Receptionist Note</th>
              <th>Checkout Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.roomNumber}</td>
                <td>{task.cleaningType || 'Checkout Cleaning'}</td>
                <td><HousekeepingStatusBadge value={task.priority} variant="priority" /></td>
                <td>{task.receptionistNote || '—'}</td>
                <td>{formatDateTime(task.checkoutTime)}</td>
                <td><HousekeepingStatusBadge value={task.status} /></td>
                <td>
                  <div className="housekeeping-task-actions">
                    <button className="housekeeping-outline-btn" type="button" onClick={() => onAction?.('view', task)}>View</button>
                    <button className="housekeeping-outline-btn" type="button" onClick={() => onAction?.('accept', task)}>Accept</button>
                    <button className="housekeeping-outline-btn" type="button" onClick={() => onAction?.('start', task)}>Start Cleaning</button>
                    <button className="housekeeping-outline-btn" type="button" onClick={() => onAction?.('complete', task)}>Complete Cleaning</button>
                    <button className="housekeeping-outline-btn" type="button" onClick={() => onAction?.('issue', task)}>Report Maintenance</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HousekeepingTaskTable;
