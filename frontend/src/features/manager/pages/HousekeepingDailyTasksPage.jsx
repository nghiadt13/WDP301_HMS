import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import HousekeepingStatusBadge from '../components/HousekeepingStatusBadge.jsx';
import { useHousekeepingDashboard, useHousekeepingMaintenance } from '../hooks/use-housekeeping.js';
import { housekeepingApi } from '../services/housekeeping-api.js';
import '../styles/housekeeping.css';

const normalizeStatus = (value) => String(value || '').toLowerCase().replace(/\s+/g, '');
const isCompletedTask = (task) => ['completed', 'cancelled', 'canceled'].includes(normalizeStatus(task?.status));
const TASKS_PER_PAGE = 6;
const isBeforeScheduledStart = (task) => {
  if (!task?.workDate || !task?.startTime) return false;
  const [hours, minutes] = task.startTime.split(':').map(Number);
  const start = new Date(task.workDate);
  start.setHours(hours, minutes, 0, 0);
  return !Number.isNaN(start.getTime()) && new Date() < start;
};

const getStageClass = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized === 'assigned') return 'housekeeping-stage-assigned';
  if (normalized === 'accepted') return 'housekeeping-stage-accepted';
  if (normalized === 'cleaning') return 'housekeeping-stage-cleaning';
  if (normalized === 'waitingmaintenance') return 'housekeeping-stage-waiting-maintenance';
  if (normalized === 'completed') return 'housekeeping-stage-completed';
  return 'housekeeping-stage-default';
};

const isActionAllowed = (action, status) => {
  const normalized = normalizeStatus(status);
  if (action === 'accept') return ['assigned', 'accepted'].includes(normalized);
  if (action === 'start') return ['assigned', 'accepted'].includes(normalized);
  if (action === 'complete') return normalized === 'cleaning';
  if (action === 'issue') return !['completed', 'cancelled', 'canceled'].includes(normalized);
  return true;
};

const hasActiveMaintenanceRequest = (maintenanceRequests, roomNumber) => {
  const targetRoom = String(roomNumber || '').trim().toLowerCase();
  if (!targetRoom) return false;
  return (maintenanceRequests || []).some((request) => {
    const requestRoom = String(request?.room || request?.roomNumber || request?.room_number || '').trim().toLowerCase();
    const requestStatus = normalizeStatus(request?.status);
    return requestRoom === targetRoom && ['open', 'inprogress'].includes(requestStatus);
  });
};

