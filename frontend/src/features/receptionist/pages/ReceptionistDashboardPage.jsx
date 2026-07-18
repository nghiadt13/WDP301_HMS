import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BedDouble, Home, LogOut } from 'lucide-react';
import './ReceptionistDashboardPage.css';
import '../../manager/styles/manager-layout.css';
import { receptionistApi } from '../services/receptionist-api.js';
import { bookings, kpis, quickActions, roomStatus, serviceRequests } from '../data/receptionistDashboardData.js';

const iconPaths = {
  dashboard: 'M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z',
  calendar: 'M5 4h14v16H5V4Zm0 5h14M8 2v4m8-4v4',
  search: 'M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm5.3-2.2L21 21',
  booking: 'M6 3h12v18H6V3Zm3 5h6M9 12h6M9 16h4',
  bed: 'M4 11V6h5a4 4 0 0 1 4 4v1h7v7M4 18v-7h16v7M4 18v2m16-2v2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  wallet: 'M4 7h15v11H4V7Zm0 0V5h13m-1 8h3',
  check: 'M4 4h16v16H4V4Zm4 8 3 3 5-6',
  file: 'M6 3h8l4 4v14H6V3Zm8 0v5h5',
  plus: 'M12 5v14m-7-7h14',
  bell: 'M6 17h12l-1.5-2.5V10a4.5 4.5 0 0 0-9 0v4.5L6 17Zm4 0a2 2 0 0 0 4 0',
  message: 'M4 5h16v10H8l-4 4V5Z',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
};

