import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Search } from 'lucide-react';
import HousekeepingStatusBadge from '../components/HousekeepingStatusBadge.jsx';
import { useHousekeepingDashboard, useHousekeepingTasks } from '../hooks/use-housekeeping.js';
import { housekeepingApi } from '../services/housekeeping-api.js';
import '../styles/housekeeping.css';

const normalizeStatus = (value) => String(value || '').toLowerCase().replace(/\s+/g, '');

const isActionAllowed = (action, status) => {
  const normalized = normalizeStatus(status);
  if (action === 'accept') return ['assigned', 'accepted'].includes(normalized);
  if (action === 'start') return ['assigned', 'accepted'].includes(normalized);
  if (action === 'complete') return normalized === 'cleaning';
  if (action === 'issue') return !['completed', 'cancelled'].includes(normalized);
  return true;
};

const getMutationErrorMessage = (error) => {
  const apiMessage = error?.response?.data?.message;
  if (apiMessage) return apiMessage;
  if (error?.message) return error.message;
  return 'Action failed. Please try again.';
};

const askWithFallback = (message, defaultValue = '') => {
  if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
    try {
      return window.prompt(message, defaultValue);
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const toChecklistLabel = (key) => {
  const labels = {
    bed: 'Bed',
    bathroom: 'Bathroom',
    furniture: 'Furniture',
    amenities: 'Amenities',
    damage: 'Damage check',
    lostItem: 'Lost item check',
    minibar: 'Minibar check',
    photo: 'Photo evidence',
  };
  return labels[key] || key;
};

const HousekeepingTasksPage = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useHousekeepingTasks();
  const dashboardQuery = useHousekeepingDashboard();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTaskId, setSelectedTaskId] = useState('');

  const taskActionMutation = useMutation({
    mutationFn: async ({ action, task }) => {
      if (!task?.id) return null;
      if (!isActionAllowed(action, task.status)) {
        throw new Error(`Cannot ${action} when task is in ${task.status} status.`);
      }
      if (action === 'accept') return housekeepingApi.acceptTask(task.id);
      if (action === 'start') return housekeepingApi.startTask(task.id);
      if (action === 'complete') return housekeepingApi.completeTask(task.id);
      if (action === 'issue') {
        const category = askWithFallback('Maintenance category', 'Equipment Failure');
        if (!category) return null;
        const priority = askWithFallback('Priority (low|medium|high|urgent)', 'high') || 'high';
        const description = askWithFallback('Issue description', task?.receptionistNote || 'Maintenance required');
        if (!description) return null;
        const image = askWithFallback('Optional photo URL', '') || '';
        const note = askWithFallback('Optional notes', '') || '';
        return housekeepingApi.reportIssue({
          task_id: task.id,
          room_number: task.roomNumber,
          category,
          priority,
          description,
          image,
          note,
          reportedBy: 'Housekeeping',
        });
      }
      return null;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['housekeeping-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['housekeeping-maintenance'] }),
        queryClient.invalidateQueries({ queryKey: ['receptionist-operational-board'] }),
      ]);
    },
    onError: (error) => {
      window.alert(getMutationErrorMessage(error));
    },
  });

  const tasks = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return (data || []).filter((task) => {
      const matchKeyword = !keyword || [task.roomNumber, task.cleaningType, task.receptionistNote, task.assignedBy]
        .some((item) => String(item || '').toLowerCase().includes(keyword));
      const matchFilter = filter === 'all' || normalizeStatus(task.status) === filter;
      const matchPriority = priorityFilter === 'all' || String(task.priority || '').toLowerCase() === priorityFilter;
      return matchKeyword && matchFilter && matchPriority;
    });
  }, [data, search, filter, priorityFilter]);

  useEffect(() => {
    if (!tasks.length) {
      setSelectedTaskId('');
      return;
    }
    const exists = tasks.some((task) => task.id === selectedTaskId);
    if (!exists) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [tasks, selectedTaskId]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) || null,
    [tasks, selectedTaskId]
  );

  const roomsByNumber = useMemo(() => {
    return Object.fromEntries((dashboardQuery.data?.rooms || []).map((room) => [room.roomNumber, room]));
  }, [dashboardQuery.data?.rooms]);

  const selectedRoom = selectedTask ? roomsByNumber[selectedTask.roomNumber] || null : null;

  const inspectionQuery = useQuery({
    queryKey: ['housekeeping-room-inspection', selectedTask?.roomNumber],
    queryFn: () => housekeepingApi.getInspectionByRoom(selectedTask.roomNumber),
    enabled: Boolean(selectedTask?.roomNumber),
    retry: 1,
    staleTime: 5_000,
  });

  const checklistEntries = useMemo(() => {
    const checklist = inspectionQuery.data?.checklist || {};
    return Object.entries(checklist);
  }, [inspectionQuery.data?.checklist]);

  const checklistDone = checklistEntries.filter(([, done]) => Boolean(done)).length;
  const checklistProgress = checklistEntries.length ? Math.round((checklistDone / checklistEntries.length) * 100) : 0;

  const summary = useMemo(() => {
    const all = data || [];
    const assigned = all.filter((task) => normalizeStatus(task.status) === 'assigned').length;
    const cleaning = all.filter((task) => normalizeStatus(task.status) === 'cleaning').length;
    const waitingMaintenance = all.filter((task) => normalizeStatus(task.status) === 'waitingmaintenance').length;
    const completed = all.filter((task) => normalizeStatus(task.status) === 'completed').length;
    return [
      { label: 'Total tasks', value: all.length },
      { label: 'New assigned', value: assigned },
      { label: 'In cleaning', value: cleaning },
      { label: 'Waiting maintenance', value: waitingMaintenance },
      { label: 'Completed', value: completed },
    ];
  }, [data]);

  const onTaskAction = async (action, task) => {
    await taskActionMutation.mutateAsync({ action, task });
    await refetch();
  };

  if (isLoading) {
    return (
      <div className="housekeeping-page">
        <div className="housekeeping-state-card">
          <h3>Loading cleaning tasks</h3>
          <p>Fetching receptionist-assigned cleaning tasks from MongoDB.</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="housekeeping-page">
        <div className="housekeeping-state-card">
          <h3>Cannot load cleaning tasks</h3>
          <p>The API request failed. Retry when backend is running.</p>
          <button className="housekeeping-btn" type="button" onClick={() => refetch()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="housekeeping-page">
      <div className="housekeeping-page-header">
        <div>
          <h2>Cleaning Tasks</h2>
          <p>Receptionist-assigned rooms from MongoDB with real-time housekeeping progress.</p>
        </div>
        <div className="housekeeping-task-actions">
          <button className="housekeeping-outline-btn" type="button" onClick={() => refetch()}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      <section className="housekeeping-task-workspace">
        <div className="housekeeping-task-list-pane housekeeping-card">
          <div className="housekeeping-filter-bar">
            <label className="housekeeping-search-field">
              <Search size={14} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search room, task type, note"
              />
            </label>
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All status</option>
              <option value="assigned">Assigned</option>
              <option value="accepted">Accepted</option>
              <option value="cleaning">Cleaning</option>
              <option value="waitingmaintenance">Waiting Maintenance</option>
              <option value="completed">Completed</option>
            </select>
            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="housekeeping-task-summary-grid">
            {summary.map((item) => (
              <article key={item.label} className="housekeeping-task-summary-card">
                <p>{item.label}</p>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>

          <div className="housekeeping-task-list">
            {tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                className={`housekeeping-task-list-item${selectedTaskId === task.id ? ' is-selected' : ''}`}
                onClick={() => setSelectedTaskId(task.id)}
              >
                <div className="housekeeping-task-list-item-head">
                  <strong>Room {task.roomNumber}</strong>
                  <HousekeepingStatusBadge value={task.status} />
                </div>
                <div className="housekeeping-task-list-item-meta">
                  <span>{task.cleaningType || 'Checkout Cleaning'}</span>
                  <HousekeepingStatusBadge value={task.priority} variant="priority" />
                </div>
                <p>{task.receptionistNote || 'No receptionist note provided.'}</p>
                <small>
                  Checkout: {formatDateTime(task.checkoutTime)} • Due: {formatDateTime(task.dueTime)}
                </small>
              </button>
            ))}
            {!tasks.length ? (
              <div className="housekeeping-state-card">
                <h3>No matching tasks</h3>
                <p>All filters are based on MongoDB task records.</p>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="housekeeping-task-detail-pane housekeeping-card">
          {!selectedTask ? (
            <div className="housekeeping-state-card">
              <h3>No task selected</h3>
              <p>Select a task from the list to view details.</p>
            </div>
          ) : (
            <div className="housekeeping-task-detail-content">
              <header className="housekeeping-card-header">
                <h3>Room {selectedTask.roomNumber}</h3>
                <HousekeepingStatusBadge value={selectedTask.status} />
              </header>

              <section className="housekeeping-task-detail-section">
                <h4>Room information</h4>
                <div className="housekeeping-task-kv-grid">
                  <span>Room type</span><b>{selectedRoom?.roomType || '—'}</b>
                  <span>Floor</span><b>{selectedRoom?.floor || '—'}</b>
                  <span>Building</span><b>{selectedRoom?.building || '—'}</b>
                  <span>Room status</span><b>{selectedRoom?.status || '—'}</b>
                </div>
              </section>

              <section className="housekeeping-task-detail-section">
                <h4>Task information</h4>
                <div className="housekeeping-task-kv-grid">
                  <span>Task type</span><b>{selectedTask.cleaningType || 'Checkout Cleaning'}</b>
                  <span>Priority</span><b>{selectedTask.priority || '—'}</b>
                  <span>Assigned by</span><b>{selectedTask.assignedBy || 'Receptionist'}</b>
                  <span>Checkout time</span><b>{formatDateTime(selectedTask.checkoutTime)}</b>
                  <span>Due time</span><b>{formatDateTime(selectedTask.dueTime)}</b>
                </div>
              </section>

              <section className="housekeeping-task-detail-section">
                <h4>Receptionist notes</h4>
                <p>{selectedTask.receptionistNote || 'No receptionist note provided.'}</p>
                {selectedTask.guestRequest ? (
                  <p><strong>Guest request:</strong> {selectedTask.guestRequest}</p>
                ) : null}
              </section>

              <section className="housekeeping-task-detail-section">
                <h4>Assigned staff</h4>
                <p>{selectedTask.assignedTo || 'Housekeeping Team'}</p>
              </section>

              <section className="housekeeping-task-detail-section">
                <div className="housekeeping-task-checklist-head">
                  <h4>Cleaning checklist</h4>
                  <span>{checklistDone}/{checklistEntries.length} done</span>
                </div>
                <div className="housekeeping-task-progress">
                  <span style={{ width: `${checklistProgress}%` }} />
                </div>
                {inspectionQuery.isLoading ? (
                  <p>Loading checklist...</p>
                ) : checklistEntries.length ? (
                  <ul className="housekeeping-task-checklist">
                    {checklistEntries.map(([key, done]) => (
                      <li key={key}>
                        <span>{toChecklistLabel(key)}</span>
                        <strong>{done ? 'Done' : 'Pending'}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No inspection checklist found for this room yet.</p>
                )}
              </section>

              <section className="housekeeping-task-detail-section">
                <h4>Condition photos</h4>
                {inspectionQuery.data?.photos?.length ? (
                  <div className="housekeeping-task-photo-grid">
                    {inspectionQuery.data.photos.map((photo) => (
                      <img key={photo} src={photo} alt={`Room ${selectedTask.roomNumber} condition`} />
                    ))}
                  </div>
                ) : (
                  <p>No condition photos uploaded.</p>
                )}
              </section>

              <section className="housekeeping-task-detail-section">
                <h4>Inspection notes</h4>
                <p>{inspectionQuery.data?.note || 'No inspection note.'}</p>
                {inspectionQuery.data?.remarks ? (
                  <p><strong>Remarks:</strong> {inspectionQuery.data.remarks}</p>
                ) : null}
              </section>

              <section className="housekeeping-task-detail-actions">
                <button
                  className="housekeeping-outline-btn"
                  type="button"
                  disabled={!isActionAllowed('accept', selectedTask.status) || taskActionMutation.isPending}
                  onClick={() => onTaskAction('accept', selectedTask)}
                >
                  Accept Task
                </button>
                <button
                  className="housekeeping-outline-btn"
                  type="button"
                  disabled={!isActionAllowed('start', selectedTask.status) || taskActionMutation.isPending}
                  onClick={() => onTaskAction('start', selectedTask)}
                >
                  Start Cleaning
                </button>
                <button
                  className="housekeeping-btn"
                  type="button"
                  disabled={!isActionAllowed('complete', selectedTask.status) || taskActionMutation.isPending}
                  onClick={() => onTaskAction('complete', selectedTask)}
                >
                  Complete Cleaning
                </button>
                <button
                  className="housekeeping-outline-btn"
                  type="button"
                  disabled={!isActionAllowed('issue', selectedTask.status) || taskActionMutation.isPending}
                  onClick={() => onTaskAction('issue', selectedTask)}
                >
                  Report Maintenance
                </button>
              </section>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
};

export default HousekeepingTasksPage;
