import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useRoomType, useUpdateRoomType, useAmenities } from '../hooks/use-rooms';
import { uploadApi } from '../services/room-api';
import './add-room.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:9999';
const toFullUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
};

const BED_TYPES = ['Giường King', 'Giường Queen', 'Giường đôi (Twin)', 'Giường Sofa', 'Giường đơn', 'Giường tầng'];

const BED_RULES = {
  'Giường King': { adults: 2, children: 1 },
  'Giường Queen': { adults: 2, children: 1 },
  'Giường đôi (Twin)': { adults: 2, children: 1 },
  'Giường Sofa': { adults: 1, children: 1 },
  'Giường đơn': { adults: 1, children: 0 },
  'Giường tầng': { adults: 2, children: 1 },
};

const EditRoomTypePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const updateMutation = useUpdateRoomType();
  const { data: rtData, isLoading: rtLoading } = useRoomType(id);
  const { data: amData } = useAmenities();
  const amenities = amData?.data ?? [];

  const roomType = rtData?.data;

  const [form, setForm] = useState({
    name: '',
    description: '',
    base_price: '',
    bed_type: '',
    capacity: 2,
    area: '',
    guests: '',
    beds: '',
    images: [],
    features: [],
    facilities: [],
    is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [coverIndex, setCoverIndex] = useState(0);
  const fileInputRef = useRef(null);

  const [bedCount, setBedCount] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const formatGuests = (ad, ch) => {
    const parts = [];
    if (ad > 0) parts.push(`${ad} Người Lớn`);
    if (ch > 0) parts.push(`${ch} Trẻ Em`);
    return parts.join(', ');
  };

  useEffect(() => {
    if (!roomType) return;

    // Parse bed count
    let count = 1;
    if (roomType.beds) {
      const match = String(roomType.beds).match(/^(\d+)/);
      if (match) {
        count = parseInt(match[1], 10);
      }
    }

    // Parse adults & children
    let ad = 2;
    let ch = 0;
    if (roomType.guests) {
      const adultMatch = String(roomType.guests).match(/(\d+)\s*Người\s*Lớn/i);
      const childMatch = String(roomType.guests).match(/(\d+)\s*Trẻ\s*Em/i);
      if (adultMatch) ad = parseInt(adultMatch[1], 10);
      if (childMatch) ch = parseInt(childMatch[1], 10);
    } else {
      const rule = BED_RULES[roomType.bed_type] || { adults: 2, children: 1 };
      ad = rule.adults * count;
      ch = 0;
    }

    setBedCount(count);
    setAdults(ad);
    setChildren(ch);

    setForm({
      name: roomType.name || '',
      description: roomType.description || '',
      base_price: roomType.base_price ?? '',
      bed_type: roomType.bed_type || '',
      capacity: roomType.capacity ?? (ad + ch),
      area: roomType.area || '',
      guests: roomType.guests || '',
      beds: roomType.beds || '',
      images: roomType.images || [],
      features: roomType.features || [],
      facilities: roomType.facilities || [],
      is_active: roomType.is_active ?? true,
    });
  }, [roomType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'bed_type') {
      const rule = BED_RULES[value] || { adults: 2, children: 1 };
      const defaultCount = 1;
      const defaultAdults = rule.adults;
      const defaultChildren = 0;

      setBedCount(defaultCount);
      setAdults(defaultAdults);
      setChildren(defaultChildren);

      setForm((prev) => ({
        ...prev,
        bed_type: value,
        beds: value ? `${defaultCount} ${value}` : '',
        guests: value ? `${defaultAdults} Người Lớn` : '',
        capacity: defaultAdults,
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleBedCountChange = (amount) => {
    const newCount = Math.max(1, bedCount + amount);
    setBedCount(newCount);

    const rule = BED_RULES[form.bed_type] || { adults: 2, children: 1 };
    const maxAdults = rule.adults * newCount;
    const maxChildren = rule.children * newCount;

    const newAdults = Math.min(adults, maxAdults);
    const newChildren = Math.min(children, maxChildren);

    setAdults(newAdults);
    setChildren(newChildren);

    setForm((prev) => {
      const guestsStr = formatGuests(newAdults, newChildren);
      return {
        ...prev,
        beds: prev.bed_type ? `${newCount} ${prev.bed_type}` : '',
        guests: guestsStr,
        capacity: newAdults + newChildren,
      };
    });
  };

  const handleAdultsChange = (amount) => {
    const rule = BED_RULES[form.bed_type] || { adults: 2, children: 1 };
    const maxAdults = rule.adults * bedCount;
    const newAdults = Math.min(maxAdults, Math.max(1, adults + amount));
    setAdults(newAdults);

    setForm((prev) => {
      const guestsStr = formatGuests(newAdults, children);
      return {
        ...prev,
        guests: guestsStr,
        capacity: newAdults + children,
      };
    });
  };

  const handleChildrenChange = (amount) => {
    const rule = BED_RULES[form.bed_type] || { adults: 2, children: 1 };
    const maxChildren = rule.children * bedCount;
    const newChildren = Math.min(maxChildren, Math.max(0, children + amount));
    setChildren(newChildren);

    setForm((prev) => {
      const guestsStr = formatGuests(adults, newChildren);
      return {
        ...prev,
        guests: guestsStr,
        capacity: adults + newChildren,
      };
    });
  };

  const handleStatusChange = (val) => {
    setForm((prev) => ({ ...prev, is_active: val }));
  };

  const handleFacilityToggle = (name) => {
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(name)
        ? prev.facilities.filter((f) => f !== name)
        : [...prev.facilities, name],
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
      const msg = err.response?.data?.message || 'Tải ảnh lên thất bại. Vui lòng thử lại.';
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
    if (!form.name.trim()) errs.name = 'Tên loại phòng là bắt buộc';
    const priceNum = Number(form.base_price);
    if (!form.base_price || isNaN(priceNum) || priceNum < 0) errs.base_price = 'Giá phòng hợp lệ là bắt buộc';
    if (!form.bed_type) errs.bed_type = 'Vui lòng chọn loại giường chính';
    if (!form.area.trim()) errs.area = 'Diện tích là bắt buộc (Ví dụ: 32 m²)';
    if (!form.guests.trim()) errs.guests = 'Số khách mô tả là bắt buộc (Ví dụ: 2 Người Lớn)';
    if (!form.beds.trim()) errs.beds = 'Mô tả giường là bắt buộc (Ví dụ: 1 Giường đôi)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    // Put cover image first
    let sortedImages = [...form.images];
    if (coverIndex > 0 && coverIndex < sortedImages.length) {
      const cover = sortedImages[coverIndex];
      sortedImages = [cover, ...sortedImages.filter((_, idx) => idx !== coverIndex)];
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      base_price: Number(form.base_price),
      capacity: Number(form.capacity),
      images: sortedImages,
    };

    updateMutation.mutate({ id, data: payload }, {
      onSuccess: () => {
        navigate('/manager/rooms');
      },
      onError: (err) => {
        const msg = err.response?.data?.message || 'Cập nhật loại phòng thất bại. Vui lòng thử lại.';
        alert(msg);
      },
    });
  };

  const isSubmitting = updateMutation.isPending;

  if (rtLoading) {
    return (
      <div className="ar-page" style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Đang tải thông tin loại phòng...</p>
      </div>
    );
  }

  return (
    <div className="ar-page">
      <div className="ar-header">
        <button type="button" className="ar-back-btn" onClick={() => navigate('/manager/rooms')}>
          <ArrowLeft size={16} /> Quay lại quản lý phòng
        </button>
        <h1>Chỉnh sửa loại phòng</h1>
      </div>

      <div className="ar-grid">
        {/* Left Column */}
        <div className="ar-col">
          <div className="ar-card">
            <div className="ar-card-header">
              <span className="ar-card-title">Thông tin cơ bản</span>
              <div className="ar-card-actions">
                <button type="button" className="ar-btn-save" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button type="button" className="ar-btn-cancel" onClick={() => navigate('/manager/rooms')} title="Hủy">
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="ar-field">
              <label className="ar-label">Tên loại phòng *</label>
              <input
                className="ar-input"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ví dụ: PHÒNG DELUXE, PHÒNG GRAND SUITE"
              />
              {errors.name && <div className="ar-error">{errors.name}</div>}
            </div>

            <div className="ar-field">
              <label className="ar-label">Mô tả loại phòng</label>
              <textarea
                className="ar-textarea"
                name="description"
                rows="4"
                value={form.description}
                onChange={handleChange}
                placeholder="Mô tả chung..."
              />
            </div>

            <div className="ar-field">
              <label className="ar-label">Trạng thái hoạt động</label>
              <div className="ar-radio-group">
                <label className="ar-radio-label">
                  <input
                    type="radio"
                    name="is_active"
                    className="ar-radio"
                    checked={form.is_active === true}
                    onChange={() => handleStatusChange(true)}
                  />
                  Hoạt động
                </label>
                <label className="ar-radio-label">
                  <input
                    type="radio"
                    name="is_active"
                    className="ar-radio"
                    checked={form.is_active === false}
                    onChange={() => handleStatusChange(false)}
                  />
                  Ngưng hoạt động
                </label>
              </div>
            </div>

            <div className="ar-field">
              <label className="ar-label">Loại giường chính *</label>
              <select
                className="ar-select"
                name="bed_type"
                value={form.bed_type}
                onChange={handleChange}
              >
                <option value="">-- Chọn loại giường --</option>
                {BED_TYPES.map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
              {errors.bed_type && <div className="ar-error">{errors.bed_type}</div>}
            </div>

            {form.bed_type && (
              <>
                <div className="ar-field">
                  <label className="ar-label">Số lượng giường *</label>
                  <div className="ar-counter-container">
                    <button
                      type="button"
                      className="ar-counter-btn"
                      onClick={() => handleBedCountChange(-1)}
                      disabled={bedCount <= 1}
                    >
                      -
                    </button>
                    <span className="ar-counter-val">{bedCount}</span>
                    <button
                      type="button"
                      className="ar-counter-btn"
                      onClick={() => handleBedCountChange(1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="ar-row-controls">
                  <div className="ar-field">
                    <label className="ar-label">Số người lớn *</label>
                    <div className="ar-counter-container">
                      <button
                        type="button"
                        className="ar-counter-btn"
                        onClick={() => handleAdultsChange(-1)}
                        disabled={adults <= 1}
                      >
                        -
                      </button>
                      <span className="ar-counter-val">{adults}</span>
                      <button
                        type="button"
                        className="ar-counter-btn"
                        onClick={() => handleAdultsChange(1)}
                        disabled={adults >= (BED_RULES[form.bed_type]?.adults || 2) * bedCount}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="ar-field">
                    <label className="ar-label">Số trẻ em *</label>
                    <div className="ar-counter-container">
                      <button
                        type="button"
                        className="ar-counter-btn"
                        onClick={() => handleChildrenChange(-1)}
                        disabled={children <= 0}
                      >
                        -
                      </button>
                      <span className="ar-counter-val">{children}</span>
                      <button
                        type="button"
                        className="ar-counter-btn"
                        onClick={() => handleChildrenChange(1)}
                        disabled={children >= (BED_RULES[form.bed_type]?.children || 1) * bedCount}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="ar-field">
              <label className="ar-label">Sức chứa tối đa (người) *</label>
              <input
                className="ar-input"
                type="number"
                name="capacity"
                min="1"
                value={form.capacity}
                readOnly
                style={{ backgroundColor: '#f9fafb', cursor: 'not-allowed' }}
              />
            </div>

            <div className="ar-field">
              <label className="ar-label">Diện tích phòng *</label>
              <input
                className="ar-input"
                type="text"
                name="area"
                value={form.area}
                onChange={handleChange}
                placeholder="Ví dụ: 36 m²"
              />
              {errors.area && <div className="ar-error">{errors.area}</div>}
            </div>

            <div className="ar-field">
              <label className="ar-label">Mô tả số khách (Tự động cập nhật) *</label>
              <input
                className="ar-input"
                type="text"
                name="guests"
                value={form.guests}
                readOnly
                style={{ backgroundColor: '#f9fafb', cursor: 'not-allowed' }}
                placeholder="Ví dụ: 2 Người Lớn"
              />
              {errors.guests && <div className="ar-error">{errors.guests}</div>}
            </div>

            <div className="ar-field">
              <label className="ar-label">Mô tả chi tiết giường (Tự động cập nhật) *</label>
              <input
                className="ar-input"
                type="text"
                name="beds"
                value={form.beds}
                readOnly
                style={{ backgroundColor: '#f9fafb', cursor: 'not-allowed' }}
                placeholder="Ví dụ: 1 Giường đôi / 2 Giường đơn"
              />
              {errors.beds && <div className="ar-error">{errors.beds}</div>}
            </div>
          </div>

          <div className="ar-card">
            <div className="ar-card-header">
              <span className="ar-card-title">Giá cả</span>
            </div>
            <div className="ar-field">
              <label className="ar-label">Giá cơ bản (VNĐ) *</label>
              <div className="ar-price-row">
                <input
                  className="ar-input"
                  type="text"
                  name="base_price"
                  value={form.base_price}
                  onChange={handleChange}
                  placeholder="Ví dụ: 1500000"
                />
                <span className="ar-price-badge">/ Đêm</span>
              </div>
              {errors.base_price && <div className="ar-error">{errors.base_price}</div>}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="ar-col">
          <div className="ar-card">
            <div className="ar-card-header">
              <span className="ar-card-title">Hình ảnh loại phòng</span>
            </div>

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
              <p>{uploading ? 'Đang tải lên...' : 'Kéo và thả để tải ảnh lên'}</p>
              {!uploading && <p className="ar-drop-hint">hoặc</p>}
              {!uploading && (
                <button type="button" className="ar-drop-upload-btn" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  Chọn hình ảnh
                </button>
              )}
            </div>

            {form.images.length > 0 && (
              <>
                <div className="ar-thumbs-label">Tệp đã tải lên (Chọn một ảnh để làm ảnh bìa)</div>
                <div className="ar-thumbs-row">
                  {form.images.map((url, i) => (
                    <div
                      key={i}
                      className={`ar-thumb${coverIndex === i ? ' is-cover' : ''}`}
                      onClick={() => handleCoverSelect(i)}
                    >
                      <img src={toFullUrl(url)} alt={`Hình ảnh loại phòng ${i + 1}`} />
                      <button
                        type="button"
                        className="ar-thumb-remove"
                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(i); }}
                        title="Xóa hình ảnh"
                      >
                        <X size={10} />
                      </button>
                      {coverIndex === i && <div className="ar-thumb-cover">Ảnh bìa</div>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="ar-card">
            <div className="ar-card-header">
              <span className="ar-card-title">Tiện nghi</span>
            </div>

            {/* Facilities */}
            <div className="ar-field">
              <label className="ar-label">Tiện nghi (Lưu vào Facilities)</label>
              <div className="ar-checkbox-grid">
                {amenities.map((a) => (
                  <label key={a._id} className="ar-checkbox-label">
                    <input
                      type="checkbox"
                      className="ar-checkbox"
                      checked={form.facilities.includes(a.name)}
                      onChange={() => handleFacilityToggle(a.name)}
                    />
                    <span>{a.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRoomTypePage;