const getMutationErrorMessage = (error) => {
  const apiMessage = error?.response?.data?.message;
  if (apiMessage) return apiMessage;
  if (error?.message) return error.message;
  return 'Action failed. Please try again.';
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const HousekeepingDailyTasksPage = () => {
  const queryClient = useQueryClient();
  const tasksQuery = useQuery({
    queryKey: ['housekeeping-daily-tasks'],
    queryFn: () => housekeepingApi.getTasks({ manager_assigned_only: 'true' }),
    retry: 1,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });
  const dashboardQuery = useHousekeepingDashboard();
  const maintenanceQuery = useHousekeepingMaintenance();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [taskTab, setTaskTab] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [completionNote, setCompletionNote] = useState('');

  const taskActionMutation = useMutation({
    mutationFn: async ({ action, task }) => {
      if (!task?.id) return null;
      if (!isActionAllowed(action, task.status)) {
        throw new Error(`Cannot ${action} when task is in ${task.status} status.`);
      }
      if (action === 'accept') return housekeepingApi.acceptTask(task.id);
      if (action === 'start') return housekeepingApi.startTask(task.id);
      if (action === 'complete') return housekeepingApi.completeTask(task.id, {
        completion_note: completionNote.trim(),
      });
      return null;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['housekeeping-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['housekeeping-daily-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['housekeeping-maintenance'] }),
        queryClient.invalidateQueries({ queryKey: ['housekeeping-service-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['receptionist-operational-board'] }),
      ]);
    },
    onError: (error) => {
      window.alert(getMutationErrorMessage(error));
    },
  });

  const baseTasks = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return (tasksQuery.data || []).filter((task) => {
      const matchKeyword = !keyword || [task.roomNumber, task.cleaningType, task.description, task.receptionistNote, task.assignedBy]
        .some((item) => String(item || '').toLowerCase().includes(keyword));
      const matchFilter = filter === 'all' || normalizeStatus(task.status) === filter;
      return matchKeyword && matchFilter;
    }).sort((first, second) => {
      const dateOrder = new Date(first.workDate || first.dueTime) - new Date(second.workDate || second.dueTime);
      return dateOrder || String(first.startTime || '').localeCompare(String(second.startTime || ''));
    });
  }, [tasksQuery.data, search, filter]);

  const taskTabCounts = useMemo(() => ({
    active: baseTasks.filter((task) => !isCompletedTask(task)).length,
    completed: baseTasks.filter((task) => isCompletedTask(task)).length,
    all: baseTasks.length,
  }), [baseTasks]);

  const tasks = useMemo(() => {
    if (taskTab === 'completed') {
      return baseTasks.filter((task) => isCompletedTask(task));
    }
    if (taskTab === 'all') {
      return baseTasks;
    }
    return baseTasks.filter((task) => !isCompletedTask(task));
  }, [baseTasks, taskTab]);

  const totalPages = Math.max(1, Math.ceil(tasks.length / TASKS_PER_PAGE));
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * TASKS_PER_PAGE;
    return tasks.slice(startIndex, startIndex + TASKS_PER_PAGE);
  }, [tasks, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [taskTab]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!paginatedTasks.length) {
      setSelectedTaskId('');
      return;
    }
    const exists = paginatedTasks.some((task) => task.id === selectedTaskId);
    if (!exists) {
      setSelectedTaskId(paginatedTasks[0].id);
    }
  }, [paginatedTasks, selectedTaskId]);

  useEffect(() => {
    setCompletionNote('');
  }, [selectedTaskId]);

  const selectedTask = useMemo(
    () => paginatedTasks.find((task) => task.id === selectedTaskId) || null,
    [paginatedTasks, selectedTaskId]
  );

  const roomsByNumber = useMemo(() => {
    return Object.fromEntries((dashboardQuery.data?.rooms || []).map((room) => [room.roomNumber, room]));
  }, [dashboardQuery.data?.rooms]);

  const selectedRoom = selectedTask ? roomsByNumber[selectedTask.roomNumber] || null : null;
  const selectedTaskHasActiveMaintenance = hasActiveMaintenanceRequest(maintenanceQuery.data, selectedTask?.roomNumber);
  const selectedTaskIsBeforeStart = isBeforeScheduledStart(selectedTask);

  const summary = useMemo(() => {
    const all = tasksQuery.data || [];
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
  }, [tasksQuery.data]);

  const onTaskAction = async (action, task) => {
    await taskActionMutation.mutateAsync({ action, task });
    await tasksQuery.refetch();
  };

  if (tasksQuery.isLoading) {
    return (
      <div className="housekeeping-page">
        <div className="housekeeping-state-card">
          <h3>Loading daily tasks</h3>
          <p>Fetching manager-assigned daily tasks from MongoDB.</p>
        </div>
      </div>
    );
  }

  if (tasksQuery.isError) {
    return (
      <div className="housekeeping-page">
        <div className="housekeeping-state-card">
          <h3>Cannot load daily tasks</h3>
          <p>The API request failed. Retry when backend is running.</p>
          <button className="housekeeping-btn" type="button" onClick={() => tasksQuery.refetch()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="housekeeping-page">
      <div className="housekeeping-page-header">
        <div>
          <h2>Daily Tasks</h2>
          <p>Manager-assigned daily tasks with real-time housekeeping progress.</p>
        </div>
      </div>

      <div className="housekeeping-card">
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
          <button className="housekeeping-outline-btn" type="button" onClick={() => tasksQuery.refetch()}><RefreshCw size={14} /> Refresh</button>
        </div>

        <div className="housekeeping-task-tabs" role="tablist" aria-label="Daily housekeeping task groups">
          <button
            type="button"
            className={`housekeeping-task-tab${taskTab === 'active' ? ' is-active' : ''}`}
            onClick={() => setTaskTab('active')}
          >
            Đang xử lý
            <span>{taskTabCounts.active}</span>
          </button>
          <button
            type="button"
            className={`housekeeping-task-tab${taskTab === 'completed' ? ' is-active' : ''}`}
            onClick={() => setTaskTab('completed')}
          >
            Hoàn thành
            <span>{taskTabCounts.completed}</span>
          </button>
          <button
            type="button"
            className={`housekeeping-task-tab${taskTab === 'all' ? ' is-active' : ''}`}
            onClick={() => setTaskTab('all')}
          >
            Tất cả
            <span>{taskTabCounts.all}</span>
          </button>
        </div>
      </div>

      <div className="housekeeping-task-summary-grid">
        {summary.map((item) => (
          <article key={item.label} className="housekeeping-task-summary-card">
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>

      <section className="housekeeping-task-workspace housekeeping-task-workspace-daily">
        <div className="housekeeping-task-list-pane housekeeping-card">
          <div className="housekeeping-task-list">
            {paginatedTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                className={`housekeeping-task-list-item ${getStageClass(task.status)}${selectedTaskId === task.id ? ' is-selected' : ''}`}
                onClick={() => setSelectedTaskId(task.id)}
              >
                <div className="housekeeping-task-list-item-head">
                  <strong>Room {task.roomNumber}</strong>
                  <HousekeepingStatusBadge value={task.status} />
                </div>
                <div className="housekeeping-task-list-item-meta">
                  <span>{task.cleaningType || 'Daily Task'}</span>
                </div>
                <p>{task.description || task.receptionistNote || 'No note provided.'}</p>
                <small>
                  Work date: {formatDateTime(task.workDate || task.dueTime).split(' ')[0]} | {task.startTime || '--:--'} - {task.endTime || '--:--'}
                </small>
              </button>
            ))}
            {!paginatedTasks.length ? (
              <div className="housekeeping-state-card">
                <h3>No matching tasks</h3>
                <p>All filters are based on manager-assigned task records.</p>
              </div>
            ) : null}
          </div>
          {tasks.length > 0 ? (
            <div className="housekeeping-list-pagination">
              <button
                className="housekeeping-outline-btn"
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Prev
              </button>
              <div className="housekeeping-list-pagination-pages">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`housekeeping-page-number${currentPage === page ? ' is-active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                className="housekeeping-outline-btn"
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>

        <aside className={`housekeeping-task-detail-pane housekeeping-card ${getStageClass(selectedTask?.status)}`}>
          {!selectedTask ? (
            <div className="housekeeping-state-card">
              <h3>No task selected</h3>
              <p>Select a task from the list to view details.</p>
            </div>
          ) : (
            <div className="housekeeping-task-detail-content">
              <header className="housekeeping-card-header housekeeping-task-stage-header">
                <h3>Room {selectedTask.roomNumber}</h3>
                <HousekeepingStatusBadge value={selectedTask.status} />
              </header>

              <section className="housekeeping-task-detail-section">
                <h4>Room information</h4>
                <div className="housekeeping-task-kv-grid">
                  <span>Room type</span><b>{selectedRoom?.roomType || '-'}</b>
                  <span>Floor</span><b>{selectedRoom?.floor || '-'}</b>
                  <span>Building</span><b>{selectedRoom?.building || '-'}</b>
                  <span>Room status</span><b>{selectedRoom?.status || '-'}</b>
                </div>
              </section>

              <section className="housekeeping-task-detail-section">
                <h4>Work schedule</h4>
                <div className="housekeeping-task-kv-grid">
                  <span>Task type</span><b>{selectedTask.cleaningType || 'Daily Task'}</b>
                  <span>Assigned by</span><b>{selectedTask.assignedBy || '-'}</b>
                  <span>Work date</span><b>{formatDateTime(selectedTask.workDate || selectedTask.dueTime).split(' ')[0]}</b>
                  <span>Working time</span><b>{selectedTask.startTime || '--:--'} - {selectedTask.endTime || '--:--'}</b>
                </div>
              </section>

              <section className="housekeeping-task-detail-section">
                <h4>Notes</h4>
                <p>{selectedTask.description || selectedTask.receptionistNote || 'No note provided.'}</p>
                {selectedTask.guestRequest ? (
                  <p><strong>Guest request:</strong> {selectedTask.guestRequest}</p>
                ) : null}
              </section>

              <section className="housekeeping-task-detail-section">
                <h4>Assigned staff</h4>
                <p>{selectedTask.assignedTo || 'Housekeeping Team'}</p>
              </section>

              {normalizeStatus(selectedTask.status) === 'cleaning' ? (
                <section className="housekeeping-task-detail-section">
                  <h4>Completion note</h4>
                  <textarea
                    className="housekeeping-maintenance-textarea"
                    maxLength="1000"
                    onChange={(event) => setCompletionNote(event.target.value)}
                    placeholder="Optional note for the manager"
                    rows="3"
                    value={completionNote}
                  />
                </section>
              ) : null}

              {selectedTask.completionNote ? (
                <section className="housekeeping-task-detail-section">
                  <h4>Completion note</h4>
                  <p>{selectedTask.completionNote}</p>
                </section>
              ) : null}

              <section className="housekeeping-task-detail-actions">
                <button
                  className="housekeeping-outline-btn"
                  type="button"
                  disabled={!isActionAllowed('accept', selectedTask.status) || selectedTaskHasActiveMaintenance || taskActionMutation.isPending}
                  title={selectedTaskHasActiveMaintenance ? 'Maintenance is still in progress for this room' : undefined}
                  onClick={() => onTaskAction('accept', selectedTask)}
                >
                  Accept Task
                </button>
                <button
                  className="housekeeping-outline-btn"
                  type="button"
                  disabled={selectedTaskIsBeforeStart || !isActionAllowed('start', selectedTask.status) || selectedTaskHasActiveMaintenance || taskActionMutation.isPending}
                  title={selectedTaskIsBeforeStart ? 'This work can only start at its scheduled time' : selectedTaskHasActiveMaintenance ? 'Maintenance is still in progress for this room' : undefined}
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
              </section>
              {selectedTaskHasActiveMaintenance ? (
                <p className="housekeeping-task-warning">
                  This room already has an active maintenance request, so cleaning cannot be accepted or started yet.
                </p>
              ) : null}
            </div>
          )}
        </aside>
      </section>

    </div>
  );
};

export default HousekeepingDailyTasksPage;
