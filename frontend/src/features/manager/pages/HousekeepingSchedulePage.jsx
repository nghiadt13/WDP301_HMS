import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  FileText,
  Filter,
  Image as ImageIcon,
  Layers,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  User,
  Wrench,
  X,
  XCircle,
} from 'lucide-react';
import DamageMissingItemsEditor, { withDamageMissingItemClientId } from '@/components/DamageMissingItemsEditor.jsx';
import HousekeepingStatusBadge from '../components/HousekeepingStatusBadge.jsx';
import { managerApi } from '../services/manager-api.js';
import '../styles/housekeeping.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:9999';

const toFullUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));

const formatDate = (dateValue) => {
  if (!dateValue) return '-';
  try {
    return new Date(dateValue).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateValue);
  }
};

const normalizeEditableItems = (items = []) =>
  items.map((item) =>
    withDamageMissingItemClientId(
      {
        ...item,
        estimated_compensation_amount: item?.estimated_compensation_amount ?? '',
        approved_compensation_amount:
          item?.approved_compensation_amount ?? item?.estimated_compensation_amount ?? '',
      },
      item?.type || 'damaged'
    )
  );

const buildInspectionPayloadItems = (items = []) =>
  items
    .map((item) => ({
      ...item,
      name: String(item?.name || '').trim(),
      type: item?.type || 'damaged',
      description: String(item?.description || '').trim(),
      estimated_compensation_amount:
        item?.estimated_compensation_amount === '' ? 0 : Number(item?.estimated_compensation_amount || 0),
      approved_compensation_amount:
        item?.approved_compensation_amount === '' ? null : Number(item?.approved_compensation_amount || 0),
      photos: Array.isArray(item?.photos) ? item.photos : [],
    }))
    .filter((item) => item.name);

// Skeleton loader component
const SkeletonRow = () => (
  <tr className="hk-skeleton-row">
    <td><div className="hk-skeleton hk-sk-text" style={{ width: '60px' }} /></td>
    <td><div className="hk-skeleton hk-sk-text" style={{ width: '140px' }} /></td>
    <td>
      <div className="hk-skeleton hk-sk-text" style={{ width: '100px', marginBottom: '4px' }} />
      <div className="hk-skeleton hk-sk-text" style={{ width: '80px', height: '10px' }} />
    </td>
    <td><div className="hk-skeleton hk-sk-text" style={{ width: '90px' }} /></td>
    <td><div className="hk-skeleton hk-sk-text" style={{ width: '90px' }} /></td>
    <td><div className="hk-skeleton hk-sk-badge" /></td>
    <td><div className="hk-skeleton hk-sk-badge" /></td>
    <td><div className="hk-skeleton hk-sk-badge" /></td>
    <td><div className="hk-skeleton hk-sk-btn" /></td>
  </tr>
);

