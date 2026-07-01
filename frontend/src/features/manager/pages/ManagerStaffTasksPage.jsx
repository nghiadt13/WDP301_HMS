import { useEffect, useState } from 'react';
import { managerApi } from '../services/manager-api.js';
import './manager-operations.css';

const emptyForm = { title: '', description: '', staff_type: 'housekeeping', assigned_staff_id: '', assigned_to: '', room_number: '', priority: 'medium', status: 'assigned', deadline: '' };
const staffTypes = { housekeeping: 'Nhân viên dọn phòng', technical: 'Nhân viên kỹ thuật' };
const priorities = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' };
const statuses = { open: 'Mở', assigned: 'Đã giao', in_progress: 'Đang xử lý', closed: 'Đã đóng', canceled: 'Đã hủy', cancelled: 'Đã hủy' };

const todayInput = () => new Date().toISOString().slice(0, 10);
const formatDate = (value) => (value ? new Intl.DateTimeFormat('vi-VN').format(new Date(value)) : 'Chưa có hạn');
const getErrorMessage = (error) => error?.response?.data?.message || error.message || 'Đã có lỗi xảy ra';
const toForm = (task) => ({ title: task.title || '', description: task.description || '', staff_type: task.staff_type || 'housekeeping', assigned_staff_id: task.assigned_staff_id || '', assigned_to: task.assigned_to || '', room_number: task.room_number || '', priority: task.priority || 'medium', status: task.status || 'assigned', deadline: task.deadline ? task.deadline.slice(0, 10) : '' });
const statusTone = (status) => ['closed'].includes(status) ? 'is-good' : ['canceled', 'cancelled'].includes(status) ? 'is-muted' : 'is-info';

const ManagerStaffTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState('');
  const [mode, setMode] = useState('idle');
  const [message, setMessage] = useState('');

  const selectedTask = tasks.find((task) => task._id === selectedId);
  const isEditing = mode === 'edit' && selectedTask;
  const isCreating = mode === 'create';
  const assignableStaff = staffMembers.filter((member) => member.role === form.staff_type);

  const loadTasks = async (nextId = selectedId) => {
    const data = await managerApi.getStaffTasks();
    setTasks(data);
    if (nextId) {
      const nextTask = data.find((task) => task._id === nextId);
      if (nextTask) { setSelectedId(nextTask._id); setForm(toForm(nextTask)); setMode('edit'); }
    }
  };

  useEffect(() => {
    Promise.all([managerApi.getStaffMembers().then(setStaffMembers), loadTasks('')]).catch((error) => setMessage(getErrorMessage(error)));
  }, []);

  const handleSelect = (task) => { setSelectedId(task._id); setForm(toForm(task)); setMode('edit'); setMessage(''); };
  const handleAdd = () => { setSelectedId(''); setForm({ ...emptyForm, deadline: todayInput() }); setMode('create'); setMessage(''); };
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
      const payload = { ...form, room_number: form.room_number.trim() };
      const saved = isEditing ? await managerApi.updateStaffTask(selectedTask._id, payload) : await managerApi.createStaffTask(payload);
      setMessage(isEditing ? 'Lưu thay đổi nhiệm vụ thành công.' : 'Tạo nhiệm vụ thành công.');
      await loadTasks(saved._id);
    } catch (error) { setMessage(getErrorMessage(error)); }
  };

  const handleClose = async () => { if (!selectedTask) return; const task = await managerApi.closeStaffTask(selectedTask._id); setMessage('Đóng nhiệm vụ thành công.'); await loadTasks(task._id); };
  const handleCancel = async () => { if (!selectedTask) return; const task = await managerApi.cancelStaffTask(selectedTask._id); setMessage('Hủy nhiệm vụ thành công.'); await loadTasks(task._id); };

  return (
    <div className="manager-ops-page">
      {message && <div className="manager-ops-message">{message}</div>}
      <section className="manager-ops-grid">
        <article className="manager-ops-card">
          <div className="manager-ops-heading"><div><h2>Danh sách nhiệm vụ</h2><p>Quản lý công việc giao cho nhân viên dọn phòng và kỹ thuật.</p></div><button className="manager-ops-button" onClick={handleAdd} type="button">Thêm nhiệm vụ</button></div>
          <div className="manager-ops-table-wrap"><table className="manager-ops-table"><thead><tr><th>Nhiệm vụ</th><th>Nhân viên</th><th>Phòng</th><th>Trạng thái</th></tr></thead><tbody>{tasks.length ? tasks.map((task) => <tr className={`manager-ops-row ${selectedId === task._id ? 'is-selected' : ''}`} key={task._id} onClick={() => handleSelect(task)}><td><strong>{task.title}</strong><small>{task.description || 'Chưa có mô tả'}</small></td><td>{task.assigned_to || 'Chưa phân công'}</td><td>{task.room_number || '-'}</td><td><span className={`manager-ops-status ${statusTone(task.status)}`}>{statuses[task.status] || task.status}</span></td></tr>) : <tr><td className="manager-ops-empty" colSpan="4">Chưa có nhiệm vụ nào.</td></tr>}</tbody></table></div>
        </article>
        <article className="manager-ops-card">
          <div className="manager-ops-heading"><div><h2>{isCreating ? 'Thêm nhiệm vụ' : isEditing ? 'Chi tiết nhiệm vụ' : 'Chọn nhiệm vụ'}</h2><p>{isEditing ? `Hạn hoàn thành: ${formatDate(selectedTask.deadline)}` : 'Chọn một dòng để xem chi tiết.'}</p></div></div>
          {isCreating || isEditing ? <form className="manager-ops-form" onSubmit={handleSubmit}><label>Tiêu đề<input name="title" onChange={handleChange} required value={form.title} /></label><label>Loại nhân viên<select name="staff_type" onChange={handleChange} value={form.staff_type}><option value="housekeeping">{staffTypes.housekeeping}</option><option value="technical">{staffTypes.technical}</option></select></label><label>Giao cho<select name="assigned_staff_id" onChange={handleChange} required value={form.assigned_staff_id}><option value="">Chọn nhân viên</option>{assignableStaff.map((staff) => <option key={staff._id} value={staff._id}>{staff.full_name}</option>)}</select></label><label>Số phòng<input name="room_number" onChange={handleChange} placeholder="305" required value={form.room_number} /></label><label>Mức ưu tiên<select name="priority" onChange={handleChange} value={form.priority}><option value="low">{priorities.low}</option><option value="medium">{priorities.medium}</option><option value="high">{priorities.high}</option></select></label><label>Trạng thái<select name="status" onChange={handleChange} value={form.status}>{Object.entries(statuses).slice(0, 5).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Hạn hoàn thành<input min={todayInput()} name="deadline" onChange={handleChange} required type="date" value={form.deadline} /></label><label>Mô tả<input name="description" onChange={handleChange} value={form.description} /></label><div className="manager-ops-actions"><button className="manager-ops-button" type="submit">{isEditing ? 'Lưu thay đổi' : 'Tạo nhiệm vụ'}</button>{isEditing && <button className="manager-ops-secondary" onClick={handleClose} type="button">Đóng nhiệm vụ</button>}{isEditing && <button className="manager-ops-danger" onClick={handleCancel} type="button">Hủy nhiệm vụ</button>}</div></form> : <div className="manager-ops-detail-empty">Chọn nhiệm vụ hoặc nhấn Thêm nhiệm vụ.</div>}
        </article>
      </section>
    </div>
  );
};

export default ManagerStaffTasksPage;
