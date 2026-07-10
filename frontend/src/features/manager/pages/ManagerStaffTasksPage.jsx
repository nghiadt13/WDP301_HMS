import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, Plus, Search, Wrench, X } from 'lucide-react';
import { managerApi } from '../services/manager-api.js';
import './manager-operations.css';

const emptyForm = { title: '', description: '', staff_type: 'housekeeping', assigned_staff_id: '', assigned_to: '', room_number: '', priority: 'medium', status: 'assigned', deadline: '' };
const staffTypes = { housekeeping: 'Nhân viên dọn phòng', technical: 'Nhân viên kỹ thuật' };
const priorities = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' };
const statuses = { assigned: 'Đã giao', in_progress: 'Đang xử lý', closed: 'Hoàn thành', canceled: 'Đã hủy', cancelled: 'Đã hủy' };

const todayInput = () => new Date().toISOString().slice(0, 10);
const formatDate = (value) => (value ? new Intl.DateTimeFormat('vi-VN').format(new Date(value)) : 'Chưa có hạn');
const getErrorMessage = (error) => error?.response?.data?.message || error.message || 'Đã có lỗi xảy ra';
const normalizeStatus = (status) => String(status || '').toLowerCase();
const toForm = (task) => ({
  title: task.title || '',
  description: task.description || '',
  staff_type: task.staff_type || 'housekeeping',
  assigned_staff_id: task.assigned_staff_id || '',
  assigned_to: task.assigned_to || '',
  room_number: task.room_number || '',
  priority: task.priority || 'medium',
  status: task.status || 'assigned',
  deadline: task.deadline ? task.deadline.slice(0, 10) : '',
});
const statusTone = (status) => ['closed'].includes(status) ? 'is-good' : ['canceled', 'cancelled'].includes(status) ? 'is-muted' : status === 'in_progress' ? 'is-warning' : 'is-info';
const priorityTone = (priority) => priority === 'high' ? 'is-danger' : priority === 'medium' ? 'is-warning' : 'is-good';

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
  const [staffTypeFilter, setStaffTypeFilter] = useState('');

  const selectedTask = tasks.find((task) => task._id === selectedId);
  const isEditing = mode === 'edit' && selectedTask;
  const isCreating = mode === 'create';
  const isModalOpen = isCreating || isEditing;
  const assignableStaff = staffMembers.filter((member) => member.role === form.staff_type);

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
    Promise.all([managerApi.getStaffMembers().then(setStaffMembers), managerApi.getRooms({ limit: 200 }).then((result) => setRooms(result.data || result || [])), loadTasks('')]).catch((error) => setMessage(getErrorMessage(error)));
  }, []);

  const stats = useMemo(() => {
    const total = tasks.length;
    const active = tasks.filter((task) => !['closed', 'canceled', 'cancelled'].includes(normalizeStatus(task.status))).length;
    const inProgress = tasks.filter((task) => normalizeStatus(task.status) === 'in_progress').length;
    const highPriority = tasks.filter((task) => task.priority === 'high').length;
    return { total, active, inProgress, highPriority };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesKeyword = !keyword || [task.title, task.description, task.assigned_to, task.room_number]
        .some((value) => String(value || '').toLowerCase().includes(keyword));
      const matchesStatus = !statusFilter || normalizeStatus(task.status) === statusFilter;
      const matchesStaffType = !staffTypeFilter || task.staff_type === staffTypeFilter;
      return matchesKeyword && matchesStatus && matchesStaffType;
    });
  }, [tasks, searchTerm, statusFilter, staffTypeFilter]);

  const openEditModal = (task) => {
    setSelectedId(task._id);
    setForm(toForm(task));
    setMode('edit');
    setMessage('');
  };

  const openCreateModal = () => {
    setSelectedId('');
    setForm({ ...emptyForm, deadline: todayInput() });
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
      if (name === 'staff_type') return { ...current, staff_type: value, assigned_staff_id: '', assigned_to: '' };
      if (name === 'assigned_staff_id') {
        const staff = staffMembers.find((member) => member._id === value);
        return { ...current, assigned_staff_id: value, assigned_to: staff?.full_name || '' };
      }
      return { ...current, [name]: value };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...form, status: isCreating ? 'assigned' : form.status, room_number: form.room_number.trim() };
      const saved = isEditing ? await managerApi.updateStaffTask(selectedTask._id, payload) : await managerApi.createStaffTask(payload);
      setMessage(isEditing ? 'Lưu thay đổi nhiệm vụ thành công.' : 'Tạo nhiệm vụ thành công.');
      await loadTasks(saved._id);
      closeModal();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const handleClose = async () => {
    if (!selectedTask) return;
    const task = await managerApi.closeStaffTask(selectedTask._id);
    setMessage('Đã đánh dấu nhiệm vụ hoàn thành.');
    await loadTasks(task._id);
    closeModal();
  };

  const handleCancel = async () => {
    if (!selectedTask) return;
    const task = await managerApi.cancelStaffTask(selectedTask._id);
    setMessage('Hủy nhiệm vụ thành công.');
    await loadTasks(task._id);
    closeModal();
  };

  return (
    <div className="manager-ops-page manager-figma-page staff-task-page">
      {message && <div className="manager-ops-message">{message}</div>}

      <section className="staff-task-stat-grid">
        <article className="figma-card staff-stat-card is-primary">
          <ClipboardList size={24} />
          <span>Tổng nhiệm vụ</span>
          <strong>{stats.total}</strong>
          <small>Tất cả công việc đã tạo</small>
        </article>
        <article className="figma-card staff-stat-card">
          <Wrench size={24} />
          <span>Đang cần xử lý</span>
          <strong>{stats.active}</strong>
          <small>Chưa hoàn thành hoặc chưa hủy</small>
        </article>
        <article className="figma-card staff-stat-card">
          <CheckCircle2 size={24} />
          <span>Đang thực hiện</span>
          <strong>{stats.inProgress}</strong>
          <small>Nhiệm vụ đang xử lý</small>
        </article>
        <article className="figma-card staff-stat-card is-danger">
          <AlertTriangle size={24} />
          <span>Ưu tiên cao</span>
          <strong>{stats.highPriority}</strong>
          <small>Cần quản lý theo dõi sát</small>
        </article>
      </section>

      <section className="figma-card staff-task-table-card">
        <div className="inventory-toolbar">
          <label className="figma-search-box">
            <Search size={17} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm nhiệm vụ, nhân viên, phòng..." />
          </label>
          <select value={staffTypeFilter} onChange={(event) => setStaffTypeFilter(event.target.value)}>
            <option value="">Tất cả bộ phận</option>
            <option value="housekeeping">Dọn phòng</option>
            <option value="technical">Kỹ thuật</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="assigned">Đã giao</option>
            <option value="in_progress">Đang xử lý</option>
            <option value="closed">Hoàn thành</option>
            <option value="canceled">Đã hủy</option>
          </select>
          <button className="manager-ops-button" onClick={openCreateModal} type="button"><Plus size={16} /> Thêm nhiệm vụ</button>
        </div>

        <div className="manager-ops-table-wrap">
          <table className="manager-ops-table figma-inventory-table">
            <thead>
              <tr>
                <th>Nhiệm vụ</th>
                <th>Bộ phận</th>
                <th>Nhân viên</th>
                <th>Phòng</th>
                <th>Ưu tiên</th>
                <th>Hạn hoàn thành</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length ? filteredTasks.map((task) => (
                <tr className={`manager-ops-row ${selectedId === task._id ? 'is-selected' : ''}`} key={task._id} onClick={() => openEditModal(task)}>
                  <td><strong>{task.title}</strong><small>{task.description || 'Chưa có mô tả'}</small></td>
                  <td>{staffTypes[task.staff_type] || task.staff_type}</td>
                  <td>{task.assigned_to || 'Chưa phân công'}</td>
                  <td>{task.room_number || '-'}</td>
                  <td><span className={`manager-ops-status ${priorityTone(task.priority)}`}>{priorities[task.priority] || task.priority}</span></td>
                  <td>{formatDate(task.deadline)}</td>
                  <td><span className={`manager-ops-status ${statusTone(normalizeStatus(task.status))}`}>{statuses[task.status] || task.status}</span></td>
                </tr>
              )) : <tr><td className="manager-ops-empty" colSpan="7">Không tìm thấy nhiệm vụ phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="manager-modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <section className="manager-modal-card" role="dialog" aria-modal="true" aria-labelledby="staff-task-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="manager-modal-heading">
              <div>
                <span className="figma-eyebrow">Quản lý nhiệm vụ nhân viên</span>
                <h2 id="staff-task-modal-title">{isCreating ? 'Thêm nhiệm vụ mới' : selectedTask?.title}</h2>
                <p>{isEditing ? `Hạn hoàn thành: ${formatDate(selectedTask.deadline)}` : 'Giao việc cho nhân viên dọn phòng hoặc kỹ thuật.'}</p>
              </div>
              <button className="icon-action-button" type="button" onClick={closeModal}><X size={18} /></button>
            </div>

            <form className="manager-ops-form" onSubmit={handleSubmit}>
              <label>Tiêu đề<input name="title" onChange={handleChange} required value={form.title} /></label>
              <label>Loại nhân viên<select name="staff_type" onChange={handleChange} value={form.staff_type}><option value="housekeeping">{staffTypes.housekeeping}</option><option value="technical">{staffTypes.technical}</option></select></label>
              <label>Giao cho<select name="assigned_staff_id" onChange={handleChange} required value={form.assigned_staff_id}><option value="">Chọn nhân viên</option>{assignableStaff.map((staff) => <option key={staff._id} value={staff._id}>{staff.full_name}</option>)}</select></label>
              <label>Số phòng<select name="room_number" onChange={handleChange} required value={form.room_number}><option value="">Chọn phòng</option>{rooms.map((room) => <option key={room._id || room.id} value={room.roomName}>{room.roomName} - {room.status}</option>)}</select></label>
              <label>Mức ưu tiên<select name="priority" onChange={handleChange} value={form.priority}><option value="low">{priorities.low}</option><option value="medium">{priorities.medium}</option><option value="high">{priorities.high}</option></select></label>
              {isEditing && <label>Trạng thái<select name="status" onChange={handleChange} value={form.status}>{Object.entries(statuses).filter(([value]) => value !== 'cancelled').map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
              <label>Hạn hoàn thành<input min={todayInput()} name="deadline" onChange={handleChange} required type="date" value={form.deadline} /></label>
              <label>Mô tả<input name="description" onChange={handleChange} value={form.description} /></label>
              {isEditing && <p className="manager-action-note manager-ops-wide">Hoàn thành nghĩa là nhân viên đã xử lý xong công việc. Hủy nghĩa là nhiệm vụ tạo nhầm, bị trùng hoặc không còn cần thực hiện.</p>}
              <div className="manager-ops-actions">
                <button className="manager-ops-button" type="submit">{isEditing ? 'Lưu thay đổi' : 'Tạo nhiệm vụ'}</button>
                {isEditing && <button className="manager-ops-secondary" onClick={handleClose} type="button">Đánh dấu hoàn thành</button>}
                {isEditing && <button className="manager-ops-danger" onClick={handleCancel} type="button">Hủy nhiệm vụ</button>}

              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default ManagerStaffTasksPage;





