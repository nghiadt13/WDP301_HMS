import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble, Plus, SlidersHorizontal, Check, Users, DollarSign, Trash2, Pencil, Maximize, Home } from 'lucide-react';
import { useRooms, useDeleteRoom } from '../hooks/use-rooms';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import './room-manage.css';

// ─── Social Icons ──────────────────────────────────────────────
const FacebookIcon = () => (
  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
);
const TwitterIcon = () => (
  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" /></svg>
);
const InstagramIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
);
const YoutubeIcon = () => (
  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.47A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z" /><polygon fill="white" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" /></svg>
);
const LinkedinIcon = () => (
  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
);

// ─── Fallback images ──────────────────────────────────────────
const fallbackImages = [
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&q=80',
  'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=200&q=80',
  'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=200&q=80',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&q=80',
];

// ─── Helpers ──────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:9999';
const toFullUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
};

const fmtPrice = (v) => {
  if (!v && v !== 0) return '-';
  return v.toLocaleString('vi-VN');
};

const getRoomType = (room) => (typeof room.room_type_id === 'object' ? room.room_type_id : null);
const getRoomTypeKey = (room) => getRoomType(room)?._id || room.room_type_id || 'unknown';
const getRoomTypeName = (room) => getRoomType(room)?.name || 'Loại phòng không xác định';

const groupRoomsByType = (rooms) => {
  const map = new Map();

  rooms.forEach((room) => {
    const key = getRoomTypeKey(room);
    const type = getRoomType(room);

    if (!map.has(key)) {
      map.set(key, {
        key,
        type,
        rooms: [],
      });
    }

    map.get(key).rooms.push(room);
  });

  return Array.from(map.values()).map((group) => ({
    ...group,
    rooms: [...group.rooms].sort((first, second) =>
      String(first.roomName || '').localeCompare(String(second.roomName || ''), 'en', {
        numeric: true,
        sensitivity: 'base',
      })
    ),
  }));
};

