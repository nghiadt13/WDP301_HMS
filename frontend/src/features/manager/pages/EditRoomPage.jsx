import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { useRoom, useUpdateRoom, useRoomTypes } from '../hooks/use-rooms';
import './add-room.css';

const EditRoomPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const updateMutation = useUpdateRoom();
  const { data: roomData, isLoading: roomLoading } = useRoom(id);
  const { data: rtData } = useRoomTypes();
  const roomTypes = rtData?.data ?? [];

  const room = roomData?.data;

  const [form, setForm] = useState({
    roomName: '',
    room_type_id: '',
    description: '',
    isActive: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!room) return;
    setForm({
      roomName: room.roomName || '',
      room_type_id: typeof room.room_type_id === 'object' ? room.room_type_id?._id : room.room_type_id || '',
      description: room.description || '',
      isActive: room.isActive ?? true,
    });
  }, [room]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleStatusChange = (val) => {
    setForm((prev) => ({ ...prev, isActive: val }));
  };

  const validate = () => {
    const errs = {};
    if (!form.roomName.trim()) errs.roomName = 'Tên phòng là bắt buộc';
    if (!form.room_type_id) errs.room_type_id = 'Loại phòng là bắt buộc';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      roomName: form.roomName.trim(),
      room_type_id: form.room_type_id,
      description: form.description.trim(),
      isActive: form.isActive,
    };

    updateMutation.mutate({ id, data: payload }, {
      onSuccess: () => {
        navigate('/manager/physical-rooms');
      },
      onError: (err) => {
        const msg = err.response?.data?.message || 'Cập nhật phòng thất bại. Vui lòng thử lại.';
        alert(msg);
      },
    });
  };

  const isSubmitting = updateMutation.isPending;

  if (roomLoading) {
    return (
      <div className="ar-page" style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Đang tải thông tin phòng...</p>
      </div>
    );
  }

  return (
    <div className="ar-page">
      <div className="ar-header">
        <button type="button" className="ar-back-btn" onClick={() => navigate('/manager/physical-rooms')}>
          <ArrowLeft size={16} /> Quay lại quản lý phòng
        </button>
        <h1>Chỉnh sửa thông tin phòng</h1>
      </div>

      <div className="ar-grid" style={{ display: 'block', maxWidth: '600px', margin: '0 auto' }}>
        <div className="ar-card">
          <div className="ar-card-header">
            <span className="ar-card-title">Thông tin cơ bản</span>
            <div className="ar-card-actions">
              <button type="button" className="ar-btn-save" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button type="button" className="ar-btn-cancel" onClick={() => navigate('/manager/physical-rooms')} title="Hủy">
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="ar-field">
            <label className="ar-label">Tên phòng *</label>
            <input
              className="ar-input"
              type="text"
              name="roomName"
              value={form.roomName}
              onChange={handleChange}
              placeholder="Ví dụ: R101, CDT301"
            />
            {errors.roomName && <div className="ar-error">{errors.roomName}</div>}
          </div>

          <div className="ar-field">
            <label className="ar-label">Loại phòng *</label>
            <select
              className="ar-select"
              name="room_type_id"
              value={form.room_type_id}
              onChange={handleChange}
            >
              <option value="">-- Chọn loại phòng --</option>
              {roomTypes.map((rt) => (
                <option key={rt._id} value={rt._id}>{rt.name}</option>
              ))}
            </select>
            {errors.room_type_id && <div className="ar-error">{errors.room_type_id}</div>}
          </div>

          <div className="ar-field">
            <label className="ar-label">Mô tả phòng (tùy chọn)</label>
            <textarea
              className="ar-textarea"
              name="description"
              rows="4"
              value={form.description}
              onChange={handleChange}
              placeholder="Ghi chú thêm về phòng vật lý này..."
            />
          </div>

          <div className="ar-field">
            <label className="ar-label">Trạng thái hoạt động</label>
            <div className="ar-radio-group">
              <label className="ar-radio-label">
                <input
                  type="radio"
                  name="isActive"
                  className="ar-radio"
                  checked={form.isActive === true}
                  onChange={() => handleStatusChange(true)}
                />
                Hoạt động
              </label>
              <label className="ar-radio-label">
                <input
                  type="radio"
                  name="isActive"
                  className="ar-radio"
                  checked={form.isActive === false}
                  onChange={() => handleStatusChange(false)}
                />
                Ngưng hoạt động
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRoomPage;
