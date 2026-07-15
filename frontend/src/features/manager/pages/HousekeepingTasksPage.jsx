import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Search } from 'lucide-react';
import HousekeepingTaskTable from '../components/HousekeepingTaskTable.jsx';
import { useHousekeepingTasks } from '../hooks/use-housekeeping.js';
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

const HousekeepingTasksPage = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useHousekeepingTasks();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

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
      return matchKeyword && matchFilter;
    });
  }, [data, search, filter]);

  const onTaskAction = async (action, task) => {
    if (action === 'view') {
      window.alert([
        `Room: ${task.roomNumber}`,
        `Status: ${task.status}`,
        `Cleaning Type: ${task.cleaningType}`,
        `Priority: ${task.priority}`,
        `Receptionist Note: ${task.receptionistNote || 'None'}`,
      ].join('\n'));
      return;
    }

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
          <p>Only receptionist-driven cleaning operations for housekeeping staff.</p>
        </div>
        <div className="housekeeping-task-actions">
          <button className="housekeeping-outline-btn" type="button" onClick={() => refetch()}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      <div className="housekeeping-card">
        <div className="housekeeping-filter-bar">
          <label className="housekeeping-filter-bar">
            <Search size={14} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search room, cleaning type, note"
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
        </div>

        {tasks.length ? (
          <HousekeepingTaskTable tasks={tasks} onAction={onTaskAction} />
        ) : (
          <div className="housekeeping-state-card">
            <h3>No matching tasks</h3>
            <p>All filters are based on MongoDB task records.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HousekeepingTasksPage;
