import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import HousekeepingRoomInventoryPicker from '../components/HousekeepingRoomInventoryPicker.jsx';
import HousekeepingStatusBadge from '../components/HousekeepingStatusBadge.jsx';
import { useHousekeepingDashboard, useHousekeepingMaintenance, useHousekeepingTasks } from '../hooks/use-housekeeping.js';
import { housekeepingApi } from '../services/housekeeping-api.js';
import '../styles/housekeeping.css';

const normalizeStatus = (value) => String(value || '').toLowerCase().replace(/\s+/g, '');
const isInspectionReviewTask = (task) => String(task?.cleaningType || '').trim().toLowerCase() === 'inspection review';
const isManagerScheduleTask = (task) => (
  String(task?.taskOrigin || '').toLowerCase() === 'manager_schedule'
  || String(task?.cleaningType || '').trim().toLowerCase() === 'housekeeping schedule'
);
const isBeforeScheduledStart = (task) => {
  if (!isManagerScheduleTask(task) || !task?.workDate || !task?.startTime) return false;
  const [hours, minutes] = task.startTime.split(':').map(Number);
  const start = new Date(task.workDate);
  start.setHours(hours, minutes, 0, 0);
  return !Number.isNaN(start.getTime()) && new Date() < start;
};
const isCompletedTask = (task) => ['completed', 'cancelled', 'canceled'].includes(normalizeStatus(task?.status));
const TASKS_PER_PAGE = 6;

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

const toChecklistLabel = (key) => {
  const labels = {
    bed: 'Bed',
    bathroom: 'Bathroom',
    furniture: 'Furniture',
    amenities: 'Amenities',
    damage: 'Damage check',
    lostItem: 'Lost item check',
    room_inventory: 'Kiểm tra vật tư phòng',
    photo: 'Photo evidence',
  };
  return labels[key] || key;
};

