import { RefreshCw } from 'lucide-react';
import { useHousekeepingRequests, useHousekeepingInspections, useHousekeepingIssues } from '../hooks/use-housekeeping.js';
import '../styles/housekeeping.css';

const HousekeepingOperationsPage = () => {
  const requestsQuery = useHousekeepingRequests();
  const inspectionsQuery = useHousekeepingInspections();
  const issuesQuery = useHousekeepingIssues();

  const isLoading = requestsQuery.isLoading || inspectionsQuery.isLoading || issuesQuery.isLoading;
  const isError = requestsQuery.isError || inspectionsQuery.isError || issuesQuery.isError;

  if (isLoading) {
    return (
      <div className="housekeeping-page">
        <div className="housekeeping-page-header">
          <div>
            <h2>Housekeeping operations</h2>
            <p>Loading service requests, inspections, and issues…</p>
          </div>
        </div>
        <div className="housekeeping-state-card">
          <h3>Preparing operations view</h3>
          <p>Collecting current room and service activity.</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="housekeeping-page">
        <div className="housekeeping-state-card">
          <h3>We could not load operations data.</h3>
          <p>Please retry to refresh the latest hotel housekeeping activity.</p>
          <button className="housekeeping-btn" type="button" onClick={() => { requestsQuery.refetch(); inspectionsQuery.refetch(); issuesQuery.refetch(); }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="housekeeping-page">
      <div className="housekeeping-page-header">
        <div>
          <h2>Housekeeping operations</h2>
          <p>Monitor guest requests, room inspections, and maintenance issues.</p>
        </div>
        <div className="housekeeping-task-actions">
          <button className="housekeeping-outline-btn" type="button" onClick={() => { requestsQuery.refetch(); inspectionsQuery.refetch(); issuesQuery.refetch(); }}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      <div className="housekeeping-grid housekeeping-grid-2">
        <div className="housekeeping-card">
          <div className="housekeeping-card-header">
            <h3>Service requests</h3>
            <span className="housekeeping-subtle">Guest support queue</span>
          </div>
          <div className="housekeeping-list">
            {(requestsQuery.data || []).map((request) => (
              <div key={request.id} className="housekeeping-task-item">
                <div>
                  <strong>{request.category}</strong>
                  <span>Room {request.roomNumber} • {request.detail}</span>
                </div>
                <div className="housekeeping-task-actions">
                  <span className="housekeeping-badge inspection">{request.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="housekeeping-card">
          <div className="housekeeping-card-header">
            <h3>Inspections</h3>
            <span className="housekeeping-subtle">After checkout review</span>
          </div>
          <div className="housekeeping-list">
            {(inspectionsQuery.data || []).map((inspection) => (
              <div key={inspection.id} className="housekeeping-task-item">
                <div>
                  <strong>Room {inspection.roomNumber}</strong>
                  <span>{inspection.notes}</span>
                </div>
                <div className="housekeeping-task-actions">
                  <span className="housekeeping-badge ready">{inspection.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="housekeeping-card">
        <div className="housekeeping-card-header">
          <h3>Reported issues</h3>
          <span className="housekeeping-subtle">Maintenance follow-up</span>
        </div>
        <div className="housekeeping-list">
          {(issuesQuery.data || []).map((issue) => (
            <div key={issue.id} className="housekeeping-task-item">
              <div>
                <strong>{issue.category}</strong>
                <span>Room {issue.roomNumber} • {issue.description}</span>
              </div>
              <div className="housekeeping-task-actions">
                <span className="housekeeping-badge dirty">{issue.priority}</span>
                <span className="housekeeping-badge inspection">{issue.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HousekeepingOperationsPage;
