import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Plus, RefreshCw, Search } from 'lucide-react';
import HousekeepingStatusBadge from '../components/HousekeepingStatusBadge.jsx';
import { housekeepingApi } from '../services/housekeeping-api.js';
import { useHousekeepingMaintenance } from '../hooks/use-housekeeping.js';
import '../styles/housekeeping.css';

const getMutationErrorMessage = (error) => {
  const apiMessage = error?.response?.data?.message;
  if (apiMessage) return apiMessage;
  if (error?.message) return error.message;
  return 'Action failed. Please try again.';
};

const HousekeepingSchedulePage = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useHousekeepingMaintenance();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    room_number: '',
    category: 'Equipment Failure',
    priority: 'high',
    description: '',
    image: '',
    note: '',
  });

  const [viewItem, setViewItem] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const createReportMutation = useMutation({
    mutationFn: (payload) => housekeepingApi.reportIssue(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['housekeeping-maintenance'] }),
        queryClient.invalidateQueries({ queryKey: ['housekeeping-dashboard'] }),
      ]);
    },
    onError: (error) => {
      window.alert(getMutationErrorMessage(error));
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: ({ id, payload }) => housekeepingApi.updateMaintenanceRequestStatus(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['housekeeping-maintenance'] }),
        queryClient.invalidateQueries({ queryKey: ['housekeeping-dashboard'] }),
      ]);
    },
    onError: (error) => {
      window.alert(getMutationErrorMessage(error));
    },
  });

  const summary = useMemo(() => {
    const rows = data || [];
    return {
      total: rows.length,
      open: rows.filter((item) => item.status === 'Open').length,
      inProgress: rows.filter((item) => item.status === 'InProgress').length,
      resolved: rows.filter((item) => item.status === 'Resolved').length,
    };
  }, [data]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return (data || []).filter((item) => {
      const matchesKeyword = !keyword || [item.room, item.category, item.description, item.assignedTech]
        .some((value) => String(value || '').toLowerCase().includes(keyword));
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || String(item.priority || '').toLowerCase() === priorityFilter;
      return matchesKeyword && matchesStatus && matchesPriority;
    });
  }, [data, priorityFilter, search, statusFilter]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRows = filteredRows.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const openCreateModal = () => {
    setCreateForm({
      room_number: '',
      category: 'Equipment Failure',
      priority: 'high',
      description: '',
      image: '',
      note: '',
    });
    setIsCreateOpen(true);
  };

  const submitCreateReport = async () => {
    if (!createForm.room_number.trim() || !createForm.category.trim() || !createForm.description.trim()) {
      window.alert('Room, category and description are required.');
      return;
    }

    await createReportMutation.mutateAsync({
      ...createForm,
      room_number: createForm.room_number.trim(),
      category: createForm.category.trim(),
      description: createForm.description.trim(),
      note: createForm.note.trim(),
      reportedBy: 'Housekeeping',
    });
    setIsCreateOpen(false);
    await refetch();
  };

  const handleView = async (id) => {
    try {
      const detail = await housekeepingApi.getMaintenanceRequestById(id);
      setViewItem(detail);
    } catch (error) {
      window.alert(getMutationErrorMessage(error));
    }
  };

  const handleEdit = async (id) => {
    try {
      const detail = await housekeepingApi.getMaintenanceRequestById(id);
      setEditForm({
        id: detail.id,
        room: detail.room,
        category: detail.category,
        status: detail.status,
        note: detail.note || '',
        image: detail.image || '',
      });
    } catch (error) {
      window.alert(getMutationErrorMessage(error));
    }
  };

  const submitEditReport = async () => {
    if (!editForm?.id) return;
    await updateReportMutation.mutateAsync({
      id: editForm.id,
      payload: {
        status: editForm.status,
        note: editForm.note,
        image: editForm.image,
      },
    });
    setEditForm(null);
    await refetch();
  };

  if (isLoading) {
    return (
      <div className="housekeeping-page">
        <div className="housekeeping-state-card">
          <h3>Loading maintenance reports</h3>
          <p>Reading maintenance requests from MongoDB.</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="housekeeping-page">
        <div className="housekeeping-state-card">
          <h3>Cannot load maintenance reports</h3>
          <p>Retry after backend is available.</p>
          <button className="housekeeping-btn" type="button" onClick={() => refetch()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="housekeeping-page">
      <div className="housekeeping-page-header">
        <div>
          <h2>Maintenance Report</h2>
          <p>Summary and management of maintenance issues from housekeeping workflow.</p>
        </div>
        <div className="housekeeping-task-actions">
          <button className="housekeeping-outline-btn" type="button" onClick={() => refetch()}><RefreshCw size={14} /> Refresh</button>
          <button className="housekeeping-btn" type="button" onClick={openCreateModal}><Plus size={14} /> New Report</button>
        </div>
      </div>

      <div className="housekeeping-maintenance-summary">
        <article className="housekeeping-maintenance-summary-card">
          <span>Total Reports</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="housekeeping-maintenance-summary-card">
          <span>Open</span>
          <strong>{summary.open}</strong>
        </article>
        <article className="housekeeping-maintenance-summary-card">
          <span>In Progress</span>
          <strong>{summary.inProgress}</strong>
        </article>
        <article className="housekeeping-maintenance-summary-card">
          <span>Resolved</span>
          <strong>{summary.resolved}</strong>
        </article>
      </div>

      <div className="housekeeping-card">
        <div className="housekeeping-maintenance-toolbar">
          <label className="housekeeping-search-field">
            <Search size={14} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search room, category, description"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All status</option>
            <option value="Open">Open</option>
            <option value="InProgress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(event) => {
              setPriorityFilter(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="housekeeping-table-wrap">
          <table className="housekeeping-table housekeeping-maintenance-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((item) => (
                <tr key={item.id}>
                  <td>{item.room}</td>
                  <td>{item.category}</td>
                  <td><HousekeepingStatusBadge value={item.priority} variant="priority" /></td>
                  <td>{item.description}</td>
                  <td><HousekeepingStatusBadge value={item.status} /></td>
                  <td>
                    <div className="housekeeping-task-actions">
                      <button className="housekeeping-outline-btn" type="button" onClick={() => handleView(item.id)}>
                        <Eye size={14} /> View
                      </button>
                      <button className="housekeeping-outline-btn" type="button" onClick={() => handleEdit(item.id)}>
                        <Pencil size={14} /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!paginatedRows.length ? (
                <tr>
                  <td colSpan={6}>
                    <div className="housekeeping-subtle">No maintenance reports found for current filters.</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="housekeeping-maintenance-pagination">
          <button
            className="housekeeping-outline-btn"
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={safeCurrentPage <= 1}
          >
            Previous
          </button>
          <span>Page {safeCurrentPage} / {totalPages}</span>
          <button
            className="housekeeping-outline-btn"
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safeCurrentPage >= totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {isCreateOpen ? (
        <div className="housekeeping-modal-backdrop">
          <div className="housekeeping-modal-card">
            <h3>New Maintenance Report</h3>
            <p>Create issue using existing housekeeping maintenance API.</p>
            <input
              value={createForm.room_number}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, room_number: event.target.value }))}
              placeholder="Room number"
              className="housekeeping-maintenance-input"
            />
            <input
              value={createForm.category}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Category"
              className="housekeeping-maintenance-input"
            />
            <select
              value={createForm.priority}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, priority: event.target.value }))}
            >
              <option value="urgent">urgent</option>
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
            <textarea
              value={createForm.description}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Description"
              className="housekeeping-maintenance-textarea"
            />
            <input
              value={createForm.image}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, image: event.target.value }))}
              placeholder="Photo URL (optional)"
              className="housekeeping-maintenance-input"
            />
            <textarea
              value={createForm.note}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, note: event.target.value }))}
              placeholder="Notes (optional)"
              className="housekeeping-maintenance-textarea"
            />
            <div className="housekeeping-modal-actions">
              <button className="housekeeping-outline-btn" type="button" onClick={() => setIsCreateOpen(false)}>Cancel</button>
              <button className="housekeeping-btn" type="button" onClick={submitCreateReport} disabled={createReportMutation.isPending}>
                {createReportMutation.isPending ? 'Saving...' : 'Create Report'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {viewItem ? (
        <div className="housekeeping-modal-backdrop">
          <div className="housekeeping-modal-card">
            <h3>Maintenance Report Detail</h3>
            <p>Room {viewItem.room}</p>
            <div className="housekeeping-maintenance-detail-grid">
              <span>Category</span><b>{viewItem.category}</b>
              <span>Priority</span><b><HousekeepingStatusBadge value={viewItem.priority} variant="priority" /></b>
              <span>Status</span><b><HousekeepingStatusBadge value={viewItem.status} /></b>
              <span>Assigned</span><b>{viewItem.assignedTech || 'Not assigned'}</b>
              <span>Description</span><b>{viewItem.description || 'ΓÇö'}</b>
              <span>Note</span><b>{viewItem.note || 'ΓÇö'}</b>
            </div>
            <div className="housekeeping-modal-actions">
              <button className="housekeeping-btn" type="button" onClick={() => setViewItem(null)}>Close</button>
            </div>
          </div>
        </div>
      ) : null}

      {editForm ? (
        <div className="housekeeping-modal-backdrop">
          <div className="housekeeping-modal-card">
            <h3>Edit Maintenance Report</h3>
            <div className="housekeeping-maintenance-edit-grid">
              <label>
                Room
                <input value={editForm.room} disabled className="housekeeping-maintenance-input" />
              </label>
              <label>
                Category
                <input value={editForm.category} disabled className="housekeeping-maintenance-input" />
              </label>
              <label>
                Current status
                <div><HousekeepingStatusBadge value={editForm.status} /></div>
              </label>
              <label>
                Update status
                <select
                  value={editForm.status}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <option value="Open">Open</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>
              <label className="housekeeping-maintenance-edit-wide">
                Note
                <textarea
                  value={editForm.note}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, note: event.target.value }))}
                  placeholder="Update note"
                  className="housekeeping-maintenance-textarea"
                />
              </label>
              <label className="housekeeping-maintenance-edit-wide">
                Photo URL
                <input
                  value={editForm.image}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, image: event.target.value }))}
                  placeholder="Photo URL"
                  className="housekeeping-maintenance-input"
                />
              </label>
            </div>
            <div className="housekeeping-modal-actions">
              <button className="housekeeping-outline-btn" type="button" onClick={() => setEditForm(null)}>Cancel</button>
              <button className="housekeeping-btn" type="button" onClick={submitEditReport} disabled={updateReportMutation.isPending}>
                {updateReportMutation.isPending ? 'Updating...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default HousekeepingSchedulePage;
