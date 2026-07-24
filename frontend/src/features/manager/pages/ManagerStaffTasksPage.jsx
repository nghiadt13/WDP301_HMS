import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Plus, Search, Users, X } from 'lucide-react';
import { managerApi } from '../services/manager-api.js';
import './manager-operations.css';

const emptyForm = {
  title: '',
  description: '',
  staff_type: 'housekeeping',
  assigned_staff_id: '',
  assigned_to: '',
  room_number: '',
  room_type: '',
  status: 'assigned',
  deadline: '',
  start_time: '08:00',
  end_time: '09:00',
};

const staffTypes = { housekeeping: 'Nhân viên dọn phòng' };
const statuses = {
  assigned: 'Đã lên lịch',
  completed: 'Hoàn thành',
};

const pad = (value) => String(value).padStart(2, '0');
const toInputDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const todayInput = () => toInputDate(new Date());
const toInputTime = (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
const toMinutes = (value) => {
  const [hours, minutes] = String(value || '').split(':').map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
};
const hasStaffBreakConflict = (firstStart, firstEnd, secondStart, secondEnd) => (
  firstStart < secondEnd + 15 && firstEnd + 15 > secondStart
);
const timeOptions = [
  ...Array.from({ length: 24 * 4 }, (_, index) => toInputTime(index * 15)),
  '23:59',
];
const getInitialTimes = (dateValue) => {
  if (dateValue !== todayInput()) return { start_time: '08:00', end_time: '09:00' };
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = Math.ceil((currentMinutes + 1) / 15) * 15;
  if (startMinutes > 23 * 60 + 44) return null;
  const endMinutes = Math.min(startMinutes + 60, 23 * 60 + 59);
  return { start_time: toInputTime(startMinutes), end_time: toInputTime(endMinutes) };
};
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
const formatDate = (value) => (value ? new Intl.DateTimeFormat('vi-VN').format(new Date(value)) : 'Chưa có ngày');
const formatWeekday = (date) => new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(date);
const formatShortDate = (date) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date);
const formatWeekRange = (startDate) => `${formatDate(startDate)} - ${formatDate(addDays(startDate, 6))}`;
const getErrorMessage = (error) => error?.response?.data?.message || error.message || 'Đã có lỗi xảy ra';
const normalizeStatus = (status) => String(status || '').toLowerCase().replace(/\s+/g, '');
const getScheduleStatus = (status) => (normalizeStatus(status) === 'completed' ? 'completed' : 'assigned');
const toForm = (task) => ({
  title: task.title || '',
  description: task.description || '',
  staff_type: task.staff_type || 'housekeeping',
  assigned_staff_id: task.assigned_staff_id || '',
  assigned_to: task.assigned_to || '',
  room_number: task.room_number || '',
  room_type: task.room_type || '',
  status: normalizeStatus(task.status || 'assigned'),
  deadline: task.work_date || task.deadline ? toInputDate(toDate(task.work_date || task.deadline)) : '',
  start_time: task.start_time || '08:00',
  end_time: task.end_time || '09:00',
});
const statusTone = (status) => {
  if (['completed'].includes(status)) return 'is-good';
  return 'is-info';
};

const ManagerStaffTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState('');
  const [mode, setMode] = useState('idle');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const currentWeekKeyRef = useRef(toInputDate(getWeekStart(new Date())));

  const selectedTask = tasks.find((task) => task._id === selectedId);
  const isEditing = mode === 'edit' && selectedTask;
  const isCreating = mode === 'create';
  const isModalOpen = isCreating || isEditing;
  const canEditSelected = isCreating || ['assigned', 'notstarted'].includes(normalizeStatus(selectedTask?.status));
  const assignableStaff = staffMembers.filter((member) => member.role === 'housekeeping');
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const weekStartKey = toInputDate(weekStart);
  const weekEndKey = toInputDate(addDays(weekStart, 6));
  const todayKey = todayInput();
  const defaultCreateDate = weekStartKey < todayKey ? todayKey : weekStartKey;

  const loadTasks = async (nextId = selectedId) => {
    const data = await managerApi.getStaffTasks();
    setTasks(data);
    if (nextId) {
      const nextTask = data.find((task) => task._id === nextId);
      if (nextTask) {
        setSelectedId(nextTask._id);
        setForm(toForm(nextTask));
        setMode('edit');
      }
    }
  };

  useEffect(() => {
    Promise.all([
      managerApi.getStaffMembers().then(setStaffMembers),
      managerApi.getRooms({ limit: 200 }).then((result) => setRooms(result.data || result || [])),
      loadTasks('')
    ]).catch((error) => setMessage(getErrorMessage(error)));
  }, []);

  useEffect(() => {
    const syncCurrentWeek = () => {
      const currentWeekStart = getWeekStart(new Date());
      const currentWeekKey = toInputDate(currentWeekStart);
      if (currentWeekKey !== currentWeekKeyRef.current) {
        currentWeekKeyRef.current = currentWeekKey;
        setWeekStart(currentWeekStart);
      }
    };

    const timer = window.setInterval(syncCurrentWeek, 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const filteredTasks = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesKeyword = !keyword || [task.title, task.description, task.assigned_to, task.room_number, task.room_type]
        .some((value) => String(value || '').toLowerCase().includes(keyword));
      const matchesStatus = !statusFilter || getScheduleStatus(task.status) === statusFilter;
      return matchesKeyword && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter]);

  const weekTasks = useMemo(() => filteredTasks.filter((task) => {
    const taskDate = task.deadline ? toInputDate(toDate(task.deadline)) : '';
    return taskDate >= weekStartKey && taskDate <= weekEndKey;
  }), [filteredTasks, weekEndKey, weekStartKey]);

  const tasksByDate = useMemo(() => {
    const groupedTasks = {};
    weekDays.forEach((day) => {
      groupedTasks[toInputDate(day)] = [];
    });
    weekTasks.forEach((task) => {
      const key = task.deadline ? toInputDate(toDate(task.deadline)) : '';
      if (groupedTasks[key]) groupedTasks[key].push(task);
    });
    Object.values(groupedTasks).forEach((dayTasks) => {
      dayTasks.sort((first, second) => String(first.start_time || '').localeCompare(String(second.start_time || '')));
    });
    return groupedTasks;
  }, [weekDays, weekTasks]);

  const stats = useMemo(() => {
    const completed = weekTasks.filter((task) => getScheduleStatus(task.status) === 'completed').length;
    const active = weekTasks.filter((task) => getScheduleStatus(task.status) !== 'completed').length;
    const staffCount = new Set(weekTasks.map((task) => task.assigned_staff_id || task.assigned_to).filter(Boolean)).size;
    return { total: weekTasks.length, active, completed, staffCount };
  }, [weekTasks]);

  const openEditModal = (task) => {
    setSelectedId(task._id);
    setForm(toForm(task));
    setMode('edit');
    setMessage('');
  };

  const openCreateModal = (dateValue = todayInput()) => {
    if (dateValue < todayInput()) {
      setMessage('Không thể tạo lịch cho ngày đã qua.');
      return;
    }
    const initialTimes = getInitialTimes(dateValue);
    if (!initialTimes) {
      setMessage('Hôm nay không còn khung giờ hợp lệ để tạo lịch. Vui lòng chọn ngày tiếp theo.');
      return;
    }
    setSelectedId('');
    setForm({ ...emptyForm, ...initialTimes, deadline: dateValue });
    setMode('create');
    setMessage('');
  };

  const closeModal = () => {
    setSelectedId('');
    setForm(emptyForm);
    setMode('idle');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      if (name === 'assigned_staff_id') {
        const staff = staffMembers.find((member) => member._id === value);
        return { ...current, assigned_staff_id: value, assigned_to: staff?.full_name || '' };
      }
      if (name === 'room_number') {
        const room = rooms.find((item) => item.roomName === value);
        const roomType = room?.room_type_id?.name || room?.roomTypeName || '';
        return { ...current, room_number: value, room_type: roomType };
      }
      return { ...current, [name]: value };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.start_time || !form.end_time || form.end_time <= form.start_time) {
      setMessage('Giờ kết thúc phải sau giờ bắt đầu.');
      return;
    }
    const startMinutes = toMinutes(form.start_time);
    const endMinutes = toMinutes(form.end_time);
    const staffConflict = tasks.find((task) => (
      task._id !== selectedTask?._id
      && String(task.assigned_staff_id || '') === String(form.assigned_staff_id || '')
      && toInputDate(toDate(task.work_date || task.deadline)) === form.deadline
      && toMinutes(task.start_time) !== null
      && toMinutes(task.end_time) !== null
      && hasStaffBreakConflict(
        startMinutes,
        endMinutes,
        toMinutes(task.start_time),
        toMinutes(task.end_time)
      )
    ));
    if (staffConflict) {
      setMessage(`Nhân viên đã có lịch ${staffConflict.start_time}-${staffConflict.end_time} tại phòng ${staffConflict.room_number}. Mỗi lịch phải cách nhau ít nhất 15 phút.`);
      return;
    }
    try {
      const payload = {
        ...form,
        staff_type: 'housekeeping',
        status: isCreating ? 'Assigned' : form.status,
        room_number: form.room_number.trim(),
        room_type: form.room_type.trim(),
      };
      const saved = isEditing ? await managerApi.updateStaffTask(selectedTask._id, payload) : await managerApi.createStaffTask(payload);
      setMessage(isEditing ? 'Lưu lịch làm việc thành công.' : 'Tạo lịch làm việc thành công.');
      await loadTasks(saved._id);
      setWeekStart(getWeekStart(toDate(saved.deadline)));
      closeModal();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  return (
    <div className="manager-ops-page manager-figma-page staff-task-page">
      {message && <div className="manager-ops-message">{message}</div>}

      <section className="staff-task-stat-grid">
        <article className="figma-card staff-stat-card is-primary">
          <ClipboardList size={24} />
          <span>Lịch trong tuần</span>
          <strong>{stats.total}</strong>
          <small>{formatWeekRange(weekStart)}</small>
        </article>
        <article className="figma-card staff-stat-card">
          <Users size={24} />
          <span>Nhân viên có lịch</span>
          <strong>{stats.staffCount}</strong>
          <small>Nhân viên dọn phòng được phân công</small>
        </article>
        <article className="figma-card staff-stat-card">
          <CheckCircle2 size={24} />
          <span>Đã hoàn thành</span>
          <strong>{stats.completed}</strong>
          <small>Nhân viên đã cập nhật trạng thái done</small>
        </article>
        <article className="figma-card staff-stat-card">
          <CalendarDays size={24} />
          <span>Cần theo dõi</span>
          <strong>{stats.active}</strong>
          <small>Lịch chưa được nhân viên xác nhận hoàn thành</small>
        </article>
      </section>

      <section className="figma-card staff-schedule-card">
        <div className="staff-schedule-heading">
          <div>
            <span className="figma-eyebrow">Lịch làm việc nhân viên dọn phòng</span>
            <h2>Bảng lịch tuần</h2>
          </div>
          <div className="staff-week-controls">
            <button className="manager-ops-secondary" type="button" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              <ChevronLeft size={15} /> Tuần trước
            </button>
            <button className="manager-ops-secondary" type="button" onClick={() => setWeekStart(getWeekStart(new Date()))}>
              <CalendarDays size={15} /> Tuần này
            </button>
            <button className="manager-ops-secondary" type="button" onClick={() => setWeekStart(addDays(weekStart, 7))}>
              Tuần sau <ChevronRight size={15} />
            </button>
            <button className="manager-ops-button" type="button" onClick={() => openCreateModal(defaultCreateDate)}>
              <Plus size={16} /> Thêm lịch
            </button>
          </div>
        </div>

        <div className="inventory-toolbar staff-schedule-toolbar">
          <label className="figma-search-box">
            <Search size={17} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm theo nhân viên, phòng, ghi chú..." />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="assigned">Đã lên lịch</option>
            <option value="completed">Hoàn thành</option>
          </select>
        </div>

        <div className="staff-week-grid">
          {weekDays.map((day) => {
            const key = toInputDate(day);
            const dayTasks = tasksByDate[key] || [];
            return (
              <article className="staff-day-column" key={key}>
                <header className="staff-day-header">
                  <div>
                    <strong>{formatWeekday(day)}</strong>
                    <span>{formatShortDate(day)}</span>
                  </div>
                  <button className="icon-action-button" type="button" disabled={key < todayKey} onClick={() => openCreateModal(key)} aria-label={`Thêm lịch ngày ${formatShortDate(day)}`}>
                    <Plus size={16} />
                  </button>
                </header>

                <div className="staff-day-task-list">
                  {dayTasks.map((task) => {
                    const status = getScheduleStatus(task.status);
                    const note = task.description || task.receptionistNote || '';
                    return (
                      <button className="staff-schedule-item" key={task._id} type="button" onClick={() => openEditModal(task)}>
                        <div className="staff-schedule-item-head">
                          <strong>{task.title || 'Lịch làm việc'}</strong>
                          <span className={`manager-ops-status ${statusTone(status)}`}>{statuses[status] || task.status}</span>
                        </div>
                        <div className="staff-schedule-meta">
                          <span className="staff-schedule-time">
                            {task.start_time && task.end_time ? `${task.start_time} - ${task.end_time}` : 'Chưa có khung giờ'}
                          </span>
                          <span>{task.assigned_to || 'Chưa phân công'}</span>
                          <span>Phòng {task.room_number || '-'}</span>
                          <span>{task.room_type || 'Chưa có loại phòng'}</span>
                        </div>
                        {note ? <p>{note}</p> : <p className="is-muted">Chưa có ghi chú.</p>}
                        {task.completion_note ? <p className="staff-completion-note">Hoàn thành: {task.completion_note}</p> : null}
                      </button>
                    );
                  })}

                  {!dayTasks.length ? (
                    <div className="staff-day-empty">Chưa có lịch</div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {isModalOpen && (
        <div className="manager-modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <section className="manager-modal-card" role="dialog" aria-modal="true" aria-labelledby="staff-task-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="manager-modal-heading">
              <div>
                <span className="figma-eyebrow">Lịch làm việc nhân viên</span>
                <h2 id="staff-task-modal-title">{isCreating ? 'Thêm lịch làm việc mới' : selectedTask?.title}</h2>
                <p>{isEditing ? `Ngày làm việc: ${formatDate(selectedTask.deadline)}` : 'Xếp lịch làm việc cho nhân viên dọn phòng theo phòng và ngày.'}</p>
              </div>
              <button className="icon-action-button" type="button" onClick={closeModal}><X size={18} /></button>
            </div>

            <form className="manager-ops-form" onSubmit={handleSubmit}>
              <label>Tên ca / công việc<input disabled={!canEditSelected} maxLength="120" name="title" onChange={handleChange} required value={form.title} placeholder="Ví dụ: Dọn phòng CDT301" /></label>
              <label>Giao cho<select disabled={!canEditSelected} name="assigned_staff_id" onChange={handleChange} required value={form.assigned_staff_id}><option value="">Chọn nhân viên</option>{assignableStaff.map((staff) => <option key={staff._id} value={staff._id}>{staff.full_name}</option>)}</select></label>
              <label>Số phòng<select disabled={!canEditSelected} name="room_number" onChange={handleChange} required value={form.room_number}><option value="">Chọn số phòng</option>{rooms.map((room) => <option key={room._id || room.id} value={room.roomName}>{room.roomName}</option>)}</select></label>
              <label>Loại phòng<input readOnly value={form.room_type || 'Chọn số phòng để hiển thị loại phòng'} /></label>
              <label>Ngày làm việc<input readOnly value={form.deadline ? formatDate(form.deadline) : 'Chưa có ngày'} /></label>
              <label>Giờ bắt đầu<select disabled={!canEditSelected} name="start_time" onChange={handleChange} required value={form.start_time}>{timeOptions.map((time) => <option key={`start-${time}`} value={time}>{time}</option>)}</select></label>
              <label>Giờ kết thúc<select disabled={!canEditSelected} name="end_time" onChange={handleChange} required value={form.end_time}>{timeOptions.map((time) => <option key={`end-${time}`} value={time}>{time}</option>)}</select></label>
              <label className="manager-ops-wide">Ghi chú công việc<textarea disabled={!canEditSelected} maxLength="1000" name="description" onChange={handleChange} rows="4" value={form.description} placeholder="Ví dụ: ưu tiên lau phòng tắm, bổ sung khăn, kiểm tra ban công..." /></label>
              {selectedTask?.completion_note ? <label className="manager-ops-wide">Ghi chú hoàn thành<textarea readOnly rows="3" value={selectedTask.completion_note} /></label> : null}
              {canEditSelected ? <div className="manager-ops-actions">
                <button className="manager-ops-button" type="submit">{isEditing ? 'Lưu thay đổi' : 'Tạo lịch làm việc'}</button>
              </div> : null}
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default ManagerStaffTasksPage;