const PriorityBadge = ({ priority = 'medium' }) => {
  const p = String(priority).toLowerCase();
  const config = {
    urgent: { label: 'Urgent', bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
    high: { label: 'High', bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' },
    medium: { label: 'Medium', bg: '#f0f9ff', color: '#0369a1', border: '#e0f2fe' },
    low: { label: 'Low', bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  }[p] || { label: priority, bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
};

const HousekeepingSchedulePage = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['manager-damage-reports'],
    queryFn: () => managerApi.getDamageReports(),
    retry: 1,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [drawerReport, setDrawerReport] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [maintenanceDraft, setMaintenanceDraft] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const updateReportMutation = useMutation({
    mutationFn: ({ id, payload }) => managerApi.updateDamageReport(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['manager-damage-reports'] });
      await queryClient.invalidateQueries({ queryKey: ['checkoutSummary'] });
    },
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: ({ id, payload }) => managerApi.createMaintenanceFromInspection(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['manager-damage-reports'] });
      await queryClient.invalidateQueries({ queryKey: ['housekeeping-maintenance'] });
      await queryClient.invalidateQueries({ queryKey: ['housekeeping-dashboard'] });
    },
  });

  const updateMaintenanceStatusMutation = useMutation({
    mutationFn: ({ id, status, note }) => managerApi.updateMaintenanceRequestStatus(id, { status, note }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['manager-damage-reports'] });
      await queryClient.invalidateQueries({ queryKey: ['housekeeping-maintenance'] });
      await queryClient.invalidateQueries({ queryKey: ['housekeeping-dashboard'] });
    },
  });

  const summary = useMemo(() => {
    const rows = data || [];
    return {
      total: rows.length,
      pendingReview: rows.filter(
        (item) => !item.maintenanceRequest || item.maintenanceRequest?.status === 'PendingReview'
      ).length,
      open: rows.filter((item) => item?.maintenanceRequest?.status === 'Open').length,
      inProgress: rows.filter((item) => item?.maintenanceRequest?.status === 'InProgress').length,
      completed: rows.filter((item) => item?.maintenanceRequest?.status === 'Resolved').length,
    };
  }, [data]);

  const uniqueRooms = useMemo(() => {
    const set = new Set();
    (data || []).forEach((item) => {
      if (item.roomNumber) set.add(item.roomNumber);
    });
    return Array.from(set).sort();
  }, [data]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    let rows = (data || []).filter((item) => {
      const req = item?.maintenanceRequest;
      const currentStatus = req?.status || 'PendingReview';
      const currentPriority = req?.priority || 'medium';

      const matchesKeyword =
        !keyword ||
        [
          item.roomNumber,
          item.note,
          item.remarks,
          item.inspector_name,
          req?.assignedTech,
          req?.description,
          ...(item.damageMissingItems || []).map((i) => i.name),
        ].some((value) => String(value || '').toLowerCase().includes(keyword));

      const matchesStatus = statusFilter === 'all' || currentStatus === statusFilter;
      const matchesPriority = priorityFilter === 'all' || currentPriority === priorityFilter;
      const matchesRoom = roomFilter === 'all' || item.roomNumber === roomFilter;

      let matchesDate = true;
      if (dateFilter) {
        const itemDate = item.createdAt ? new Date(item.createdAt).toISOString().slice(0, 10) : '';
        matchesDate = itemDate === dateFilter;
      }

      return matchesKeyword && matchesStatus && matchesPriority && matchesRoom && matchesDate;
    });

    rows.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'roomNumber') {
        aVal = String(a.roomNumber || '');
        bVal = String(b.roomNumber || '');
      } else if (sortField === 'createdAt') {
        aVal = new Date(a.createdAt || 0).getTime();
        bVal = new Date(b.createdAt || 0).getTime();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return rows;
  }, [data, search, statusFilter, priorityFilter, roomFilter, dateFilter, sortField, sortOrder]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRows = filteredRows.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setRoomFilter('all');
    setDateFilter('');
    setCurrentPage(1);
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const openEditReport = (report) => {
    setEditDraft({
      id: report.id,
      roomNumber: report.roomNumber,
      note: report.note || '',
      remarks: report.remarks || '',
      items: normalizeEditableItems(report.damageMissingItems || []),
    });
  };

  const submitEditReport = async () => {
    if (!editDraft?.id) return;
    await updateReportMutation.mutateAsync({
      id: editDraft.id,
      payload: {
        note: editDraft.note,
        remarks: editDraft.remarks,
        damage_missing_items: buildInspectionPayloadItems(editDraft.items),
        maintenance_required: editDraft.items.some((item) => item.type === 'damaged'),
      },
    });
    setEditDraft(null);
    await refetch();
    // Update active drawer context if open
    if (drawerReport && drawerReport.id === editDraft.id) {
      const refreshed = (data || []).find((r) => r.id === editDraft.id);
      if (refreshed) setDrawerReport(refreshed);
    }
  };

  const openCreateMaintenance = (report) => {
    setMaintenanceDraft({
      id: report.id,
      roomNumber: report.roomNumber,
      category: 'Damage Report',
      priority: report?.maintenanceRequest?.priority || 'high',
      assignedTech: report?.maintenanceRequest?.assignedTech || 'Technical Team',
      description:
        report?.maintenanceRequest?.description ||
        report.damageMissingItems?.map((item) => item.name).filter(Boolean).join(', ') ||
        `Maintenance required for room ${report.roomNumber}`,
      note: report?.maintenanceRequest?.note || report.note || report.remarks || '',
    });
  };

  const submitCreateMaintenance = async () => {
    if (!maintenanceDraft?.id) return;
    await createMaintenanceMutation.mutateAsync({
      id: maintenanceDraft.id,
      payload: {
        category: maintenanceDraft.category,
        priority: maintenanceDraft.priority,
        assignedTech: maintenanceDraft.assignedTech,
        description: maintenanceDraft.description,
        note: maintenanceDraft.note,
      },
    });
    setMaintenanceDraft(null);
    await refetch();
  };

  const handleUpdateStatus = async (requestId, newStatus, note = '') => {
    if (!requestId) return;
    await updateMaintenanceStatusMutation.mutateAsync({ id: requestId, status: newStatus, note });
    await refetch();
  };

  return (
    <div className="hk-page">
      {/* Header */}
      <div className="hk-header">
        <div>
          <h1 className="hk-title">Maintenance Management</h1>
          <p className="hk-subtitle">
            Review damage reports, approve compensation, and manage maintenance tasks.
          </p>
        </div>

        <div className="hk-header-actions">
          {summary.pendingReview > 0 && (
            <span className="hk-pending-badge">
              <AlertTriangle size={14} /> {summary.pendingReview} Pending Review
            </span>
          )}
          <button className="hk-btn-outline" type="button" onClick={() => refetch()} title="Refresh Data">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="hk-summary-grid">
        <div className="hk-summary-card">
          <div className="hk-summary-icon blue">
            <FileText size={20} />
          </div>
          <div>
            <span className="hk-summary-val">{summary.total}</span>
            <span className="hk-summary-lbl">Total Reports</span>
          </div>
        </div>

        <div className="hk-summary-card">
          <div className="hk-summary-icon amber">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="hk-summary-val">{summary.pendingReview}</span>
            <span className="hk-summary-lbl">Pending Review</span>
          </div>
        </div>

        <div className="hk-summary-card">
          <div className="hk-summary-icon purple">
            <Wrench size={20} />
          </div>
          <div>
            <span className="hk-summary-val">{summary.open}</span>
            <span className="hk-summary-lbl">Open Tasks</span>
          </div>
        </div>

        <div className="hk-summary-card">
          <div className="hk-summary-icon cyan">
            <Clock size={20} />
          </div>
          <div>
            <span className="hk-summary-val">{summary.inProgress}</span>
            <span className="hk-summary-lbl">In Progress</span>
          </div>
        </div>

        <div className="hk-summary-card">
          <div className="hk-summary-icon emerald">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="hk-summary-val">{summary.completed}</span>
            <span className="hk-summary-lbl">Completed</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="hk-card">
        <div className="hk-toolbar">
          <div className="hk-search-wrap">
            <Search size={16} className="hk-search-icon" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search room, reported item, reporter, note..."
              className="hk-input"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="hk-select"
          >
            <option value="all">All Statuses</option>
            <option value="PendingReview">Pending Review</option>
            <option value="Open">Open</option>
            <option value="InProgress">In Progress</option>
            <option value="Resolved">Completed</option>
            <option value="Cancelled">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="hk-select"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={roomFilter}
            onChange={(e) => {
              setRoomFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="hk-select"
          >
            <option value="all">All Rooms</option>
            {uniqueRooms.map((room) => (
              <option key={room} value={room}>
                Room {room}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="hk-input hk-date-input"
          />

          <button className="hk-btn-ghost" type="button" onClick={resetFilters} title="Reset all filters">
            <RotateCcw size={14} /> Reset Filters
          </button>
        </div>

        {/* Data Table */}
        <div className="hk-table-wrap">
          <table className="hk-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('roomNumber')} className="hk-th-sortable">
                  <div className="hk-th-content">
                    Room <ArrowUpDown size={12} />
                  </div>
                </th>
                <th>Reported Item</th>
                <th>Reporter</th>
                <th onClick={() => toggleSort('createdAt')} className="hk-th-sortable">
                  <div className="hk-th-content">
                    Report Time <ArrowUpDown size={12} />
                  </div>
                </th>
                <th>Est. Compensation</th>
                <th>Approved Compensation</th>
                <th>Priority</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : isError ? (
                <tr>
                  <td colSpan={9}>
                    <div className="hk-empty-state">
                      <XCircle size={36} color="#ef4444" />
                      <h4>Failed to load damage reports</h4>
                      <p>Could not connect to backend server. Please verify network or retry.</p>
                      <button className="hk-btn-primary" type="button" onClick={() => refetch()}>
                        Retry Loading
                      </button>
                    </div>
                  </td>
                </tr>
              ) : !paginatedRows.length ? (
                <tr>
                  <td colSpan={9}>
                    <div className="hk-empty-state">
                      <div className="hk-empty-icon-box">
                        <Wrench size={32} />
                      </div>
                      <h4>No maintenance reports found.</h4>
                      <p>There are no damage reports or maintenance tasks matching your criteria.</p>
                      {(search || statusFilter !== 'all' || priorityFilter !== 'all' || roomFilter !== 'all' || dateFilter) && (
                        <button className="hk-btn-outline" type="button" onClick={resetFilters}>
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((item) => {
                  const req = item.maintenanceRequest;
                  const currentStatus = req?.status || 'PendingReview';
                  const priority = req?.priority || 'medium';

                  const estTotal = (item.damageMissingItems || []).reduce(
                    (sum, r) => sum + Number(r.estimated_compensation_amount || 0),
                    0
                  );
                  const approvedTotal = (item.damageMissingItems || []).reduce(
                    (sum, r) =>
                      sum + Number(r.approved_compensation_amount ?? r.estimated_compensation_amount ?? 0),
                    0
                  );

                  const itemsNameStr =
                    (item.damageMissingItems || []).map((i) => i.name).filter(Boolean).join(', ') || '-';

                  return (
                    <tr key={item.id} className="hk-tr">
                      <td>
                        <strong className="hk-room-pill">Room {item.roomNumber}</strong>
                      </td>
                      <td>
                        <span className="hk-text-main" title={itemsNameStr}>
                          {itemsNameStr}
                        </span>
                      </td>
                      <td>
                        <div className="hk-user-cell">
                          <User size={13} className="hk-icon-sub" />
                          <span>{item.inspector_name || item.guest || 'Housekeeping'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="hk-text-sub">{formatDate(item.createdAt)}</span>
                      </td>
                      <td>
                        <span className="hk-text-sub">{formatCurrency(estTotal)}</span>
                      </td>
                      <td>
                        <strong className="hk-text-price">{formatCurrency(approvedTotal)}</strong>
                      </td>
                      <td>
                        <PriorityBadge priority={priority} />
                      </td>
                      <td>
                        {req ? (
                          <HousekeepingStatusBadge value={req.status} />
                        ) : (
                          <span className="housekeeping-badge inspection">Pending Review</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="hk-action-btns">
                          {/* Contextual Action Icon Buttons */}
                          <button
                            className="hk-icon-btn"
                            type="button"
                            onClick={() => setDrawerReport(item)}
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>

                          {currentStatus === 'PendingReview' && (
                            <>
                              <button
                                className="hk-icon-btn edit"
                                type="button"
                                onClick={() => openEditReport(item)}
                                title="Edit Compensation"
                              >
                                <Edit3 size={15} />
                              </button>

                              <button
                                className="hk-icon-btn primary"
                                type="button"
                                onClick={() => openCreateMaintenance(item)}
                                title="Create Maintenance Task"
                              >
                                <Plus size={15} />
                              </button>
                            </>
                          )}

                          {currentStatus === 'Open' && (
                            <button
                              className="hk-icon-btn primary"
                              type="button"
                              onClick={() => openCreateMaintenance(item)}
                              title="Update Task"
                            >
                              <Wrench size={15} />
                            </button>
                          )}

                          {currentStatus === 'InProgress' && (
                            <button
                              className="hk-icon-btn success"
                              type="button"
                              onClick={() => handleUpdateStatus(req.id, 'Resolved', 'Resolved by Manager')}
                              title="Complete Task"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filteredRows.length > 0 && (
          <div className="hk-pagination">
            <span className="hk-pagination-info">
              Showing {(safeCurrentPage - 1) * pageSize + 1} to{' '}
              {Math.min(safeCurrentPage * pageSize, filteredRows.length)} of {filteredRows.length} reports
            </span>

            <div className="hk-pagination-controls">
              <button
                className="hk-btn-outline compact"
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="hk-page-indicator">
                {safeCurrentPage} / {totalPages}
              </span>
              <button
                className="hk-btn-outline compact"
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Right-Side Drawer */}
      {drawerReport && (
        <div className="hk-drawer-backdrop" onClick={() => setDrawerReport(null)}>
          <div className="hk-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="hk-drawer-header">
              <div>
                <h3>Room {drawerReport.roomNumber} Maintenance Report</h3>
                <span className="hk-text-sub">ID: {drawerReport.id}</span>
              </div>
              <button className="hk-btn-ghost close" type="button" onClick={() => setDrawerReport(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="hk-drawer-body">
              {/* Room Information */}
              <section className="hk-drawer-section">
                <h4>Room Information</h4>
                <div className="hk-info-grid">
                  <div>
                    <span className="hk-lbl">Room Number</span>
                    <strong className="hk-val">Room {drawerReport.roomNumber}</strong>
                  </div>
                  <div>
                    <span className="hk-lbl">Report Status</span>
                    <div style={{ marginTop: '4px' }}>
                      {drawerReport.maintenanceRequest ? (
                        <HousekeepingStatusBadge value={drawerReport.maintenanceRequest.status} />
                      ) : (
                        <span className="housekeeping-badge inspection">Pending Review</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Inspection Information */}
              <section className="hk-drawer-section">
                <h4>Inspection Information</h4>
                <div className="hk-info-grid">
                  <div>
                    <span className="hk-lbl">Reporter</span>
                    <span className="hk-val">{drawerReport.inspector_name || 'Housekeeping Inspector'}</span>
                  </div>
                  <div>
                    <span className="hk-lbl">Inspection Date</span>
                    <span className="hk-val">{formatDate(drawerReport.createdAt)}</span>
                  </div>
                  <div>
                    <span className="hk-lbl">Assigned Staff / Team</span>
                    <span className="hk-val">
                      {drawerReport.maintenanceRequest?.assignedTech || 'Technical Team'}
                    </span>
                  </div>
                  <div>
                    <span className="hk-lbl">Priority</span>
                    <div style={{ marginTop: '4px' }}>
                      <PriorityBadge priority={drawerReport.maintenanceRequest?.priority || 'medium'} />
                    </div>
                  </div>
                </div>
              </section>

              {/* Damage & Missing Items */}
              <section className="hk-drawer-section">
                <h4>Damage & Missing Items</h4>
                <DamageMissingItemsEditor
                  title=""
                  description=""
                  value={normalizeEditableItems(drawerReport.damageMissingItems || [])}
                  onChange={() => {}}
                  showApprovedAmount
                  disabled
                  renderImageUrl={toFullUrl}
                />
              </section>

              {/* Photo Gallery */}
              <section className="hk-drawer-section">
                <h4>Photo Evidence</h4>
                {drawerReport.photos && drawerReport.photos.length > 0 ? (
                  <div className="hk-photo-grid">
                    {drawerReport.photos.map((photoUrl, idx) => {
                      const fullUrl = toFullUrl(photoUrl);
                      return (
                        <div
                          key={idx}
                          className="hk-photo-thumb"
                          onClick={() => setFullscreenImage(fullUrl)}
                          title="Click to expand full screen"
                        >
                          <img src={fullUrl} alt={`Evidence ${idx + 1}`} />
                          <div className="hk-photo-overlay">
                            <Eye size={16} color="#fff" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="hk-no-photos">
                    <ImageIcon size={24} className="hk-icon-sub" />
                    <span>No photos uploaded.</span>
                  </div>
                )}
              </section>

              {/* Compensation Summary */}
              <section className="hk-drawer-section">
                <h4>Compensation Breakdown</h4>
                <div className="hk-comp-box">
                  <div className="hk-comp-row">
                    <span>Estimated Total:</span>
                    <span>
                      {formatCurrency(
                        (drawerReport.damageMissingItems || []).reduce(
                          (sum, i) => sum + Number(i.estimated_compensation_amount || 0),
                          0
                        )
                      )}
                    </span>
                  </div>
                  <div className="hk-comp-row bold">
                    <span>Approved Total (Billed):</span>
                    <strong className="hk-text-price">
                      {formatCurrency(
                        (drawerReport.damageMissingItems || []).reduce(
                          (sum, i) =>
                            sum + Number(i.approved_compensation_amount ?? i.estimated_compensation_amount ?? 0),
                          0
                        )
                      )}
                    </strong>
                  </div>
                </div>
              </section>

              {/* Housekeeping Notes */}
              <section className="hk-drawer-section">
                <h4>Housekeeping Notes</h4>
                <div className="hk-note-card">
                  <p>{drawerReport.note || drawerReport.remarks || 'No additional notes provided by inspector.'}</p>
                </div>
              </section>

              {/* Task Timeline / History */}
              {drawerReport.maintenanceRequest && (
                <section className="hk-drawer-section">
                  <h4>Maintenance Task Info</h4>
                  <div className="hk-note-card">
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5 }}>
                      <strong>Description:</strong> {drawerReport.maintenanceRequest.description || '-'}<br />
                      <strong>Internal Note:</strong> {drawerReport.maintenanceRequest.note || '-'}<br />
                      <strong>Last Updated:</strong> {formatDate(drawerReport.maintenanceRequest.updatedAt)}
                    </p>
                  </div>
                </section>
              )}

              {/* Manager Actions */}
              <section className="hk-drawer-section">
                <h4>Manager Actions</h4>
                <div className="hk-drawer-actions">
                  <button
                    className="hk-btn-outline"
                    type="button"
                    onClick={() => {
                      openEditReport(drawerReport);
                    }}
                  >
                    <Edit3 size={15} /> Edit Compensation
                  </button>

                  <button
                    className="hk-btn-primary"
                    type="button"
                    onClick={() => {
                      openCreateMaintenance(drawerReport);
                    }}
                  >
                    <Plus size={15} />{' '}
                    {drawerReport.maintenanceRequest ? 'Update Maintenance Task' : 'Assign Maintenance Task'}
                  </button>

                  {drawerReport.maintenanceRequest &&
                  drawerReport.maintenanceRequest.status !== 'Resolved' &&
                  drawerReport.maintenanceRequest.status !== 'Cancelled' ? (
                    <button
                      className="hk-btn-success"
                      type="button"
                      onClick={async () => {
                        await handleUpdateStatus(
                          drawerReport.maintenanceRequest.id,
                          'Resolved',
                          'Resolved by Manager'
                        );
                        setDrawerReport(null);
                      }}
                    >
                      <CheckCircle2 size={16} /> Complete & Notify Receptionist
                    </button>
                  ) : null}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Edit Compensation Modal */}
      {editDraft && (
        <div className="housekeeping-modal-backdrop" onClick={() => setEditDraft(null)}>
          <div className="housekeeping-modal-card" style={{ maxWidth: '800px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <h3>Review & Approve Compensation</h3>
            <p style={{ color: '#64748b', fontSize: '13px' }}>
              Adjust compensation amounts and notes for Room {editDraft.roomNumber}. Approved amounts automatically
              apply to guest checkout billing.
            </p>

            <div style={{ display: 'grid', gap: '12px', margin: '16px 0' }}>
              <label style={{ display: 'grid', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                Housekeeping Note
                <textarea
                  value={editDraft.note}
                  onChange={(event) => setEditDraft((prev) => ({ ...prev, note: event.target.value }))}
                  className="hk-input"
                  rows={2}
                />
              </label>

              <label style={{ display: 'grid', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                Remarks
                <textarea
                  value={editDraft.remarks}
                  onChange={(event) => setEditDraft((prev) => ({ ...prev, remarks: event.target.value }))}
                  className="hk-input"
                  rows={2}
                />
              </label>
            </div>

            <DamageMissingItemsEditor
              title="Damage & Missing Items Compensation"
              description="Set approved compensation amount per item."
              value={editDraft.items}
              onChange={(items) => setEditDraft((prev) => ({ ...prev, items }))}
              showApprovedAmount
              renderImageUrl={toFullUrl}
            />

            <div className="housekeeping-modal-actions" style={{ marginTop: '20px' }}>
              <button
                className="hk-btn-primary"
                type="button"
                onClick={submitEditReport}
                disabled={updateReportMutation.isPending}
              >
                {updateReportMutation.isPending ? 'Saving...' : 'Save Approved Compensation'}
              </button>
              <button className="hk-btn-outline" type="button" onClick={() => setEditDraft(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Assign Maintenance Task Modal */}
      {maintenanceDraft && (
        <div className="housekeeping-modal-backdrop" onClick={() => setMaintenanceDraft(null)}>
          <div className="housekeeping-modal-card" style={{ maxWidth: '550px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <h3>Assign Maintenance Task</h3>
            <p style={{ color: '#64748b', fontSize: '13px' }}>
              Create or update a maintenance task for Room {maintenanceDraft.roomNumber}.
            </p>

            <div style={{ display: 'grid', gap: '14px', margin: '16px 0' }}>
              <label style={{ display: 'grid', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                Priority
                <select
                  value={maintenanceDraft.priority}
                  onChange={(event) => setMaintenanceDraft((prev) => ({ ...prev, priority: event.target.value }))}
                  className="hk-select"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>

              <label style={{ display: 'grid', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                Assigned Staff / Team
                <input
                  value={maintenanceDraft.assignedTech}
                  onChange={(event) => setMaintenanceDraft((prev) => ({ ...prev, assignedTech: event.target.value }))}
                  placeholder="e.g. Technical Team, John Maintenance"
                  className="hk-input"
                />
              </label>

              <label style={{ display: 'grid', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                Task Description
                <textarea
                  value={maintenanceDraft.description}
                  onChange={(event) => setMaintenanceDraft((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                  className="hk-input"
                />
              </label>

              <label style={{ display: 'grid', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                Internal Note
                <textarea
                  value={maintenanceDraft.note}
                  onChange={(event) => setMaintenanceDraft((prev) => ({ ...prev, note: event.target.value }))}
                  rows={2}
                  className="hk-input"
                />
              </label>
            </div>

            <div className="housekeeping-modal-actions">
              <button
                className="hk-btn-primary"
                type="button"
                onClick={submitCreateMaintenance}
                disabled={createMaintenanceMutation.isPending}
              >
                {createMaintenanceMutation.isPending ? 'Saving...' : 'Save Maintenance Task'}
              </button>
              <button className="hk-btn-outline" type="button" onClick={() => setMaintenanceDraft(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Fullscreen Image Viewer Modal */}
      {fullscreenImage && (
        <div className="hk-lightbox" onClick={() => setFullscreenImage(null)}>
          <button className="hk-lightbox-close" type="button" onClick={() => setFullscreenImage(null)}>
            <X size={24} />
          </button>
          <img src={fullscreenImage} alt="Fullscreen evidence" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default HousekeepingSchedulePage;
