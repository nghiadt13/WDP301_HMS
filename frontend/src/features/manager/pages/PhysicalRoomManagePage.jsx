import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble, Plus, Search, Trash2, Pencil, Users, User, ArrowRight, Layers, SlidersHorizontal, Check, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRooms, useDeleteRoom, useRoomTypes, useUpdateRoom } from '../hooks/use-rooms';
import { managerApi } from '../services/manager-api';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import './room-manage.css';
import './physical-room-manage.css';

const fmtPrice = (v) => {
  if (!v && v !== 0) return '-';
  return v.toLocaleString('vi-VN');
};

const statusLabels = {
  Available: 'Trống (Available)',
  Occupied: 'Đang ở (Occupied)',
  Dirty: 'Chưa dọn (Dirty)',
  Cleaning: 'Đang dọn (Cleaning)',
  Maintenance: 'Bảo trì (Maintenance)',
};

const statusTones = {
  Available: 'is-available',
  Occupied: 'is-booked',
  Dirty: 'is-dirty',
  Cleaning: 'is-cleaning',
  Maintenance: 'is-maintenance',
};

const PhysicalRoomManagePage = () => {
  const navigate = useNavigate();
  
  // Queries
  const { data: roomsData, isLoading: roomsLoading, isError: roomsError, refetch: refetchRooms } = useRooms({ limit: 500 });
  const { data: rtData, isLoading: rtLoading } = useRoomTypes();
  const updateRoomMutation = useUpdateRoom();
  const deleteRoomMutation = useDeleteRoom();

  const rooms = roomsData?.data ?? [];
  const roomTypes = rtData?.data ?? [];

  // Local state
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [updatingMinibarId, setUpdatingMinibarId] = useState(null);

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Filter rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const nameMatch = !searchTerm.trim() || room.roomName.toLowerCase().includes(searchTerm.trim().toLowerCase());
      const statusMatch = !statusFilter || room.status === statusFilter;
      const typeId = typeof room.room_type_id === 'object' ? room.room_type_id?._id : room.room_type_id;
      const typeMatch = !typeFilter || typeId === typeFilter;
      return nameMatch && statusMatch && typeMatch;
    });
  }, [rooms, searchTerm, statusFilter, typeFilter]);

  const selectedRoom = rooms.find((r) => r._id === selectedRoomId) ?? filteredRooms[0];

  // Actions
  const handleEditRoom = (room) => {
    navigate(`/manager/rooms/${room._id}/edit`);
  };

  const handleDeleteRoomClick = (room) => {
    setDeleteTarget(room);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteRoomMutation.mutate(deleteTarget._id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setDeleteTarget(null);
        if (selectedRoomId === deleteTarget._id) setSelectedRoomId(null);
        refetchRooms();
      },
    });
  };

  const getMinibarItemId = (itemId) => {
    if (!itemId) return '';
    if (typeof itemId === 'object') return itemId._id || itemId.id || '';
    return String(itemId);
  };

  const handleStatusChange = (roomId, newStatus) => {
    const targetRoom = rooms.find(r => r._id === roomId);
    if (!targetRoom) return;
    const payload = { 
      roomName: targetRoom.roomName,
      room_type_id: typeof targetRoom.room_type_id === 'object' ? targetRoom.room_type_id?._id : targetRoom.room_type_id,
      description: targetRoom.description,
      isActive: targetRoom.isActive,
      status: newStatus,
      currentGuest: newStatus !== 'Occupied' ? '' : targetRoom.currentGuest,
      minibar: (targetRoom.minibar || []).map(m => ({
        item_id: getMinibarItemId(m.item_id),
        quantity: m.quantity || 0
      }))
    };
    updateRoomMutation.mutate({ id: roomId, data: payload }, {
      onSuccess: () => {
        refetchRooms();
      },
      onError: (err) => {
        const msg = err.response?.data?.message || 'Không thể cập nhật trạng thái phòng.';
        toast.error(msg);
      }
    });
  };

  const handleGuestNameChange = (roomId, name) => {
    const targetRoom = rooms.find(r => r._id === roomId);
    if (!targetRoom) return;
    const payload = { 
      roomName: targetRoom.roomName,
      room_type_id: typeof targetRoom.room_type_id === 'object' ? targetRoom.room_type_id?._id : targetRoom.room_type_id,
      description: targetRoom.description,
      isActive: targetRoom.isActive,
      status: targetRoom.status,
      currentGuest: name,
      minibar: (targetRoom.minibar || []).map(m => ({
        item_id: getMinibarItemId(m.item_id),
        quantity: m.quantity || 0
      }))
    };
    updateRoomMutation.mutate({ id: roomId, data: payload }, {
      onSuccess: () => {
        refetchRooms();
      },
      onError: (err) => {
        const msg = err.response?.data?.message || 'Không thể cập nhật tên khách.';
        toast.error(msg);
      }
    });
  };

  const handleMinibarQtyChange = (item, newQty) => {
    if (newQty < 0) return;
    setUpdatingMinibarId(item._id);
    try {
      const updatedMinibar = (selectedRoom.minibar || []).map(m => {
        const mId = getMinibarItemId(m.item_id);
        const targetId = getMinibarItemId(item);
        if (mId && targetId && mId === targetId) {
          return { item_id: mId, quantity: newQty };
        }
        return { item_id: mId, quantity: m.quantity || 0 };
      });

      const payload = {
        roomName: selectedRoom.roomName,
        room_type_id: typeof selectedRoom.room_type_id === 'object' ? selectedRoom.room_type_id?._id : selectedRoom.room_type_id,
        description: selectedRoom.description,
        isActive: selectedRoom.isActive,
        status: selectedRoom.status,
        currentGuest: selectedRoom.currentGuest,
        minibar: updatedMinibar
      };

      updateRoomMutation.mutate({ id: selectedRoom._id, data: payload }, {
        onSuccess: () => {
          refetchRooms();
        },
        onError: (err) => {
          const msg = err.response?.data?.message || 'Không thể cập nhật số lượng đồ dùng.';
          toast.error(msg);
        },
        onSettled: () => {
          setUpdatingMinibarId(null);
        }
      });
    } catch (err) {
      console.error('Error updating room minibar item quantity:', err);
      setUpdatingMinibarId(null);
    }
  };

  // Loading/Error Views
  if (roomsLoading || rtLoading) {
    return (
      <div className="rm-content-row" style={{ justifyContent: 'center', padding: '4rem' }}>
        <p>Đang tải danh sách phòng vật lý...</p>
      </div>
    );
  }

  if (roomsError) {
    return (
      <div className="rm-content-row" style={{ justifyContent: 'center', padding: '4rem' }}>
        <p>Lỗi tải danh sách phòng vật lý. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rm-content-row">
        {/* Left: Rooms Grid List */}
        <div className="rm-list-panel">
          <div className="rm-list-toolbar">
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>Quản lý danh sách phòng</h2>
            <div className="rm-list-toolbar-actions">
              <button type="button" className="rm-add-btn" onClick={() => navigate('/manager/rooms/add')}>
                <Plus size={14} /> Thêm phòng mới
              </button>
            </div>
          </div>

          {/* Filtering Bar */}
          <div className="rm-filter-bar">
            <div className="rm-search-wrapper">
              <Search size={16} className="rm-search-icon" />
              <input
                type="text"
                placeholder="Tìm số phòng (VD: R101)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rm-search-input"
              />
            </div>
            
            <div className="rm-filter-selects">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rm-select-filter"
              >
                <option value="">-- Tất cả trạng thái --</option>
                <option value="Available">Trống (Available)</option>
                <option value="Occupied">Đang ở (Occupied)</option>
                <option value="Dirty">Chưa dọn (Dirty)</option>
                <option value="Cleaning">Đang dọn (Cleaning)</option>
                <option value="Maintenance">Bảo trì (Maintenance)</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rm-select-filter"
              >
                <option value="">-- Tất cả loại phòng --</option>
                {roomTypes.map((rt) => (
                  <option key={rt._id} value={rt._id}>{rt.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="rm-grid-container">
            {filteredRooms.length === 0 ? (
              <div className="rm-empty-state">
                <p>Không tìm thấy phòng nào phù hợp bộ lọc.</p>
              </div>
            ) : (
              <div className="rm-rooms-grid">
                {filteredRooms.map((room) => {
                  const typeName = typeof room.room_type_id === 'object' ? room.room_type_id?.name : 'Chưa rõ';
                  const isSelected = selectedRoom?._id === room._id;
                  return (
                    <div
                      key={room._id}
                      onClick={() => setSelectedRoomId(room._id)}
                      className={`rm-grid-room-card ${isSelected ? 'is-selected' : ''} ${statusTones[room.status] || ''}`}
                    >
                      <div className="rm-grid-room-card-header">
                        <h3>{room.roomName}</h3>
                        <span className={`rm-status-indicator ${statusTones[room.status] || ''}`} />
                      </div>
                      <div className="rm-grid-room-card-body">
                        <p className="rm-room-type">{typeName}</p>
                        <p className="rm-room-status-text">{statusLabels[room.status] || room.status}</p>
                        {room.status === 'Occupied' && (
                          <div className="rm-room-occupant">
                            <User size={12} />
                            <span>{room.currentGuest || 'Khách vãng lai'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Room Detail & Minibar Management */}
        <div className="rm-detail-panel">
          {selectedRoom ? (
            <div className="rm-detail">
              <div className="rm-detail-top">
                <h2 style={{ fontSize: '22px', fontWeight: '800' }}>
                  Phòng {selectedRoom.roomName}
                  <span className="rm-room-type-tag" style={{ marginLeft: '12px' }}>
                    {typeof selectedRoom.room_type_id === 'object' ? selectedRoom.room_type_id?.name : 'Chưa rõ'}
                  </span>
                </h2>
                <div className="rm-detail-actions">
                  <button type="button" className="rm-icon-btn rm-icon-edit" onClick={() => handleEditRoom(selectedRoom)} title="Sửa thông tin phòng">
                    <Pencil size={14} />
                  </button>
                  <button type="button" className="rm-icon-btn rm-icon-delete" onClick={() => handleDeleteRoomClick(selectedRoom)} title="Xóa phòng">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Status Section */}
              <div className="rm-detail-section">
                <h3>Trạng thái phòng</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div className={`rm-status-badge ${statusTones[selectedRoom.status] || ''}`}>
                    {statusLabels[selectedRoom.status] || selectedRoom.status}
                  </div>
                  <div className="rm-status-updater">
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563' }}>Cập nhật trạng thái:</label>
                    <select
                      value={selectedRoom.status}
                      onChange={(e) => handleStatusChange(selectedRoom._id, e.target.value)}
                      className="rm-status-select"
                    >
                      <option value="Available">Trống (Available)</option>
                      <option value="Occupied">Đang ở (Occupied)</option>
                      <option value="Dirty">Chưa dọn (Dirty)</option>
                      <option value="Cleaning">Đang dọn (Cleaning)</option>
                      <option value="Maintenance">Bảo trì (Maintenance)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Guest Occupant Section */}
              <div className="rm-detail-section">
                <h3>Thông tin khách lưu trú</h3>
                {selectedRoom.status === 'Occupied' ? (
                  <div className="rm-guest-input-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e3a8a', fontWeight: '600', marginBottom: '8px' }}>
                      <User size={16} />
                      <span>Khách đang cư trú</span>
                    </div>
                    <input
                      type="text"
                      className="rm-guest-input"
                      placeholder="Nhập tên khách cư trú..."
                      value={selectedRoom.currentGuest || ''}
                      onChange={(e) => handleGuestNameChange(selectedRoom._id, e.target.value)}
                    />
                    <small style={{ color: '#6b7280', display: 'block', marginTop: '4px' }}>Tên khách sẽ tự động cập nhật trong hệ thống.</small>
                  </div>
                ) : (
                  <div className="rm-guest-empty-card">
                    <Users size={20} style={{ color: '#9ca3af' }} />
                    <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: '14px' }}>Không có khách lưu trú (Phòng trống)</p>
                  </div>
                )}
              </div>

              {/* Minibar Stock Section */}
              <div className="rm-detail-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0 }}>Kho đồ dùng Minibar trong phòng</h3>
                  <button type="button" onClick={refetchRooms} className="rm-refresh-btn">
                    <RefreshCw size={12} /> Làm mới
                  </button>
                </div>
                
                {!selectedRoom.minibar || selectedRoom.minibar.length === 0 ? (
                  <p style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '13px' }}>Chưa cấu hình đồ dùng minibar nào.</p>
                ) : (
                  <div className="rm-minibar-table-wrap">
                    <table className="rm-minibar-table">
                      <thead>
                        <tr>
                          <th>Vật phẩm</th>
                          <th>Danh mục</th>
                          <th>Giá bán</th>
                          <th style={{ width: '130px', textAlign: 'center' }}>Số lượng tồn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRoom.minibar.map((entry) => {
                          const item = entry.item_id;
                          if (!item) return null;
                          const isUpdating = updatingMinibarId === item._id;
                          const qty = entry.quantity || 0;
                          return (
                            <tr key={item._id}>
                              <td>
                                <strong style={{ color: '#1f2937' }}>{item.name}</strong>
                                {item.description && <span style={{ display: 'block', fontSize: '11px', color: '#6b7280', fontWeight: '400' }}>{item.description}</span>}
                              </td>
                              <td><span className="rm-minibar-cat-badge">{item.category}</span></td>
                              <td><span style={{ fontWeight: '600', color: '#0f172a' }}>{fmtPrice(item.price)}đ</span></td>
                              <td>
                                <div className="rm-qty-editor">
                                  <button
                                    type="button"
                                    onClick={() => handleMinibarQtyChange(item, qty - 1)}
                                    disabled={isUpdating || qty <= 0}
                                    className="rm-qty-btn"
                                  >
                                    -
                                  </button>
                                  <span className="rm-qty-val">
                                    {isUpdating ? '...' : qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleMinibarQtyChange(item, qty + 1)}
                                    disabled={isUpdating}
                                    className="rm-qty-btn"
                                  >
                                    +
                                  </button>
                                </div>
                                <div style={{ textAlign: 'center', marginTop: '4px' }}>
                                  <span className={`rm-stock-status-pill ${qty === 0 ? 'out_of_stock' : qty <= 5 ? 'low_stock' : 'in_stock'}`}>
                                    {qty === 0 ? 'Hết hàng' : qty <= 5 ? 'Sắp hết' : 'Còn hàng'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rm-detail-empty">Chọn một phòng để xem chi tiết & cập nhật minibar</div>
          )}
        </div>
      </div>

      {/* Confirmation Modals */}
      <DeleteConfirmModal
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        onConfirm={handleConfirmDelete}
        roomName={deleteTarget?.roomName}
        isDeleting={deleteRoomMutation.isPending}
      />
    </>
  );
};

export default PhysicalRoomManagePage;
