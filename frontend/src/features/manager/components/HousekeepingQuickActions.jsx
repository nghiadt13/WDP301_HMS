import { Link } from 'react-router-dom';

const HousekeepingQuickActions = () => {
  return (
    <div className="housekeeping-card">
      <div className="housekeeping-card-header">
        <h3>Quick navigation</h3>
        <span className="housekeeping-subtle">Housekeeping views</span>
      </div>
      <div className="housekeeping-list">
        <Link className="housekeeping-task-item" to="/manager/housekeeping/tasks">
          <div>
            <strong>Task board</strong>
            <span>Search, filter, and assign work</span>
          </div>
          <span className="housekeeping-badge inspection">Open</span>
        </Link>
        <Link className="housekeeping-task-item" to="/manager/housekeeping/schedule">
          <div>
            <strong>Schedule</strong>
            <span>Morning, afternoon, and night shifts</span>
          </div>
          <span className="housekeeping-badge ready">View</span>
        </Link>
        <Link className="housekeeping-task-item" to="/manager/housekeeping/staff">
          <div>
            <strong>Staff</strong>
            <span>Track availability and performance</span>
          </div>
          <span className="housekeeping-badge dirty">Team</span>
        </Link>
      </div>
    </div>
  );
};

export default HousekeepingQuickActions;
