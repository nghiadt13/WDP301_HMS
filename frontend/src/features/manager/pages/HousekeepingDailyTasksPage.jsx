import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Kanban,
  List,
  RefreshCw,
  Search,
  User,
  X,
} from 'lucide-react';
import HousekeepingStatusBadge from '../components/HousekeepingStatusBadge.jsx';
import { useHousekeepingDashboard, useHousekeepingMaintenance } from '../hooks/use-housekeeping.js';
import { housekeepingApi } from '../services/housekeeping-api.js';
import '../styles/housekeeping.css';
import './manager-operations.css';

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
  return 'Thao tác thất bại. Vui lòng thử lại.';
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

// Date helpers for Weekly Schedule Board
const pad = (value) => String(value).padStart(2, '0');
const toInputDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const toDate = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const getWeekStart = (date) => {
  const target = toDate(date);
  const day = target.getDay() || 7;
  return addDays(target, 1 - day);
};

const formatWeekday = (date) => new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(date);
const formatShortDate = (date) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date);
const formatWeekRange = (startDate) => `${formatShortDate(startDate)} - ${formatShortDate(addDays(startDate, 6))}`;

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
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [isModalOpen, setIsModalOpen] = useState(false);

  const taskActionMutation = useMutation({
    mutationFn: async ({ action, task }) => {
      if (!task?.id) return null;
      if (!isActionAllowed(action, task.status)) {
        throw new Error(`Không thể thực hiện ${action} khi task ở trạng thái ${task.status}.`);
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

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const todayKey = toInputDate(new Date());

  const tasksByDate = useMemo(() => {
    const map = {};
    (tasks || []).forEach((task) => {
      const dateVal = task.workDate || task.dueTime || task.createdAt;
      const key = dateVal ? toInputDate(toDate(dateVal)) : todayKey;
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });
    return map;
  }, [tasks, todayKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [taskTab]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!paginatedTasks.length && !tasks.length) {
      setSelectedTaskId('');
      return;
    }
    const targetList = viewMode === 'board' ? tasks : paginatedTasks;
    const exists = targetList.some((task) => task.id === selectedTaskId);
    if (!exists && targetList.length > 0) {
      setSelectedTaskId(targetList[0].id);
    }
  }, [paginatedTasks, tasks, selectedTaskId, viewMode]);

  useEffect(() => {
    setCompletionNote('');
  }, [selectedTaskId]);

  const selectedTask = useMemo(
    () => (tasksQuery.data || []).find((task) => task.id === selectedTaskId) || null,
    [tasksQuery.data, selectedTaskId]
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
      { label: 'Tổng ca phân công', value: all.length },
      { label: 'Mới lên lịch', value: assigned },
      { label: 'Đang dọn dẹp', value: cleaning },
      { label: 'Chờ bảo trì', value: waitingMaintenance },
      { label: 'Đã hoàn thành', value: completed },
    ];
  }, [tasksQuery.data]);

  const onTaskAction = async (action, task) => {
    await taskActionMutation.mutateAsync({ action, task });
    await tasksQuery.refetch();
  };

  const handleOpenTaskModal = (task) => {
    setSelectedTaskId(task.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  if (tasksQuery.isLoading) {
    return (
      <div className="housekeeping-page">
        <div className="housekeeping-state-card">
          <h3>Đang tải lịch làm việc hàng ngày...</h3>
          <p>Đang đồng bộ dữ liệu ca làm việc từ hệ thống.</p>
        </div>
      </div>
    );
  }

  if (tasksQuery.isError) {
    return (
      <div className="housekeeping-page">
        <div className="housekeeping-state-card">
          <h3>Không thể tải danh sách ca làm việc</h3>
          <p>Yêu cầu API gặp sự cố. Vui lòng kiểm tra lại dịch vụ backend.</p>
          <button className="housekeeping-btn" type="button" onClick={() => tasksQuery.refetch()}>Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="housekeeping-page staff-task-page manager-ops-page">
      <div className="housekeeping-page-header">
        <div>
          <h2>Lịch Làm Việc Hàng Ngày (Daily Tasks)</h2>
          <p>Bảng lịch phân công ca dọn phòng real-time cho nhân viên Housekeeping.</p>
        </div>
        <div className="staff-week-controls">
          <button
            className={`manager-ops-secondary${viewMode === 'board' ? ' is-active' : ''}`}
            type="button"
            onClick={() => setViewMode('board')}
          >
            <Kanban size={15} /> Dạng bảng lịch
          </button>
          <button
            className={`manager-ops-secondary${viewMode === 'list' ? ' is-active' : ''}`}
            type="button"
            onClick={() => setViewMode('list')}
          >
            <List size={15} /> Dạng danh sách
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="housekeeping-card">
        <div className="housekeeping-filter-bar" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
            <label className="housekeeping-search-field">
              <Search size={14} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm số phòng, loại ca, ghi chú..."
              />
            </label>
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="assigned">Đã phân công (Assigned)</option>
              <option value="accepted">Đã nhận ca (Accepted)</option>
              <option value="cleaning">Đang dọn dẹp (Cleaning)</option>
              <option value="waitingmaintenance">Chờ bảo trì (Waiting Maintenance)</option>
              <option value="completed">Hoàn thành (Completed)</option>
            </select>
          </div>

          <div className="staff-week-controls">
            <button className="manager-ops-secondary" type="button" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              <ChevronLeft size={15} /> Tuần trước
            </button>
            <button className="manager-ops-secondary" type="button" onClick={() => setWeekStart(getWeekStart(new Date()))}>
              <CalendarDays size={15} /> Tuần này ({formatWeekRange(weekStart)})
            </button>
            <button className="manager-ops-secondary" type="button" onClick={() => setWeekStart(addDays(weekStart, 7))}>
              Tuần sau <ChevronRight size={15} />
            </button>
            <button className="housekeeping-outline-btn" type="button" onClick={() => tasksQuery.refetch()}>
              <RefreshCw size={14} /> Làm mới
            </button>
          </div>
        </div>

        <div className="housekeeping-task-tabs" role="tablist" aria-label="Phân nhóm ca dọn phòng">
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
            Đã hoàn thành
            <span>{taskTabCounts.completed}</span>
          </button>
          <button
            type="button"
            className={`housekeeping-task-tab${taskTab === 'all' ? ' is-active' : ''}`}
            onClick={() => setTaskTab('all')}
          >
            Tất cả ca
            <span>{taskTabCounts.all}</span>
          </button>
        </div>
      </div>

      {/* Summary grid */}
      <div className="housekeeping-task-summary-grid">
        {summary.map((item) => (
          <article key={item.label} className="housekeeping-task-summary-card">
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>

      {/* WEEKLY SCHEDULE BOARD VIEW */}
      {viewMode === 'board' ? (
        <section className="figma-card staff-schedule-card">
          <div className="staff-week-grid">
            {weekDays.map((day) => {
              const key = toInputDate(day);
              const dayTasks = tasksByDate[key] || [];
              const isToday = key === todayKey;

              return (
                <article className={`staff-day-column${isToday ? ' is-today' : ''}`} key={key}>
                  <header className="staff-day-header">
                    <div>
                      <strong>{formatWeekday(day)}</strong>
                      <span>{formatShortDate(day)}</span>
                    </div>
                    {isToday && (
                      <span
                        style={{
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '6px',
                        }}
                      >
                        Hôm nay
                      </span>
                    )}
                  </header>

                  <div className="staff-day-task-list">
                    {dayTasks.map((task) => {
                      const note = task.description || task.receptionistNote || '';
                      return (
                        <button
                          className={`staff-schedule-item ${getStageClass(task.status)}${selectedTaskId === task.id ? ' is-selected' : ''}`}
                          key={task.id}
                          type="button"
                          onClick={() => handleOpenTaskModal(task)}
                        >
                          <div className="staff-schedule-item-head">
                            <strong>Phòng {task.roomNumber}</strong>
                            <HousekeepingStatusBadge value={task.status} />
                          </div>
                          <div className="staff-schedule-meta">
                            <span className="staff-schedule-time">
                              <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                              {task.startTime && task.endTime ? `${task.startTime} - ${task.endTime}` : 'Trong ngày'}
                            </span>
                            <span>{task.cleaningType || 'Dọn phòng hàng ngày'}</span>
                            {task.assignedBy ? (
                              <span>
                                <User size={11} style={{ display: 'inline', marginRight: '3px' }} />
                                Giao bởi: {task.assignedBy}
                              </span>
                            ) : null}
                          </div>
                          {note ? <p className="line-clamp-2">{note}</p> : <p className="is-muted">Không có ghi chú.</p>}
                        </button>
                      );
                    })}

                    {!dayTasks.length ? (
                      <div className="staff-day-empty">Không có ca làm việc</div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        /* STANDARD LIST & DETAIL VIEW */
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
                    <strong>Phòng {task.roomNumber}</strong>
                    <HousekeepingStatusBadge value={task.status} />
                  </div>
                  <div className="housekeeping-task-list-item-meta">
                    <span>{task.cleaningType || 'Ca dọn phòng'}</span>
                  </div>
                  <p>{task.description || task.receptionistNote || 'Chưa có ghi chú.'}</p>
                  <small>
                    Ngày: {formatDateTime(task.workDate || task.dueTime).split(' ')[0]} | {task.startTime || '--:--'} - {task.endTime || '--:--'}
                  </small>
                </button>
              ))}
              {!paginatedTasks.length ? (
                <div className="housekeeping-state-card">
                  <h3>Không có ca dọn phòng phù hợp</h3>
                  <p>Các dữ liệu tìm kiếm dựa trên danh sách ca được Manager phân công.</p>
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
                  Trước
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
                  Sau
                </button>
              </div>
            ) : null}
          </div>

          <aside className={`housekeeping-task-detail-pane housekeeping-card ${getStageClass(selectedTask?.status)}`}>
            {!selectedTask ? (
              <div className="housekeeping-state-card">
                <h3>Chưa chọn ca dọn phòng</h3>
                <p>Vui lòng chọn ca từ danh sách bên trái để xem chi tiết.</p>
              </div>
            ) : (
              <div className="housekeeping-task-detail-content">
                <header className="housekeeping-card-header housekeeping-task-stage-header">
                  <h3>Phòng {selectedTask.roomNumber}</h3>
                  <HousekeepingStatusBadge value={selectedTask.status} />
                </header>

                <section className="housekeeping-task-detail-section">
                  <h4>Thông tin phòng</h4>
                  <div className="housekeeping-task-kv-grid">
                    <span>Loại phòng</span><b>{selectedRoom?.roomType || '-'}</b>
                    <span>Tầng</span><b>{selectedRoom?.floor || '-'}</b>
                    <span>Tòa nhà</span><b>{selectedRoom?.building || '-'}</b>
                    <span>Trạng thái phòng</span><b>{selectedRoom?.status || '-'}</b>
                  </div>
                </section>

                <section className="housekeeping-task-detail-section">
                  <h4>Thông tin lịch làm việc</h4>
                  <div className="housekeeping-task-kv-grid">
                    <span>Loại ca</span><b>{selectedTask.cleaningType || 'Dọn phòng hàng ngày'}</b>
                    <span>Người phân công</span><b>{selectedTask.assignedBy || '-'}</b>
                    <span>Ngày làm việc</span><b>{formatDateTime(selectedTask.workDate || selectedTask.dueTime).split(' ')[0]}</b>
                    <span>Khung giờ</span><b>{selectedTask.startTime || '--:--'} - {selectedTask.endTime || '--:--'}</b>
                  </div>
                </section>

                <section className="housekeeping-task-detail-section">
                  <h4>Ghi chú</h4>
                  <p>{selectedTask.description || selectedTask.receptionistNote || 'Chưa có ghi chú.'}</p>
                  {selectedTask.guestRequest ? (
                    <p><strong>Yêu cầu khách hàng:</strong> {selectedTask.guestRequest}</p>
                  ) : null}
                </section>

                <section className="housekeeping-task-detail-section">
                  <h4>Nhân viên thực hiện</h4>
                  <p>{selectedTask.assignedTo || 'Đội Housekeeping'}</p>
                </section>

                {normalizeStatus(selectedTask.status) === 'cleaning' ? (
                  <section className="housekeeping-task-detail-section">
                    <h4>Ghi chú hoàn thành ca</h4>
                    <textarea
                      className="housekeeping-maintenance-textarea"
                      maxLength="1000"
                      onChange={(event) => setCompletionNote(event.target.value)}
                      placeholder="Ghi chú phản hồi cho Quản lý (không bắt buộc)"
                      rows="3"
                      value={completionNote}
                    />
                  </section>
                ) : null}

                {selectedTask.completionNote ? (
                  <section className="housekeeping-task-detail-section">
                    <h4>Ghi chú đã hoàn thành</h4>
                    <p>{selectedTask.completionNote}</p>
                  </section>
                ) : null}

                <section className="housekeeping-task-detail-actions">
                  <button
                    className="housekeeping-outline-btn"
                    type="button"
                    disabled={!isActionAllowed('accept', selectedTask.status) || selectedTaskHasActiveMaintenance || taskActionMutation.isPending}
                    title={selectedTaskHasActiveMaintenance ? 'Phòng này đang có yêu cầu bảo trì' : undefined}
                    onClick={() => onTaskAction('accept', selectedTask)}
                  >
                    Nhận ca (Accept)
                  </button>
                  <button
                    className="housekeeping-outline-btn"
                    type="button"
                    disabled={selectedTaskIsBeforeStart || !isActionAllowed('start', selectedTask.status) || selectedTaskHasActiveMaintenance || taskActionMutation.isPending}
                    title={selectedTaskIsBeforeStart ? 'Chỉ có thể bắt đầu khi tới khung giờ đã đặt' : selectedTaskHasActiveMaintenance ? 'Phòng này đang có yêu cầu bảo trì' : undefined}
                    onClick={() => onTaskAction('start', selectedTask)}
                  >
                    Bắt đầu dọn (Start)
                  </button>
                  <button
                    className="housekeeping-btn"
                    type="button"
                    disabled={!isActionAllowed('complete', selectedTask.status) || taskActionMutation.isPending}
                    onClick={() => onTaskAction('complete', selectedTask)}
                  >
                    Hoàn thành ca (Complete)
                  </button>
                </section>
                {selectedTaskHasActiveMaintenance ? (
                  <p className="housekeeping-task-warning">
                    Phòng này hiện đang có sự cố bảo trì chưa xong, vui lòng chờ xử lý trước khi dọn.
                  </p>
                ) : null}
              </div>
            )}
          </aside>
        </section>
      )}

      {/* TASK ACTION & DETAIL MODAL (FOR BOARD VIEW) */}
      {isModalOpen && selectedTask && (
        <div className="manager-modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <section
            className="manager-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-detail-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
            style={{ maxWidth: '560px' }}
          >
            <div className="manager-modal-heading">
              <div>
                <span className="figma-eyebrow">Chi tiết ca làm việc</span>
                <h2 id="task-detail-modal-title">Phòng {selectedTask.roomNumber}</h2>
                <p>{selectedTask.cleaningType || 'Dọn phòng hàng ngày'}</p>
              </div>
              <button className="icon-action-button" type="button" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <div className="housekeeping-task-detail-content" style={{ padding: '0 4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Trạng thái hiện tại:</span>
                <HousekeepingStatusBadge value={selectedTask.status} />
              </div>

              <section className="housekeeping-task-detail-section">
                <h4>Khung giờ & Phân công</h4>
                <div className="housekeeping-task-kv-grid">
                  <span>Ngày dọn</span><b>{formatDateTime(selectedTask.workDate || selectedTask.dueTime).split(' ')[0]}</b>
                  <span>Khung giờ</span><b>{selectedTask.startTime || '--:--'} - {selectedTask.endTime || '--:--'}</b>
                  <span>Người giao</span><b>{selectedTask.assignedBy || '-'}</b>
                  <span>Phòng</span><b>{selectedTask.roomNumber} ({selectedRoom?.roomType || '-'})</b>
                </div>
              </section>

              <section className="housekeeping-task-detail-section">
                <h4>Ghi chú phân công</h4>
                <p>{selectedTask.description || selectedTask.receptionistNote || 'Chưa có ghi chú.'}</p>
              </section>

              {normalizeStatus(selectedTask.status) === 'cleaning' ? (
                <section className="housekeeping-task-detail-section">
                  <h4>Ghi chú hoàn thành ca</h4>
                  <textarea
                    className="housekeeping-maintenance-textarea"
                    maxLength="1000"
                    onChange={(event) => setCompletionNote(event.target.value)}
                    placeholder="Ghi chú phản hồi cho Quản lý (không bắt buộc)"
                    rows="3"
                    value={completionNote}
                  />
                </section>
              ) : null}

              {selectedTask.completionNote ? (
                <section className="housekeeping-task-detail-section">
                  <h4>Ghi chú khi hoàn thành</h4>
                  <p>{selectedTask.completionNote}</p>
                </section>
              ) : null}

              {selectedTaskHasActiveMaintenance && (
                <p className="housekeeping-task-warning" style={{ marginBottom: '12px' }}>
                  Phòng này đang có yêu cầu bảo trì đang mở. Vui lòng đợi bảo trì hoàn tất trước khi tiến hành dọn phòng.
                </p>
              )}

              <div className="housekeeping-task-detail-actions" style={{ marginTop: '16px' }}>
                <button
                  className="housekeeping-outline-btn"
                  type="button"
                  disabled={!isActionAllowed('accept', selectedTask.status) || selectedTaskHasActiveMaintenance || taskActionMutation.isPending}
                  onClick={async () => {
                    await onTaskAction('accept', selectedTask);
                    closeModal();
                  }}
                >
                  Nhận ca (Accept)
                </button>

                <button
                  className="housekeeping-outline-btn"
                  type="button"
                  disabled={selectedTaskIsBeforeStart || !isActionAllowed('start', selectedTask.status) || selectedTaskHasActiveMaintenance || taskActionMutation.isPending}
                  onClick={async () => {
                    await onTaskAction('start', selectedTask);
                    closeModal();
                  }}
                >
                  Bắt đầu dọn (Start)
                </button>

                <button
                  className="housekeeping-btn"
                  type="button"
                  disabled={!isActionAllowed('complete', selectedTask.status) || taskActionMutation.isPending}
                  onClick={async () => {
                    await onTaskAction('complete', selectedTask);
                    closeModal();
                  }}
                >
                  Hoàn thành ca (Complete)
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default HousekeepingDailyTasksPage;
