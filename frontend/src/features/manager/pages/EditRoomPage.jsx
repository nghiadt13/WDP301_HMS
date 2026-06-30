import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useRoom, useUpdateRoom, useRoomTypes, useAmenities, useFeatures } from '../hooks/use-rooms';
import { uploadApi } from '../services/room-api';
import './add-room.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:9999';
const toFullUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
};

const BED_TYPES = ['King Bed', 'Queen Bed', 'Twin Beds', 'Sofa Bed', 'Single Bed', 'Bunk Bed'];

const EditRoomPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const updateMutation = useUpdateRoom();
  const { data: roomData, isLoading: roomLoading } = useRoom(id);
  const { data: rtData } = useRoomTypes();
  const { data: amData } = useAmenities();
  const { data: ftData } = useFeatures();
  const roomTypes = rtData?.data ?? [];
  const amenities = amData?.data ?? [];
  const features = ftData?.data ?? [];

  const room = roomData?.data;

  const [form, setForm] = useState({
    roomName: '',
    room_type_id: '',
    description: '',
    price: '',
    bed_type: '',
    isActive: true,
    images: [],
    amenity_ids: [],
    feature_ids: [],
  });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [coverIndex, setCoverIndex] = useState(0);
  const fileInputRef = useRef(null);

  // ─── Pre-populate form from fetched room data ──────────────────
  useEffect(() => {
    if (!room) return;
    setForm({
      roomName: room.roomName || '',
      room_type_id: typeof room.room_type_id === 'object' ? room.room_type_id?._id : room.room_type_id || '',
      description: room.description || '',
      price: room.price ?? '',
      bed_type: room.bed_type || '',
      isActive: room.isActive ?? true,
      images: room.images || [],
      amenity_ids: (room.amenity_ids || []).map((a) => (typeof a === 'object' ? a._id : a)),
      feature_ids: (room.feature_ids || []).map((f) => (typeof f === 'object' ? f._id : f)),
    });
  }, [room]);

  // ─── Handlers ────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleStatusChange = (val) => {
    setForm((prev) => ({ ...prev, isActive: val }));
  };

  const handleAmenityToggle = (id) => {
    setForm((prev) => ({
      ...prev,
      amenity_ids: prev.amenity_ids.includes(id)
        ? prev.amenity_ids.filter((a) => a !== id)
        : [...prev.amenity_ids, id],
    }));
  };

  const handleFeatureToggle = (id) => {
    setForm((prev) => ({
      ...prev,
      feature_ids: prev.feature_ids.includes(id)
        ? prev.feature_ids.filter((f) => f !== id)
        : [...prev.feature_ids, id],
    }));
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

  const handleRemoveImage = async (index) => {
    const imageUrl = form.images[index];
    const filename = imageUrl.split('/').pop();

    setForm((prev) => {
      const newImages = prev.images.filter((_, i) => i !== index);
      if (index <= coverIndex) {
        setCoverIndex(Math.min(coverIndex, newImages.length - 1));
      }
      return { ...prev, images: newImages };
    });

    try {
      await uploadApi.deleteImage(filename);
    } catch (err) {
      console.error('Failed to delete image file:', err);
    }
  };

  const handleCoverSelect = (index) => {
    setCoverIndex(index);
  };

  const validate = () => {
    const errs = {};
    if (!form.roomName.trim()) errs.roomName = 'Room name is required';
    if (!form.room_type_id) errs.room_type_id = 'Room type is required';
    const priceNum = Number(form.price);
    if (!form.price || isNaN(priceNum) || priceNum < 0) errs.price = 'Valid price is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      roomName: form.roomName.trim(),
      room_type_id: form.room_type_id,
      description: form.description.trim(),
      price: Number(form.price),
      bed_type: form.bed_type,
      isActive: form.isActive,
      images: form.images,
      amenity_ids: form.amenity_ids,
      feature_ids: form.feature_ids,
    };

    updateMutation.mutate({ id, data: payload }, {
      onSuccess: () => {
        navigate('/manager/rooms');
      },
      onError: (err) => {
        const msg = err.response?.data?.message || 'Failed to update room. Please try again.';
        alert(msg);
      },
    });
  };

  const isSubmitting = updateMutation.isPending;

  // ─── Loading state ─────────────────────────────────────────────
  if (roomLoading) {
    return (
      <div className="ar-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p>Loading room data...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="ar-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p>Room not found.</p>
      </div>
    );
  }

  return (
    <div className="ar-page">
      {/* Header */}
      <div className="ar-header">
        <button type="button" className="ar-back-btn" onClick={() => navigate('/manager/rooms')}>
          <ArrowLeft size={16} /> Back to Rooms
        </button>
        <h1>Edit Room</h1>
      </div>

      {/* Two-column grid */}
      <div className="ar-grid">
        {/* ── Left Column ─────────────────────────────────────── */}
        <div className="ar-col">
          {/* Basic Information */}
          <div className="ar-card">
            <div className="ar-card-header">
              <span className="ar-card-title">Basic Information</span>
              <div className="ar-card-actions">
                <button type="button" className="ar-btn-save" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Room'}
                </button>
                <button type="button" className="ar-btn-cancel" onClick={() => navigate('/manager/rooms')} title="Cancel">
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Room Name */}
            <div className="ar-field">
              <label className="ar-label">Room Name *</label>
              <input
                className="ar-input"
                type="text"
                name="roomName"
                value={form.roomName}
                onChange={handleChange}
                placeholder="e.g. R101, Premier Garden Suite"
              />
              {errors.roomName && <div className="ar-error">{errors.roomName}</div>}
            </div>

            {/* Room Type */}
            <div className="ar-field">
              <label className="ar-label">Room Type *</label>
              <select
                className="ar-select"
                name="room_type_id"
                value={form.room_type_id}
                onChange={handleChange}
              >
                <option value="">-- Select type --</option>
                {roomTypes.map((rt) => (
                  <option key={rt._id} value={rt._id}>{rt.name}</option>
                ))}
              </select>
              {errors.room_type_id && <div className="ar-error">{errors.room_type_id}</div>}
            </div>

            {/* About Room */}
            <div className="ar-field">
              <label className="ar-label">About Room</label>
              <textarea
                className="ar-textarea"
                name="description"
                rows="5"
                value={form.description}
                onChange={handleChange}
                placeholder="Room description..."
              />
            </div>

            {/* Availability Status */}
            <div className="ar-field">
              <label className="ar-label">Availability Status</label>
              <div className="ar-radio-group">
                <label className="ar-radio-label">
                  <input
                    type="radio"
                    name="status"
                    className="ar-radio"
                    checked={form.isActive === true}
                    onChange={() => handleStatusChange(true)}
                  />
                  Active
                </label>
                <label className="ar-radio-label">
                  <input
                    type="radio"
                    name="status"
                    className={`ar-radio${form.isActive === false ? '' : ' unchecked'}`}
                    checked={form.isActive === false}
                    onChange={() => handleStatusChange(false)}
                  />
                  Inactive
                </label>
              </div>
            </div>

            {/* Bed Type */}
            <div className="ar-field">
              <label className="ar-label">Bed Type</label>
              <select
                className="ar-select"
                name="bed_type"
                value={form.bed_type}
                onChange={handleChange}
              >
                <option value="">-- Select bed type --</option>
                {BED_TYPES.map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="ar-card">
            <div className="ar-card-header">
              <span className="ar-card-title">Pricing</span>
            </div>

            {/* Base Price */}
            <div className="ar-field">
              <label className="ar-label">Base Price</label>
              <div className="ar-price-row">
                <input
                  className="ar-input"
                  type="text"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="e.g. 270"
                />
                <span className="ar-price-badge">/ Night</span>
              </div>
              {errors.price && <div className="ar-error">{errors.price}</div>}
            </div>
          </div>
        </div>

        {/* ── Right Column ────────────────────────────────────── */}
        <div className="ar-col">
          {/* Media */}
          <div className="ar-card">
            <div className="ar-card-header">
              <span className="ar-card-title">Media</span>
            </div>

            {/* Drop zone */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <div className="ar-drop-zone" onClick={() => fileInputRef.current?.click()}>
              <Upload size={36} className="ar-drop-zone-icon" />
              <p>{uploading ? 'Uploading...' : 'Drag and drop to upload Photo'}</p>
              {!uploading && <p className="ar-drop-hint">or</p>}
              {!uploading && (
                <button type="button" className="ar-drop-upload-btn" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  Upload Photo
                </button>
              )}
              <p className="ar-drop-note">
                ① Up to 5 MB per image in JPG, PNG, WEBP<br />
                (Recommended: at least 4 images: bedroom, bathroom, view, and living area)
              </p>
            </div>

            {/* Thumbnails */}
            {form.images.length > 0 && (
              <>
                <div className="ar-thumbs-label">Uploaded Files and Select The Cover Image</div>
                <div className="ar-thumbs-row">
                  {form.images.map((url, i) => (
                    <div
                      key={i}
                      className={`ar-thumb${coverIndex === i ? ' is-cover' : ''}`}
                      onClick={() => handleCoverSelect(i)}
                    >
                      <img src={toFullUrl(url)} alt={`Room image ${i + 1}`} />
                      <button
                        type="button"
                        className="ar-thumb-remove"
                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(i); }}
                        title="Remove image"
                      >
                        <X size={10} />
                      </button>
                      {coverIndex === i && <div className="ar-thumb-cover">Cover</div>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Amenities & Features */}
          <div className="ar-card">
            <div className="ar-card-header">
              <span className="ar-card-title">Amenities & Features</span>
            </div>

            {/* Amenities */}
            <div className="ar-field">
              <label className="ar-label">Amenities</label>
              <div className="ar-checkbox-grid">
                {amenities.map((a) => (
                  <label key={a._id} className="ar-checkbox-label">
                    <input
                      type="checkbox"
                      className="ar-checkbox"
                      checked={form.amenity_ids.includes(a._id)}
                      onChange={() => handleAmenityToggle(a._id)}
                    />
                    <span>{a.name}</span>
                  </label>
                ))}
                {amenities.length === 0 && <span className="ar-empty-text">No amenities available</span>}
              </div>
            </div>

            {/* Features */}
            <div className="ar-field">
              <label className="ar-label">Features</label>
              <div className="ar-checkbox-grid">
                {features.map((f) => (
                  <label key={f._id} className="ar-checkbox-label">
                    <input
                      type="checkbox"
                      className="ar-checkbox"
                      checked={form.feature_ids.includes(f._id)}
                      onChange={() => handleFeatureToggle(f._id)}
                    />
                    <span>{f.name}</span>
                  </label>
                ))}
                {features.length === 0 && <span className="ar-empty-text">No features available</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRoomPage;
