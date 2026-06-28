import { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { useRoomTypes, useAmenities, useFeatures } from '../hooks/use-rooms';
import { uploadApi } from '../services/room-api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:9999';

/** Convert a backend-relative URL to a full URL the browser can load */
const toFullUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
};

const defaultValues = {
  roomName: '',
  room_type_id: '',
  description: '',
  price: '',
  status: 'Available',
  images: [],
  amenity_ids: [],
  feature_ids: [],
};

function RoomFormModal({ isOpen, onClose, onSubmit, room, isSubmitting }) {
  const [form, setForm] = useState(defaultValues);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { data: rtData } = useRoomTypes();
  const { data: amData } = useAmenities();
  const { data: ftData } = useFeatures();
  const roomTypes = rtData?.data ?? [];
  const amenities = amData?.data ?? [];
  const features = ftData?.data ?? [];

  const isEdit = !!room;

  useEffect(() => {
    if (room) {
      setForm({
        roomName: room.roomName || '',
        room_type_id: room.room_type_id?._id || room.room_type_id || '',
        description: room.description || '',
        price: room.price ?? '',
        status: room.status || 'Available',
        images: room.images || [],
        amenity_ids: (room.amenity_ids || []).map((a) => typeof a === 'string' ? a : a._id),
        feature_ids: (room.feature_ids || []).map((f) => typeof f === 'string' ? f : f._id),
      });
    } else {
      setForm(defaultValues);
    }
    setErrors({});
  }, [room, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleAmenityToggle = (id) => {
    setForm((prev) => {
      const exists = prev.amenity_ids.includes(id);
      return {
        ...prev,
        amenity_ids: exists
          ? prev.amenity_ids.filter((a) => a !== id)
          : [...prev.amenity_ids, id],
      };
    });
  };

  const handleFeatureToggle = (id) => {
    setForm((prev) => {
      const exists = prev.feature_ids.includes(id);
      return {
        ...prev,
        feature_ids: exists
          ? prev.feature_ids.filter((f) => f !== id)
          : [...prev.feature_ids, id],
      };
    });
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const res = await uploadApi.uploadImage(file);
        uploadedUrls.push(res.data.url);
      }
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (err) {
      console.error('Upload failed:', err);
      const msg = err.response?.data?.message || 'Failed to upload image. Please try again.';
      alert(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.roomName.trim()) errs.roomName = 'Room name is required';
    if (!form.room_type_id) errs.room_type_id = 'Room type is required';
    if (!form.price || Number(form.price) < 0) errs.price = 'Valid price required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      roomName: form.roomName.trim(),
      room_type_id: form.room_type_id,
      description: form.description.trim(),
      price: Number(form.price),
      status: form.status,
      images: form.images,
      amenity_ids: form.amenity_ids,
      feature_ids: form.feature_ids,
    };

    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="rm-modal-overlay" onClick={onClose}>
      <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rm-modal-header">
          <h3>{isEdit ? 'Edit Room' : 'Add New Room'}</h3>
          <button type="button" className="rm-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="rm-modal-body" onSubmit={handleSubmit}>
          <div className="rm-form-grid">
            {/* Room Name */}
            <div className="rm-form-group">
              <label>Room Name *</label>
              <input name="roomName" value={form.roomName} onChange={handleChange} placeholder="e.g. R101, R202" />
              {errors.roomName && <span className="rm-form-error">{errors.roomName}</span>}
            </div>

            {/* Room Type (dropdown) */}
            <div className="rm-form-group">
              <label>Room Type *</label>
              <select name="room_type_id" value={form.room_type_id} onChange={handleChange}>
                <option value="">-- Select type --</option>
                {roomTypes.map((rt) => (
                  <option key={rt._id} value={rt._id}>{rt.name}</option>
                ))}
              </select>
              {errors.room_type_id && <span className="rm-form-error">{errors.room_type_id}</span>}
            </div>

            {/* Price */}
            <div className="rm-form-group">
              <label>Price (VND) *</label>
              <input name="price" type="number" min="0" step="1000" value={form.price} onChange={handleChange} placeholder="e.g. 800000" />
              {errors.price && <span className="rm-form-error">{errors.price}</span>}
            </div>

            {/* Status — only show when editing */}
            {isEdit && (
              <div className="rm-form-group">
                <label>Status</label>
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="OutOfService">Out of Service</option>
                </select>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="rm-form-group">
            <label>Description</label>
            <textarea name="description" rows="3" value={form.description} onChange={handleChange} placeholder="Room description..." />
          </div>

          {/* Image Upload */}
          <div className="rm-form-group">
            <label>Images</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="rm-btn-upload"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>Uploading...</>
              ) : (
                <>
                  <Upload size={14} /> Choose Images
                </>
              )}
            </button>
            {form.images.length > 0 && (
              <div className="rm-image-preview-grid">
                {form.images.map((url, i) => (
                  <div key={i} className="rm-image-preview-item">
                    <img src={toFullUrl(url)} alt={`Room image ${i + 1}`} />
                    <button
                      type="button"
                      className="rm-image-remove-btn"
                      onClick={() => handleRemoveImage(i)}
                      title="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Amenities (checkboxes) */}
          <div className="rm-form-group">
            <label>Amenities</label>
            <div className="rm-amenity-grid">
              {amenities.map((a) => (
                <label key={a._id} className="rm-amenity-check">
                  <input
                    type="checkbox"
                    checked={form.amenity_ids.includes(a._id)}
                    onChange={() => handleAmenityToggle(a._id)}
                  />
                  <span>{a.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Features (checkboxes from DB) */}
          <div className="rm-form-group">
            <label>Features</label>
            <div className="rm-amenity-grid">
              {features.map((f) => (
                <label key={f._id} className="rm-amenity-check">
                  <input
                    type="checkbox"
                    checked={form.feature_ids.includes(f._id)}
                    onChange={() => handleFeatureToggle(f._id)}
                  />
                  <span>{f.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rm-modal-footer">
            <button type="button" className="rm-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="rm-btn-save" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Room' : 'Add Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RoomFormModal;
