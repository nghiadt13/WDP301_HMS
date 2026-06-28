import { useState } from 'react';
import { BedDouble, ChevronDown, Plus, SlidersHorizontal, Check, Maximize, Users, DollarSign, Pencil, Trash2 } from 'lucide-react';
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from '../hooks/use-rooms';
import RoomFormModal from '../components/RoomFormModal';
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
            <span className={`rm-status-badge${isAvailable ? ' is-available' : ' is-booked'}`}>{room.status}</span>
          </div>
        </div>
        <p className="rm-room-card-desc">{room.description}</p>
        <div className="rm-room-card-bottom">
          <div className="rm-room-card-meta">
            {bedType && <span><BedDouble size={12} />{bedType}</span>}
            {capacity && <span><Users size={12} />{capacity} guests</span>}
            <span><DollarSign size={12} />{fmtPrice(room.price)}đ</span>
          </div>
          <div className="rm-room-card-actions">
            <div className="rm-room-card-btns">
              <button type="button" className="rm-icon-btn rm-icon-edit" onClick={(e) => { e.stopPropagation(); onEdit(room); }} title="Edit">
                <Pencil size={13} />
              </button>
              <button type="button" className="rm-icon-btn rm-icon-delete" onClick={(e) => { e.stopPropagation(); onDelete(room); }} title="Delete">
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
          <button type="button" className="rm-icon-btn rm-icon-edit" onClick={() => onEdit(room)} title="Edit">
            <Pencil size={13} />
          </button>
          <button type="button" className="rm-icon-btn rm-icon-delete" onClick={() => onDelete(room)} title="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <div className="rm-detail-status-row">
        <span className={`rm-status-badge${room.status === 'Available' ? ' is-available' : ' is-booked'}`}>{room.status}</span>
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
        {capacity && <span><Users size={12} />{capacity} guests</span>}
        <span><DollarSign size={12} />{fmtPrice(room.price)}đ /đêm</span>
      </div>
      <p className="rm-detail-desc">{room.description || typeDesc}</p>
      <Section title="Amenities" items={amenityNames} />
      <Section title="Features" items={featureNames} />
    </div>
  );
}

// ─── Footer ────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="rm-footer">
      <div className="rm-footer-links">
        <span>Copyright © 2026 Hotelify</span>
        <a href="#">Privacy Policy</a>
        <a href="#">Term and conditions</a>
        <a href="#">Contact</a>
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
  const { data, isLoading, isError } = useRooms();
  const rooms = data?.data ?? [];
  const [selectedId, setSelectedId] = useState(null);

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Mutations
  const createMutation = useCreateRoom();
  const updateMutation = useUpdateRoom();
  const deleteMutation = useDeleteRoom();

  const selected = rooms.find((r) => r._id === selectedId) ?? rooms[0];

  // ─── Handlers ──────────────────────────────────────────────
  const handleAdd = () => {
    setEditRoom(null);
    setFormOpen(true);
  };

  const handleEdit = (room) => {
    setEditRoom(room);
    setFormOpen(true);
  };

  const handleDelete = (room) => {
    setDeleteTarget(room);
    setDeleteOpen(true);
  };

  const handleFormSubmit = (payload) => {
    if (editRoom) {
      updateMutation.mutate(
        { id: editRoom._id, data: payload },
        { onSuccess: () => { setFormOpen(false); setEditRoom(null); } }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: (res) => {
          setFormOpen(false);
          setSelectedId(res.data._id);
        },
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget._id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setDeleteTarget(null);
        if (selectedId === deleteTarget._id) setSelectedId(null);
      },
    });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ─── Loading / Error ───────────────────────────────────────
  if (isLoading) {
    return (
      <div className="rm-content-row" style={{ justifyContent: 'center', padding: '4rem' }}>
        <p>Loading rooms...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rm-content-row" style={{ justifyContent: 'center', padding: '4rem' }}>
        <p>Failed to load rooms. Please try again.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rm-content-row">
        {/* Left: Room list */}
        <div className="rm-list-panel">
          <div className="rm-list-toolbar">
            <h2>Room Category</h2>
            <div className="rm-list-toolbar-actions">
              <span>Sort by:</span>
              <button type="button" className="rm-filter-btn">Popular <ChevronDown size={12} /></button>
              <button type="button" className="rm-filter-btn">All Type <ChevronDown size={12} /></button>
              <button type="button" className="rm-add-btn" onClick={handleAdd}><Plus size={14} />Add Room</button>
              <button type="button" className="rm-sort-btn"><SlidersHorizontal size={14} /></button>
            </div>
          </div>
          <div className="rm-list-cards">
            {rooms.map((r) => (
              <RoomCard
                key={r._id}
                room={r}
                selected={selected?._id === r._id}
                onClick={() => setSelectedId(r._id)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
        {/* Right: Detail */}
        <div className="rm-detail-panel">
          {selected ? (
            <RoomDetail room={selected} onEdit={handleEdit} onDelete={handleDelete} />
          ) : (
            <div className="rm-detail-empty">Select a room to view details</div>
          )}
        </div>
      </div>
      <Footer />

      {/* Modals */}
      <RoomFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditRoom(null); }}
        onSubmit={handleFormSubmit}
        room={editRoom}
        isSubmitting={isSubmitting}
      />
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