const HousekeepingTasksPage = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useHousekeepingTasks();
  const dashboardQuery = useHousekeepingDashboard();
  const maintenanceQuery = useHousekeepingMaintenance();
  const roomInventoryCatalogQuery = useQuery({
    queryKey: ['housekeeping-room-inventory-catalog'],
    queryFn: () => housekeepingApi.getRoomInventoryItems({ is_active: 'true' }),
    retry: 1,
    staleTime: 60_000,
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [taskTab, setTaskTab] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [completionNote, setCompletionNote] = useState('');
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isIssueSubmitting, setIsIssueSubmitting] = useState(false);
  const [roomInventorySelection, setRoomInventorySelection] = useState([]);
  const [issueForm, setIssueForm] = useState({
    task_id: '',
    room_number: '',
    category: 'Equipment Failure',
    priority: 'high',
    description: '',
    image: '',
    note: '',
  });

  const taskActionMutation = useMutation({
    mutationFn: async ({ action, task }) => {
      if (!task?.id) return null;
      if (!isActionAllowed(action, task.status)) {
        throw new Error(`Cannot ${action} when task is in ${task.status} status.`);
      }
      if (action === 'accept') return housekeepingApi.acceptTask(task.id);
      if (action === 'start') return housekeepingApi.startTask(task.id);
      if (action === 'complete') return housekeepingApi.completeTask(task.id, {
        completion_note: isManagerScheduleTask(task) ? completionNote.trim() : '',
      });
      return null;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['housekeeping-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['housekeeping-maintenance'] }),
        queryClient.invalidateQueries({ queryKey: ['housekeeping-service-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['receptionist-operational-board'] }),
      ]);
    },
    onError: (error) => {
      window.alert(getMutationErrorMessage(error));
    },
  });

  const handoverMutation = useMutation({
    mutationFn: async ({ task, inspection, roomStatus }) => {
      const selectedRoomInventory = Array.isArray(inspection?.room_inventory)
        ? inspection.room_inventory
        : Array.isArray(inspection?.roomInventory)
          ? inspection.roomInventory
          : [];
      const selectedMissingItems = Array.isArray(inspection?.missing_items)
        ? inspection.missing_items
        : inspection?.missingItems || [];
      const selectedDamagedItems = Array.isArray(inspection?.damaged_items)
        ? inspection.damaged_items
        : inspection?.damagedItems || [];

      return housekeepingApi.createInspection({
        task_id: task.id,
        room_number: task.roomNumber,
        room: task.roomNumber,
        checklist: inspection?.checklist || {},
        damage: inspection?.damage || [],
        lostItem: inspection?.lostItem || [],
        room_inventory: selectedRoomInventory,
        photos: inspection?.photos || [],
        note: inspection?.note || `Room ${task.roomNumber} is ready for receptionist checkout review.`,
        remarks: inspection?.remarks || 'Ready for checkout',
        room_inventory_used: Boolean(inspection?.room_inventory_used ?? inspection?.roomInventoryUsed ?? selectedRoomInventory.length > 0),
        missing_items: selectedMissingItems,
        damaged_items: selectedDamagedItems,
        maintenance_required: Boolean(inspection?.maintenance_required ?? inspection?.maintenanceRequired ?? false),
        room_status_before: roomStatus || '',
        room_status_after: 'Dirty',
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['housekeeping-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['housekeeping-room-inspection'] }),
        queryClient.invalidateQueries({ queryKey: ['inspectionResults'] }),
        queryClient.invalidateQueries({ queryKey: ['checkoutSummary'] }),
        queryClient.invalidateQueries({ queryKey: ['receptionist-operational-board'] }),
      ]);
      toast.success('Inspection handed over to receptionist.');
    },
    onError: (error) => {
      window.alert(getMutationErrorMessage(error));
    },
  });

  const openIssueModal = (task) => {
    if (!task?.roomNumber) {
      toast.error('Room number is required to report maintenance.');
      return;
    }

    setIssueForm({
      task_id: task.id || '',
      room_number: task.roomNumber || '',
      category: 'Equipment Failure',
      priority: 'high',
      description: task.receptionistNote ? `Maintenance required for room ${task.roomNumber}: ${task.receptionistNote}` : `Maintenance required for room ${task.roomNumber}`,
      image: '',
      note: '',
    });
    setIsIssueModalOpen(true);
  };

  const closeIssueModal = () => {
    setIsIssueModalOpen(false);
    setIsIssueSubmitting(false);
    setIssueForm({
      task_id: '',
      room_number: '',
      category: 'Equipment Failure',
      priority: 'high',
      description: '',
      image: '',
      note: '',
    });
    taskActionMutation.reset();
  };

  const submitIssueReport = async () => {
    if (isIssueSubmitting) return;

    const roomNumber = issueForm.room_number.trim();
    const category = issueForm.category.trim();
    const description = issueForm.description.trim();

    if (!roomNumber) {
      toast.error('Room number is required.');
      return;
    }

    if (!category) {
      toast.error('Category is required.');
      return;
    }

    if (!description) {
      toast.error('Description is required.');
      return;
    }

    try {
      setIsIssueSubmitting(true);
      const result = await housekeepingApi.reportIssue({
        task_id: issueForm.task_id,
        room_number: roomNumber,
        category,
        priority: issueForm.priority,
        description,
        image: issueForm.image.trim(),
        note: issueForm.note.trim(),
        reportedBy: 'Housekeeping',
      });

      toast.success(result?.duplicate ? 'Maintenance report already exists.' : 'Maintenance report created successfully.');
      closeIssueModal();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['housekeeping-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['housekeeping-maintenance'] }),
        queryClient.invalidateQueries({ queryKey: ['receptionist-operational-board'] }),
      ]);
    } catch (error) {
      toast.error(getMutationErrorMessage(error));
    } finally {
      setIsIssueSubmitting(false);
    }
  };

  const baseTasks = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return (data || []).filter((task) => {
      const matchKeyword = !keyword || [task.roomNumber, task.cleaningType, task.receptionistNote, task.assignedBy]
        .some((item) => String(item || '').toLowerCase().includes(keyword));
      const matchFilter = filter === 'all' || normalizeStatus(task.status) === filter;
      const matchPriority = priorityFilter === 'all' || String(task.priority || '').toLowerCase() === priorityFilter;
      return matchKeyword && matchFilter && matchPriority;
    });
  }, [data, search, filter, priorityFilter]);

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

  const roomInventoryItems = useMemo(() => {
    const payload = roomInventoryCatalogQuery.data;
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    return rows
      .map((entry) => ({
        _id: entry?._id || entry?.id || null,
        name: entry?.name || entry?.item_name || 'Room inventory item',
        category: entry?.category || '-',
        price: Number(entry?.price ?? entry?.unit_price ?? 0),
        availableQty: Number(entry?.quantity ?? entry?.stock_quantity ?? 0),
      }))
      .filter((entry) => entry._id);
  }, [roomInventoryCatalogQuery.data]);

  const selectedRoom = selectedTask ? roomsByNumber[selectedTask.roomNumber] || null : null;
  const selectedTaskHasActiveMaintenance = hasActiveMaintenanceRequest(maintenanceQuery.data, selectedTask?.roomNumber);
  const selectedTaskIsInspectionReview = isInspectionReviewTask(selectedTask);
  const selectedTaskIsManagerSchedule = isManagerScheduleTask(selectedTask);
  const selectedTaskIsBeforeStart = isBeforeScheduledStart(selectedTask);
  const selectedRoomInventoryItems = useMemo(() => {
    if (!selectedTaskIsInspectionReview) return roomInventoryItems;
    return roomInventoryItems.filter((entry) => entry.availableQty > 0);
  }, [roomInventoryItems, selectedTaskIsInspectionReview]);

  const inspectionQuery = useQuery({
    queryKey: ['housekeeping-room-inspection', selectedTask?.roomNumber],
    queryFn: () => housekeepingApi.getInspectionByRoom(selectedTask.roomNumber),
    enabled: Boolean(selectedTask?.roomNumber) && !selectedTaskIsManagerSchedule,
    retry: 1,
    staleTime: 5_000,
  });

  const checklistEntries = useMemo(() => {
    const checklist = inspectionQuery.data?.checklist || {};
    return Object.entries(checklist);
  }, [inspectionQuery.data?.checklist]);

  const checklistDone = checklistEntries.filter(([, done]) => Boolean(done)).length;
  const checklistProgress = checklistEntries.length ? Math.round((checklistDone / checklistEntries.length) * 100) : 0;

  useEffect(() => {
    if (!selectedTaskIsInspectionReview) {
      setRoomInventorySelection([]);
      return;
    }

    const existingSelection = Array.isArray(inspectionQuery.data?.room_inventory)
      ? inspectionQuery.data.room_inventory
      : [];

    if (!existingSelection.length) return;

    const nextSelection = existingSelection
      .map((entry) => {
        const entryId = String(entry.item_id || entry.itemId || '').trim();
        const entryName = String(entry.item || entry.name || '').trim().toLowerCase();
        const matchedItem = selectedRoomInventoryItems.find((item) => String(item._id) === entryId)
          || selectedRoomInventoryItems.find((item) => String(item.name || '').trim().toLowerCase() === entryName)
          || null;

        return {
          item_id: matchedItem?._id || entry.item_id || entry.itemId || null,
          item: matchedItem?.name || entry.item || entry.name || 'Room inventory item',
          qty: Math.min(Number(matchedItem?.availableQty ?? entry.qty ?? entry.quantity ?? 1), Number(entry.qty || entry.quantity || 1)),
          price: Number(matchedItem?.price ?? entry.price ?? 0),
        };
      })
      .filter((entry) => entry.item_id && Number(entry.qty || 0) > 0);

    setRoomInventorySelection(nextSelection);
  }, [inspectionQuery.data?.room_inventory, selectedRoomInventoryItems, selectedTaskIsInspectionReview]);

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
    if (action === 'issue') {
      openIssueModal(task);
      return;
    }

    await taskActionMutation.mutateAsync({ action, task });
    await refetch();
  };

  const onReadyForCheckout = async () => {
    if (!selectedTask) return;
    await handoverMutation.mutateAsync({
      task: selectedTask,
      inspection: {
        ...inspectionQuery.data,
        room_inventory: roomInventorySelection,
        room_inventory_used: roomInventorySelection.length > 0,
      },
      roomStatus: selectedRoom?.status || '',
    });
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
          <p>Rooms assigned by the receptionist or manager with real-time housekeeping progress.</p>
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

          <div className="housekeeping-task-tabs" role="tablist" aria-label="Housekeeping task groups">
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

          <div className="housekeeping-task-summary-grid">
            {summary.map((item) => (
              <article key={item.label} className="housekeeping-task-summary-card">
                <p>{item.label}</p>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>

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
                  <span>{task.cleaningType || 'Checkout Cleaning'}</span>
                  {!isManagerScheduleTask(task) ? <HousekeepingStatusBadge value={task.priority} variant="priority" /> : null}
                </div>
                <p>{task.description || task.receptionistNote || 'No task note provided.'}</p>
                <small>
                  {isManagerScheduleTask(task)
                    ? `Schedule: ${formatDateTime(task.workDate || task.dueTime).split(' ')[0]} | ${task.startTime} - ${task.endTime}`
                    : `Checkout: ${formatDateTime(task.checkoutTime)} | Due: ${formatDateTime(task.dueTime)}`}
                </small>
              </button>
            ))}
            {!paginatedTasks.length ? (
              <div className="housekeeping-state-card">
                <h3>No matching tasks</h3>
                <p>All filters are based on MongoDB task records.</p>
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
                <h4>{selectedTaskIsManagerSchedule ? 'Work schedule' : 'Task information'}</h4>
                <div className="housekeeping-task-kv-grid">
                  <span>Task type</span><b>{selectedTask.cleaningType || 'Checkout Cleaning'}</b>
                  <span>Assigned by</span><b>{selectedTask.assignedBy || '-'}</b>
                  {selectedTaskIsManagerSchedule ? (
                    <>
                      <span>Work date</span><b>{formatDateTime(selectedTask.workDate || selectedTask.dueTime).split(' ')[0]}</b>
                      <span>Working time</span><b>{selectedTask.startTime} - {selectedTask.endTime}</b>
                    </>
                  ) : (
                    <>
                      <span>Priority</span><b>{selectedTask.priority || '-'}</b>
                      <span>Checkout time</span><b>{formatDateTime(selectedTask.checkoutTime)}</b>
                      <span>Due time</span><b>{formatDateTime(selectedTask.dueTime)}</b>
                    </>
                  )}
                </div>
              </section>

              <section className="housekeeping-task-detail-section">
                <h4>{selectedTaskIsManagerSchedule ? 'Work notes' : 'Receptionist notes'}</h4>
                <p>{selectedTask.description || selectedTask.receptionistNote || 'No note provided.'}</p>
                {selectedTask.guestRequest ? (
                  <p><strong>Guest request:</strong> {selectedTask.guestRequest}</p>
                ) : null}
              </section>

              <section className="housekeeping-task-detail-section">
                <h4>Assigned staff</h4>
                <p>{selectedTask.assignedTo || 'Housekeeping Team'}</p>
              </section>

              {selectedTaskIsManagerSchedule && normalizeStatus(selectedTask.status) === 'cleaning' ? (
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

              {selectedTaskIsManagerSchedule && selectedTask.completionNote ? (
                <section className="housekeeping-task-detail-section">
                  <h4>Completion note</h4>
                  <p>{selectedTask.completionNote}</p>
                </section>
              ) : null}

              {!selectedTaskIsManagerSchedule ? <><section className="housekeeping-task-detail-section">
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
              </section></> : null}

              {selectedTaskIsInspectionReview ? (
                <HousekeepingRoomInventoryPicker
                  items={selectedRoomInventoryItems}
                  value={roomInventorySelection}
                  onChange={setRoomInventorySelection}
                  disabled={handoverMutation.isPending || roomInventoryCatalogQuery.isLoading}
                  isLoading={roomInventoryCatalogQuery.isLoading || roomInventoryCatalogQuery.isFetching}
                  loadError={roomInventoryCatalogQuery.isError ? getMutationErrorMessage(roomInventoryCatalogQuery.error) : ''}
                  onRetry={() => roomInventoryCatalogQuery.refetch()}
                />
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
                {selectedTaskIsInspectionReview ? (
                  <button
                    className="housekeeping-btn"
                    type="button"
                    disabled={normalizeStatus(selectedTask.status) !== 'accepted' || handoverMutation.isPending}
                    onClick={onReadyForCheckout}
                  >
                    {handoverMutation.isPending ? 'Completing...' : 'Complete Cleaning'}
                  </button>
                ) : null}
                {!selectedTaskIsInspectionReview ? (
                  <>
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
                  </>
                ) : null}
                <button
                  className="housekeeping-outline-btn"
                  type="button"
                  disabled={!isActionAllowed('issue', selectedTask.status) || taskActionMutation.isPending}
                  onClick={() => onTaskAction('issue', selectedTask)}
                >
                  Report Maintenance
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

      {isIssueModalOpen ? (
        <div className="housekeeping-modal-backdrop" role="presentation" onClick={closeIssueModal}>
          <div className="housekeeping-modal-card housekeeping-issue-modal" role="dialog" aria-modal="true" aria-labelledby="maintenance-report-title" onClick={(event) => event.stopPropagation()}>
            <h3 id="maintenance-report-title">Report Maintenance</h3>
            <p>Submit a maintenance request for the selected room.</p>

            <div className="housekeeping-issue-modal-grid">
              <label>
                <span>Room Number *</span>
                <input
                  className="housekeeping-maintenance-input"
                  value={issueForm.room_number}
                  onChange={(event) => setIssueForm((prev) => ({ ...prev, room_number: event.target.value }))}
                  placeholder="e.g. 305"
                />
              </label>

              <label>
                <span>Category *</span>
                <input
                  className="housekeeping-maintenance-input"
                  value={issueForm.category}
                  onChange={(event) => setIssueForm((prev) => ({ ...prev, category: event.target.value }))}
                  placeholder="Equipment Failure"
                />
              </label>

              <label>
                <span>Priority *</span>
                <select
                  value={issueForm.priority}
                  onChange={(event) => setIssueForm((prev) => ({ ...prev, priority: event.target.value }))}
                >
                  <option value="urgent">urgent</option>
                  <option value="high">high</option>
                  <option value="medium">medium</option>
                  <option value="low">low</option>
                </select>
              </label>

              <label className="housekeeping-issue-modal-wide">
                <span>Description *</span>
                <textarea
                  className="housekeeping-maintenance-textarea"
                  value={issueForm.description}
                  onChange={(event) => setIssueForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Describe the maintenance issue"
                />
              </label>

              <label className="housekeeping-issue-modal-wide">
                <span>Photo URL</span>
                <input
                  className="housekeeping-maintenance-input"
                  value={issueForm.image}
                  onChange={(event) => setIssueForm((prev) => ({ ...prev, image: event.target.value }))}
                  placeholder="Optional photo URL"
                />
              </label>

              <label className="housekeeping-issue-modal-wide">
                <span>Notes</span>
                <textarea
                  className="housekeeping-maintenance-textarea"
                  value={issueForm.note}
                  onChange={(event) => setIssueForm((prev) => ({ ...prev, note: event.target.value }))}
                  placeholder="Optional notes"
                />
              </label>
            </div>

            <div className="housekeeping-modal-actions">
              <button className="housekeeping-outline-btn" type="button" onClick={closeIssueModal} disabled={isIssueSubmitting}>
                Cancel
              </button>
              <button className="housekeeping-btn" type="button" onClick={submitIssueReport} disabled={isIssueSubmitting}>
                {isIssueSubmitting ? 'Saving...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default HousekeepingTasksPage;