const Icon = ({ name, size = 20, className = '' }) => (
  <svg className={`receptionist-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d={iconPaths[name]} />
  </svg>
);

const KpiCard = ({ title, value, subtitle, icon, tone }) => (
  <article className="receptionist-card receptionist-kpi-card">
    <span className={`receptionist-kpi-icon ${tone}`}><Icon name={icon} /></span>
    <div>
      <p>{title}</p>
      <strong>{value}</strong>
      <small>{subtitle}</small>
    </div>
  </article>
);

const toStatusClass = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'completed') return 'checked-in';
  if (normalized === 'waitingmaintenance') return 'check-out';
  if (normalized === 'cleaning') return 'arriving';
  if (normalized === 'accepted') return 'walk-in';
  return 'pending';
};

const getActionError = (error) => {
  const message = error?.response?.data?.message || error?.message;
  return message || 'Cannot assign cleaning task right now.';
};

const ReceptionistDashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('hotelify_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const displayName = user?.full_name === 'Front Desk Receptionist' ? 'Lễ tân' : (user?.full_name || 'Lễ tân');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [priority, setPriority] = useState('high');
  const [receptionistNote, setReceptionistNote] = useState('Guest checked out. Please clean this room.');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');

  const housekeepingBoardQuery = useQuery({
    queryKey: ['receptionist-operational-board'],
    queryFn: receptionistApi.getOperationalBoard,
    refetchInterval: 5_000,
    staleTime: 5_000,
    retry: 1,
    enabled: activeTab === 'housekeeping',
  });

  const createTaskMutation = useMutation({
    mutationFn: receptionistApi.createCleaningTask,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['receptionist-operational-board'] }),
        queryClient.invalidateQueries({ queryKey: ['housekeeping-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['rooms'] }),
      ]);
    },
    onError: (error) => {
      window.alert(getActionError(error));
    },
  });

  useEffect(() => {
    const storedUserListener = () => {
      try {
        setUser(JSON.parse(localStorage.getItem('hotelify_user') || 'null'));
      } catch {
        setUser(null);
      }
    };
    window.addEventListener('hotelify-auth-change', storedUserListener);
    return () => window.removeEventListener('hotelify-auth-change', storedUserListener);
  }, []);

  useEffect(() => {
    if (!isProfileMenuOpen) return undefined;

    const closeProfileMenu = (event) => {
      if (event.key === 'Escape') setIsProfileMenuOpen(false);
    };

    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', closeProfileMenu);
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('keydown', closeProfileMenu);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isProfileMenuOpen]);

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'LT';

  const roleName = user?.role?.name || user?.role_name || user?.role || 'Receptionist';

  const handleLogout = () => {
    localStorage.removeItem('hotelify_token');
    localStorage.removeItem('hotelify_user');
    window.dispatchEvent(new Event('hotelify-auth-change'));
    navigate('/login');
  };

  const roomsRequiringCleaning = useMemo(
    () => (housekeepingBoardQuery.data?.rooms || []).filter((room) => String(room.status || '').toLowerCase() === 'dirty'),
    [housekeepingBoardQuery.data?.rooms]
  );

  const housekeepingTasks = useMemo(() => {
    const rows = housekeepingBoardQuery.data?.tasks || [];
    return [...rows].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [housekeepingBoardQuery.data?.tasks]);

  const roomCounts = useMemo(() => {
    return (housekeepingBoardQuery.data?.rooms || []).reduce((accumulator, room) => {
      const key = String(room.status || '').toLowerCase();
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});
  }, [housekeepingBoardQuery.data?.rooms]);

  useEffect(() => {
    if (!roomsRequiringCleaning.length) {
      setSelectedRoomNumber('');
      return;
    }

    if (!selectedRoomNumber || !roomsRequiringCleaning.some((room) => room.roomNumber === selectedRoomNumber)) {
      setSelectedRoomNumber(roomsRequiringCleaning[0].roomNumber);
    }
  }, [roomsRequiringCleaning, selectedRoomNumber]);

  const onAssignCleaningTask = async (roomNumberOverride = '') => {
    const roomNumber = roomNumberOverride || selectedRoomNumber;
    if (!roomNumber) {
      window.alert('Please select a room to assign.');
      return;
    }

    await createTaskMutation.mutateAsync({
      room_number: roomNumber,
      priority,
      receptionistNote,
      cleaningType: 'Checkout Cleaning',
      checkoutTime: new Date().toISOString(),
    });

    await housekeepingBoardQuery.refetch();
  };

  return (
    <div className="receptionist-dashboard-page">
      <main className="receptionist-workspace">
        <header className="receptionist-header">
          <div>
            <h1>Bảng điều khiển Lễ tân</h1>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                className="receptionist-link-button"
                onClick={() => setActiveTab('dashboard')}
                style={{
                  border: activeTab === 'dashboard' ? '1px solid #2563eb' : '1px solid #e5e7eb',
                  borderRadius: '999px',
                  padding: '6px 12px',
                  color: activeTab === 'dashboard' ? '#2563eb' : '#4b5563',
                  background: '#fff',
                }}
              >
                Dashboard
              </button>
              <button
                type="button"
                className="receptionist-link-button"
                onClick={() => setActiveTab('housekeeping')}
                style={{
                  border: activeTab === 'housekeeping' ? '1px solid #2563eb' : '1px solid #e5e7eb',
                  borderRadius: '999px',
                  padding: '6px 12px',
                  color: activeTab === 'housekeeping' ? '#2563eb' : '#4b5563',
                  background: '#fff',
                }}
              >
                Housekeeping Tasks
              </button>
            </div>
          </div>
          <div className="receptionist-header-actions">
            <label className="receptionist-search">
              <Icon name="search" size={18} />
              <input placeholder="Tìm kiếm đặt phòng, khách hàng, số phòng..." />
            </label>
            <button className="receptionist-circle-button" type="button"><Icon name="message" /></button>
            <button className="receptionist-circle-button" type="button"><Icon name="bell" /></button>

            <div className="rm-profile-container" ref={profileMenuRef}>
              <button
                className="rm-profile"
                type="button"
                onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={displayName} style={{ width: '36px', height: '36px', borderRadius: '999px', objectFit: 'cover' }} />
                ) : (
                  <span className="rm-profile-avatar">{initials}</span>
                )}
                <span>
                  <strong>{displayName}</strong>
                  <small>{roleName === 'Receptionist' ? 'Lễ tân' : roleName}</small>
                </span>
              </button>

              {isProfileMenuOpen && (
                <div className="rm-profile-dropdown" role="menu" style={{ right: 0, top: '48px', position: 'absolute', zIndex: 100 }}>
                  <div className="rm-profile-dropdown-header">
                    <strong>{displayName}</strong>
                    <span>{user?.email || 'receptionist@hotelify.com'}</span>
                  </div>
                  <div className="rm-profile-dropdown-divider" />
                  <button
                    type="button"
                    className="rm-profile-dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/');
                    }}
                  >
                    <Home size={16} />
                    <span>Trang chủ</span>
                  </button>
                  <button
                    type="button"
                    className="rm-profile-dropdown-item text-danger"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' ? (
          <section className="receptionist-content">
            <div className="receptionist-main-column">
              <section className="receptionist-grid receptionist-kpis">
                {kpis.map((item) => <KpiCard key={item[0]} title={item[0]} value={item[1]} subtitle={item[2]} icon={item[3]} tone={item[4]} />)}
              </section>

              <section className="receptionist-card receptionist-bookings-card">
                <div className="receptionist-card-heading">
                  <div>
                    <h2>Xem danh sách đặt phòng</h2>
                    <p>Quản lý các lượt đặt phòng, khách vãng lai, số tiền đặt cọc và trạng thái nhận phòng của khách hàng.</p>
                  </div>
                  <button type="button"><Icon name="plus" size={16} />Tạo đặt phòng trực tiếp</button>
                </div>
                <div className="receptionist-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Đặt phòng</th>
                        <th>Khách hàng</th>
                        <th>Loại phòng</th>
                        <th>Thời gian lưu trú</th>
                        <th>Thanh toán</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(([code, guest, room, roomNo, dates, payment, status]) => (
                        <tr key={code}>
                          <td><strong>{code}</strong></td>
                          <td>{guest}</td>
                          <td><strong>{room}</strong><small>Phòng {roomNo}</small></td>
                          <td>{dates}</td>
                          <td>{payment}</td>
                          <td><span className="receptionist-status">{status}</span></td>
                          <td><button className="receptionist-link-button" type="button">Chi tiết</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="receptionist-grid receptionist-actions-grid">
                {quickActions.map(([title, description, icon]) => (
                  <article className="receptionist-card receptionist-action-card" key={title}>
                    <span><Icon name={icon} /></span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </article>
                ))}
              </section>
            </div>

            <aside className="receptionist-side-column">
              <section className="receptionist-card">
                <div className="receptionist-card-heading compact">
                  <h2>Sơ đồ phòng</h2>
                  <button type="button"><Icon name="dots" size={16} /></button>
                </div>
                <div className="receptionist-room-bars">
                  {roomStatus.map(([label, count, type]) => (
                    <div key={label}>
                      <span><b>{count}</b>{label}</span>
                      <i><em className={type} style={{ width: `${Math.min(count, 80)}%` }} /></i>
                    </div>
                  ))}
                </div>
              </section>

              <section className="receptionist-card">
                <div className="receptionist-card-heading compact">
                  <h2>Yêu cầu dịch vụ</h2>
                  <button type="button"><Icon name="plus" size={16} /></button>
                </div>
                <div className="receptionist-request-list">
                  {serviceRequests.map(([title, room, owner]) => (
                    <article key={title}>
                      <strong>{title}</strong>
                      <span>{room} - Chuyển giao: {owner}</span>
                    </article>
                  ))}
                </div>
              </section>

              <section className="receptionist-card receptionist-shift-card">
                <h2>Trọng tâm hôm nay</h2>
                <p>Ưu tiên khách đến nhận phòng, đối soát tiền đặt cọc, xếp phòng trống sạch sẽ và phối hợp kiểm tra phòng trả.</p>
                <button type="button">Mở danh sách công việc</button>
              </section>
            </aside>
          </section>
        ) : (
          <section className="receptionist-content">
            <div className="receptionist-main-column">
              <section className="receptionist-card receptionist-bookings-card">
                <div className="receptionist-card-heading">
                  <div>
                    <h2>Housekeeping Tasks</h2>
                    <p>View dirty rooms after checkout and assign cleaning tasks to housekeeping.</p>
                  </div>
                  <button type="button" onClick={() => housekeepingBoardQuery.refetch()}>
                    Refresh
                  </button>
                </div>

                {housekeepingBoardQuery.isLoading ? (
                  <p>Loading housekeeping board...</p>
                ) : null}

                {housekeepingBoardQuery.isError ? (
                  <p>Cannot load housekeeping board. Please check backend connection.</p>
                ) : null}

                {!housekeepingBoardQuery.isLoading && !housekeepingBoardQuery.isError ? (
                  <>
                    <div className="receptionist-table-wrap" style={{ marginBottom: '16px' }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Room</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Assign</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roomsRequiringCleaning.map((room) => (
                            <tr key={room.id}>
                              <td><strong>{room.roomNumber}</strong></td>
                              <td>{room.roomType}</td>
                              <td><span className="receptionist-status pending">{room.status}</span></td>
                              <td>
                                <button
                                  className="receptionist-link-button"
                                  type="button"
                                  disabled={createTaskMutation.isPending}
                                  onClick={() => onAssignCleaningTask(room.roomNumber)}
                                >
                                  Assign Cleaning Task
                                </button>
                              </td>
                            </tr>
                          ))}
                          {!roomsRequiringCleaning.length ? (
                            <tr>
                              <td colSpan={4}>No dirty rooms waiting for assignment.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>

                    <div className="receptionist-card" style={{ border: '1px solid #f3f4f6', boxShadow: 'none' }}>
                      <div className="receptionist-card-heading compact">
                        <h2>Create Cleaning Task</h2>
                      </div>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        <label>
                          <span>Room</span>
                          <select
                            value={selectedRoomNumber}
                            onChange={(event) => setSelectedRoomNumber(event.target.value)}
                            style={{ width: '100%', marginTop: '6px', padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb' }}
                          >
                            {roomsRequiringCleaning.map((room) => (
                              <option key={room.id} value={room.roomNumber}>{room.roomNumber}</option>
                            ))}
                          </select>
                        </label>

                        <label>
                          <span>Priority</span>
                          <select
                            value={priority}
                            onChange={(event) => setPriority(event.target.value)}
                            style={{ width: '100%', marginTop: '6px', padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb' }}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </label>

                        <label>
                          <span>Receptionist Notes</span>
                          <input
                            value={receptionistNote}
                            onChange={(event) => setReceptionistNote(event.target.value)}
                            placeholder="Notes for housekeeping"
                            style={{ width: '100%', marginTop: '6px', padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb' }}
                          />
                        </label>

                        <button
                          type="button"
                          disabled={createTaskMutation.isPending || !selectedRoomNumber}
                          onClick={() => onAssignCleaningTask()}
                        >
                          {createTaskMutation.isPending ? 'Assigning...' : 'Assign Cleaning Task'}
                        </button>
                      </div>
                    </div>
                  </>
                ) : null}
              </section>

              <section className="receptionist-card receptionist-bookings-card">
                <div className="receptionist-card-heading compact">
                  <h2>Housekeeping Tasks</h2>
                </div>
                <div className="receptionist-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Room</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Receptionist Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {housekeepingTasks.slice(0, 12).map((task) => (
                        <tr key={task.id}>
                          <td><strong>{task.roomNumber}</strong></td>
                          <td><span className={`receptionist-status ${toStatusClass(task.status)}`}>{task.status}</span></td>
                          <td>{task.priority}</td>
                          <td>{task.receptionistNote || 'No note'}</td>
                        </tr>
                      ))}
                      {!housekeepingTasks.length ? (
                        <tr>
                          <td colSpan={4}>No housekeeping tasks available.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <aside className="receptionist-side-column">
              <section className="receptionist-card">
                <div className="receptionist-card-heading compact">
                  <h2>Room Status (Live)</h2>
                </div>
                <div className="receptionist-room-bars">
                  <div>
                    <span><b>{roomCounts.available || 0}</b>Available</span>
                    <i><em className="available" style={{ width: `${Math.min(roomCounts.available || 0, 80)}%` }} /></i>
                  </div>
                  <div>
                    <span><b>{roomCounts.dirty || 0}</b>Dirty</span>
                    <i><em className="dirty" style={{ width: `${Math.min(roomCounts.dirty || 0, 80)}%` }} /></i>
                  </div>
                  <div>
                    <span><b>{roomCounts.cleaning || 0}</b>Cleaning</span>
                    <i><em className="occupied" style={{ width: `${Math.min(roomCounts.cleaning || 0, 80)}%` }} /></i>
                  </div>
                  <div>
                    <span><b>{roomCounts.maintenance || 0}</b>Maintenance</span>
                    <i><em className="maintenance" style={{ width: `${Math.min(roomCounts.maintenance || 0, 80)}%` }} /></i>
                  </div>
                </div>
              </section>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
};

export default ReceptionistDashboardPage;
