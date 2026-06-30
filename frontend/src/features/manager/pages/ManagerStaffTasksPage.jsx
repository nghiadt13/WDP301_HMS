import { useEffect, useState } from 'react';

import {
  cancelStaffTask,
  closeStaffTask,
  createStaffTask,
  getStaffMembers,
  getStaffTasks,
  updateStaffTask
} from '../api/managerApi.js';
import ManagerShell from '../components/ManagerShell.jsx';

const emptyForm = {
  title: '',
  description: '',
  staff_type: 'housekeeping',
  assigned_staff_id: '',
  assigned_to: '',
  room_number: '',
  priority: 'medium',
  status: 'assigned',
  deadline: ''
};

const getErrorMessage = (error) => error?.response?.data?.message || error.message || 'Something went wrong';
const todayInput = () => new Date().toISOString().slice(0, 10);
const formatDate = (value) => (value ? new Intl.DateTimeFormat('en').format(new Date(value)) : 'No deadline');
const isValidRoomNumber = (roomNumber) => /^[1-9][0-9]{2,3}$/.test(String(roomNumber || '').trim());

const toTaskForm = (task) => ({
  title: task.title || '',
  description: task.description || '',
  staff_type: task.staff_type || 'housekeeping',
  assigned_staff_id: task.assigned_staff_id || '',
  assigned_to: task.assigned_to || '',
  room_number: task.room_number || '',
  priority: task.priority || 'medium',
  status: task.status || 'assigned',
  deadline: task.deadline ? task.deadline.slice(0, 10) : ''
});

const ManagerStaffTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [mode, setMode] = useState('idle');
  const [message, setMessage] = useState('');

  const selectedTask = tasks.find((task) => task._id === selectedTaskId);
  const assignableStaffMembers = staffMembers.filter((staffMember) => staffMember.role === form.staff_type);
  const isEditing = mode === 'edit' && selectedTask;
  const isCreating = mode === 'create';

  const loadStaffMembers = async () => {
    const data = await getStaffMembers();
    setStaffMembers(data);
  };

  const loadTasks = async (nextSelectedId = selectedTaskId) => {
    const data = await getStaffTasks();
    setTasks(data);

    if (nextSelectedId) {
      const nextTask = data.find((task) => task._id === nextSelectedId);

      if (nextTask) {
        setSelectedTaskId(nextTask._id);
        setForm(toTaskForm(nextTask));
        setMode('edit');
      }
    }
  };

  useEffect(() => {
    Promise.all([loadStaffMembers(), loadTasks('')]).catch((error) => {
      setMessage(getErrorMessage(error));
    });
  }, []);

  const handleSelect = (task) => {
    setSelectedTaskId(task._id);
    setForm(toTaskForm(task));
    setMode('edit');
    setMessage('');
  };

  const handleAdd = () => {
    setSelectedTaskId('');
    setForm({ ...emptyForm, deadline: todayInput() });
    setMode('create');
    setMessage('');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => {
      if (name === 'staff_type') {
        return { ...current, staff_type: value, assigned_staff_id: '', assigned_to: '' };
      }

      if (name === 'assigned_staff_id') {
        const selectedStaff = staffMembers.find((staffMember) => staffMember._id === value);
        return { ...current, assigned_staff_id: value, assigned_to: selectedStaff?.full_name || '' };
      }

      return { ...current, [name]: value };
    });
  };

  const validateForm = () => {
    if (!form.title.trim()) return 'Task title is required.';
    if (!form.assigned_staff_id) return 'Please select an assigned staff member.';
    if (!form.room_number) return 'Room number is required.';
    if (!isValidRoomNumber(form.room_number)) return 'Room number must be 3 to 4 digits and cannot start with 0.';
    if (!form.deadline) return 'Deadline is required.';
    if (form.deadline < todayInput()) return 'Deadline must be today or a future date.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    try {
      const payload = { ...form, room_number: form.room_number.trim() };

      if (isEditing) {
        const updatedTask = await updateStaffTask(selectedTask._id, payload);
        setMessage('Staff task updated successfully.');
        await loadTasks(updatedTask._id);
        return;
      }

      const createdTask = await createStaffTask(payload);
      setMessage('Staff task created successfully.');
      await loadTasks(createdTask._id);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const handleClose = async () => {
    if (!selectedTask) return;
    const closedTask = await closeStaffTask(selectedTask._id);
    setMessage('Staff task closed successfully.');
    await loadTasks(closedTask._id);
  };

  const handleCancel = async () => {
    if (!selectedTask) return;
    const cancelledTask = await cancelStaffTask(selectedTask._id);
    setMessage('Staff task cancelled successfully.');
    await loadTasks(cancelledTask._id);
  };

  return (
    <ManagerShell title="Staff Task Management">
      <div className="manager-main-column">
        {message ? <div className="manager-message">{message}</div> : null}

        <section className="manager-grid manager-two-column">
          <article className="manager-card">
            <div className="manager-card-heading">
              <div>
                <h2>Task Overview</h2>
                <p className="manager-muted">Click a task to view details and update it.</p>
              </div>
              <button className="manager-primary-button" onClick={handleAdd} type="button">Add Task</button>
            </div>
            <div className="manager-table-wrap">
              <table>
                <thead><tr><th>Task</th><th>Assigned To</th><th>Room</th><th>Status</th></tr></thead>
                <tbody>
                  {tasks.length ? tasks.map((task) => (
                    <tr className={`manager-clickable-row ${selectedTaskId === task._id ? 'is-selected' : ''}`} key={task._id} onClick={() => handleSelect(task)}>
                      <td><strong>{task.title}</strong><small>{task.description || 'No description'}</small></td>
                      <td>{task.assigned_to || 'Unassigned'}</td>
                      <td>{task.room_number || '-'}</td>
                      <td><span className={`manager-status ${task.status}`}>{task.status}</span></td>
                    </tr>
                  )) : <tr><td className="manager-empty-cell" colSpan="4">No staff tasks yet. Click Add Task to create one.</td></tr>}
                </tbody>
              </table>
            </div>
          </article>

          <article className="manager-card">
            <div className="manager-card-heading">
              <div>
                <h2>{isCreating ? 'Add Staff Task' : isEditing ? 'Staff Task Detail' : 'Select a Staff Task'}</h2>
                <p className="manager-muted">{isEditing ? `Deadline: ${formatDate(selectedTask.deadline)}` : 'Details appear here after selecting a row.'}</p>
              </div>
            </div>

            {isCreating || isEditing ? (
              <form className="manager-form-grid" onSubmit={handleSubmit}>
                <label>Task Title<input name="title" onChange={handleChange} required value={form.title} /></label>
                <label>Staff Type<select name="staff_type" onChange={handleChange} value={form.staff_type}><option value="housekeeping">Housekeeping</option><option value="technical">Technical</option></select></label>
                <label>Assigned To<select name="assigned_staff_id" onChange={handleChange} required value={form.assigned_staff_id}><option value="">Select staff member</option>{assignableStaffMembers.map((staffMember) => <option key={staffMember._id} value={staffMember._id}>{staffMember.full_name}</option>)}</select></label>
                <label>Room Number<input name="room_number" onChange={handleChange} placeholder="305" required value={form.room_number} /></label>
                <label>Priority<select name="priority" onChange={handleChange} value={form.priority}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
                <label>Status<select name="status" onChange={handleChange} value={form.status}><option value="open">Open</option><option value="assigned">Assigned</option><option value="in_progress">In Progress</option><option value="closed">Closed</option><option value="cancelled">Cancelled</option></select></label>
                <label>Deadline<input min={todayInput()} name="deadline" onChange={handleChange} required type="date" value={form.deadline} /></label>
                <label>Description<input name="description" onChange={handleChange} value={form.description} /></label>
                <div className="manager-form-actions">
                  <button className="manager-primary-button" type="submit">{isEditing ? 'Save Changes' : 'Create Task'}</button>
                  {isEditing ? <button className="manager-row-action" onClick={handleClose} type="button">Close Task</button> : null}
                  {isEditing ? <button className="manager-row-action danger" onClick={handleCancel} type="button">Cancel Task</button> : null}
                </div>
              </form>
            ) : (
              <div className="manager-detail-empty">Select a task from the list or click Add Task.</div>
            )}
          </article>
        </section>
      </div>
    </ManagerShell>
  );
};

export default ManagerStaffTasksPage;