// ─── Room Card ─────────────────────────────────────────────────
function RoomCard({ room, selected, onClick, onEdit, onDelete }) {
  const img = toFullUrl(room.images?.[0]) || fallbackImages[0];
  const isAvailable = room.status === 'Available';

  // Populated from room_type_id
  const rt = room.room_type_id;
  const typeName = typeof rt === 'object' ? rt?.name : '';
  const bedType = typeof rt === 'object' ? rt?.bed_type : '';
  const capacity = typeof rt === 'object' ? rt?.capacity : '';

  return (
    <div onClick={onClick} className={`rm-room-card${selected ? ' is-selected' : ''}`}>
      <img src={img} alt={room.roomName} className="rm-room-card-img" />
      <div className="rm-room-card-body">
        <div className="rm-room-card-top">
          <h3>{room.roomName} <span className="rm-room-type-tag">{typeName}</span></h3>
          <div className="rm-room-card-status-wrap">
            <span className={`rm-status-badge${isAvailable ? ' is-available' : ' is-booked'}`}>{room.status === 'Available' ? 'Trống' : 'Đang sử dụng'}</span>
          </div>
        </div>
        <p className="rm-room-card-desc">{room.description}</p>
        <div className="rm-room-card-bottom">
          <div className="rm-room-card-meta">
            {bedType && <span><BedDouble size={12} />{bedType}</span>}
            {capacity && <span><Users size={12} />{capacity} khách</span>}
            <span><DollarSign size={12} />{fmtPrice(room.price)}đ</span>
          </div>
          <div className="rm-room-card-actions">
            <div className="rm-room-card-btns">
              <button type="button" className="rm-icon-btn rm-icon-edit" onClick={(e) => { e.stopPropagation(); onEdit(room); }} title="Sửa">
                <Pencil size={13} />
              </button>
              <button type="button" className="rm-icon-btn rm-icon-delete" onClick={(e) => { e.stopPropagation(); onDelete(room); }} title="Xóa">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section ───────────────────────────────────────────────────
function Section({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rm-section">
      <h4>{title}</h4>
      <div className="rm-section-grid">
        {items.map((item, i) => (
          <div key={i} className="rm-section-item"><Check size={12} className="text-blue-600" />{item}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Room Detail ───────────────────────────────────────────────
function RoomDetail({ room, onEdit, onDelete }) {
  const images = room.images?.length > 0 ? room.images.map(toFullUrl) : fallbackImages;

  const rt = room.room_type_id;
  const typeName = typeof rt === 'object' ? rt?.name : '';
  const bedType = typeof rt === 'object' ? rt?.bed_type : '';
  const capacity = typeof rt === 'object' ? rt?.capacity : '';
  const typeDesc = typeof rt === 'object' ? rt?.description : '';

  const amenityNames = (room.amenity_ids || [])
    .map((a) => (typeof a === 'object' ? a.name : ''))
    .filter(Boolean);

  const featureNames = (room.feature_ids || [])
    .map((f) => (typeof f === 'object' ? f.name : ''))
    .filter(Boolean);

  return (
    <div className="rm-detail">
      <div className="rm-detail-top">
        <h2>{room.roomName} <span className="rm-room-type-tag">{typeName}</span></h2>
        <div className="rm-detail-actions">
          <button type="button" className="rm-icon-btn rm-icon-edit" onClick={() => onEdit(room)} title="Sửa">
            <Pencil size={13} />
          </button>
          <button type="button" className="rm-icon-btn rm-icon-delete" onClick={() => onDelete(room)} title="Xóa">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <div className="rm-detail-status-row">
        <span className={`rm-status-badge${room.status === 'Available' ? ' is-available' : ' is-booked'}`}>{room.status === 'Available' ? 'Trống' : 'Đang sử dụng'}</span>
      </div>
      <div className="rm-detail-main-img">
        <img src={images[0]} alt="room main" />
      </div>
      <div className="rm-detail-thumbs">
        {images.slice(1).map((img, i) => (
          <img key={i} src={img} alt="" />
        ))}
      </div>
      <div className="rm-detail-stats">
        {bedType && <span><BedDouble size={12} />{bedType}</span>}
        {capacity && <span><Users size={12} />{capacity} khách</span>}
        <span><b>{fmtPrice(room.price)}đ</b> /đêm</span>
      </div>
      <p className="rm-detail-desc">{room.description || typeDesc}</p>
      <Section title="Tiện nghi" items={amenityNames} />
      <Section title="Đặc điểm" items={featureNames} />
    </div>
  );
}

function RoomTypeCard({ group, selected, onClick }) {
  const sampleRoom = group.rooms[0] || {};
  const type = group.type || {};
  const img = toFullUrl(type.images?.[0] || sampleRoom.images?.[0]) || fallbackImages[0];
  const availableCount = group.rooms.filter((room) => room.status === 'Available').length;
  const totalCount = group.rooms.length || 1;
  const percentage = Math.round((availableCount / totalCount) * 100);

  // Dynamic values
  const name = type.name || getRoomTypeName(sampleRoom);
  const description = type.description || sampleRoom.description || 'Không có mô tả.';
  const price = type.base_price || sampleRoom.price || 0;

  // Helper for Area
  const getArea = () => {
    if (type.area) return type.area.includes('m²') ? type.area : `${type.area} m²`;
    const nameLower = name.toLowerCase();
    if (nameLower.includes('suite')) return '55 m²';
    if (nameLower.includes('deluxe')) return '36 m²';
    if (nameLower.includes('family')) return '45 m²';
    if (nameLower.includes('executive')) return '40 m²';
    if (nameLower.includes('standard')) return '28 m²';
    return '32 m²';
  };

  // Helper for Bed Spec
  const getBedSpec = () => {
    if (type.beds && type.bed_type) {
      return `${type.beds} Giường ${type.bed_type}`;
    }
    const bed = type.bed_type || sampleRoom.bed_type || 'King';
    return `1 Giường ${bed}`;
  };

  // Helper for Guests/Capacity
  const getGuestsSpec = () => {
    const cap = type.capacity || 2;
    return `${cap} khách`;
  };

  return (
    <button type="button" onClick={onClick} className={`rm-room-card rm-type-card${selected ? ' is-selected' : ''}`}>
      <img src={img} alt={name} className="rm-type-card-img" />
      <div className="rm-type-card-body">
        <div className="rm-type-card-top">
          <h3 className="rm-type-card-title">{name}</h3>
          <div className="rm-type-card-status-wrap">
            <span className="rm-type-card-rooms-left">Còn {availableCount} phòng trống</span>
            <span className="rm-type-card-status-badge">Sẵn sàng</span>
          </div>
        </div>
        
        <p className="rm-type-card-desc">{description}</p>
        
        <div className="rm-type-card-price-row">
          <div className="rm-type-card-price">
            <span className="rm-type-price-symbol"></span>
            <span className="rm-type-price-val">{price < 10000 ? price : fmtPrice(price)}</span>
            <span className="rm-type-price-unit">{price < 10000 ? 'đ/đêm' : 'đ/đêm'}</span>
          </div>
        </div>

        <div className="rm-type-card-divider" />

        <div className="rm-type-card-bottom">
          <div className="rm-type-spec-item">
            <Maximize size={14} className="rm-spec-icon" />
            <span>{getArea()}</span>
          </div>
          <div className="rm-type-spec-item">
            <BedDouble size={14} className="rm-spec-icon" />
            <span>{getBedSpec()}</span>
          </div>
          <div className="rm-type-spec-item">
            <Users size={14} className="rm-spec-icon" />
            <span>{getGuestsSpec()}</span>
          </div>
          <div className="rm-type-spec-item">
            <Home size={14} className="rm-spec-icon" />
            <span>{availableCount} / {totalCount} Phòng – {percentage}%</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function RoomTypeDetail({ group, onEdit, onDelete }) {
  if (!group) {
    return <div className="rm-detail-empty">Chọn một loại phòng để xem chi tiết</div>;
  }

  const type = group.type || {};
  const sampleRoom = group.rooms[0] || {};
  const images = type.images?.length > 0 ? type.images.map(toFullUrl) : (sampleRoom.images || []).map(toFullUrl);
  const availableCount = group.rooms.filter((room) => room.status === 'Available').length;
  const occupiedCount = group.rooms.filter((room) => room.status === 'Occupied').length;
  const maintenanceCount = group.rooms.filter((room) => room.status === 'Maintenance').length;

  const totalCount = group.rooms.length;
  const occupancyPercentage = totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0;

  return (
    <div className="rm-detail">
      <div className="rm-detail-top" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>{type.name || getRoomTypeName(sampleRoom)}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Còn {availableCount} phòng trống</span>
          <span className="rm-status-badge is-available">Trống</span>
        </div>
      </div>
      
      {/* Progress Bar & Occupied Info */}
      <div className="rm-progress-track" style={{ marginBottom: '8px' }}>
        <div className="rm-progress-bar" style={{ width: `${occupancyPercentage}%` }} />
      </div>
      <p className="rm-detail-occ" style={{ marginBottom: '16px' }}>
        {occupiedCount} / {totalCount} Phòng – {occupancyPercentage}% Đang sử dụng
      </p>
      <div className="rm-detail-main-img">
        <img src={images[0] || fallbackImages[0]} alt={type.name || 'Loại phòng'} />
      </div>
      <div className="rm-detail-stats">
        {(type.bed_type || sampleRoom.bed_type) && <span><BedDouble size={12} />{type.bed_type || sampleRoom.bed_type}</span>}
        {type.capacity && <span><Users size={12} />{type.capacity} khách</span>}
        <span><b>{fmtPrice(type.base_price || sampleRoom.price)}đ</b> /đêm</span>
      </div>
      <p className="rm-detail-desc">{type.description || sampleRoom.description}</p>
      <Section title="Đặc điểm" items={type.features || []} />
      <Section title="Trang thiết bị" items={type.facilities || []} />

      <div className="rm-physical-room-list">
        <h4>Danh sách số phòng</h4>
        {group.rooms.map((room) => (
          <div className="rm-physical-room-row" key={room._id}>
            <div>
              <strong>{room.roomName}</strong>
              <span>{room.status}</span>
            </div>
            <div className="rm-room-card-btns">
              <button type="button" className="rm-icon-btn rm-icon-edit" onClick={() => onEdit(room)} title="Edit">
                <Pencil size={13} />
              </button>
              <button type="button" className="rm-icon-btn rm-icon-delete" onClick={() => onDelete(room)} title="Delete">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Footer ────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="rm-footer">
      <div className="rm-footer-links">
        <span>Bản quyền © 2026 Hotelify</span>
        <a href="#">Chính sách bảo mật</a>
        <a href="#">Điều khoản và điều kiện</a>
        <a href="#">Liên hệ</a>
      </div>
      <div className="rm-footer-social">
        <a href="#"><FacebookIcon /></a>
        <a href="#"><TwitterIcon /></a>
        <a href="#"><InstagramIcon /></a>
        <a href="#"><YoutubeIcon /></a>
        <a href="#"><LinkedinIcon /></a>
      </div>
    </footer>
  );
}

// ─── Page ──────────────────────────────────────────────────────
const RoomManagePage = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useRooms({ limit: 500 });
  const rooms = data?.data ?? [];
  const [selectedId, setSelectedId] = useState(null);
  const roomGroups = useMemo(() => groupRoomsByType(rooms), [rooms]);

  // Delete modal states
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Mutations
  const deleteMutation = useDeleteRoom();

  const selected = roomGroups.find((group) => group.key === selectedId) ?? roomGroups[0];

  // ─── Handlers ──────────────────────────────────────────────
  const handleAdd = () => {
    navigate('/manager/rooms/add');
  };

  const handleEdit = (room) => {
    navigate(`/manager/rooms/${room._id}/edit`);
  };

  const handleDelete = (room) => {
    setDeleteTarget(room);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget._id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setDeleteTarget(null);
        if (selected?.rooms?.some((room) => room._id === deleteTarget._id)) setSelectedId(null);
      },
    });
  };

  // ─── Loading / Error ───────────────────────────────────────
  if (isLoading) {
    return (
      <div className="rm-content-row" style={{ justifyContent: 'center', padding: '4rem' }}>
        <p>Đang tải danh sách phòng...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rm-content-row" style={{ justifyContent: 'center', padding: '4rem' }}>
        <p>Lỗi tải danh sách phòng. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rm-content-row">
        {/* Left: Room list */}
        <div className="rm-list-panel">
          <div className="rm-list-toolbar">
            <h2>Danh mục phòng</h2>
            <div className="rm-list-toolbar-actions">
              <button type="button" className="rm-add-btn" onClick={handleAdd}><Plus size={14} />Thêm phòng</button>
              <button type="button" className="rm-sort-btn"><SlidersHorizontal size={14} /></button>
            </div>
          </div>
          <div className="rm-list-cards">
            {roomGroups.map((group) => (
              <RoomTypeCard
                key={group.key}
                group={group}
                selected={selected?.key === group.key}
                onClick={() => setSelectedId(group.key)}
              />
            ))}
          </div>
        </div>
        {/* Right: Detail */}
        <div className="rm-detail-panel">
          {selected ? (
            <RoomTypeDetail group={selected} onEdit={handleEdit} onDelete={handleDelete} />
          ) : (
            <div className="rm-detail-empty">Chọn một loại phòng để xem chi tiết</div>
          )}
        </div>
      </div>
      <Footer />

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        onConfirm={handleConfirmDelete}
        roomName={deleteTarget?.roomName}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
};

export default RoomManagePage;
