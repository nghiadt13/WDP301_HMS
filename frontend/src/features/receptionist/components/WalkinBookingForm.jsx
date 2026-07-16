import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateWalkIn, useReceptionistRoomTypes } from '../hooks/use-checkin';
import { UserPlus, Calendar, Info, BedDouble } from 'lucide-react';

const WalkinBookingForm = () => {
  const navigate = useNavigate();
  const { data: roomTypesData, isLoading: isLoadingTypes } = useReceptionistRoomTypes();
  const createWalkInMutation = useCreateWalkIn();

  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const [formData, setFormData] = useState({
    roomTypeId: '',
    roomCount: 1,
    checkInDate: todayStr,
    checkOutDate: tomorrowStr,
    guestCount: 1,
    adultCount: 1,
    childCount: 0,
    specialRequest: ''
  });

  const [errorMsg, setErrorMsg] = useState('');

  const handleInputChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleNumericChange = (field, val) => {
    const parsed = parseInt(val, 10);
    setFormData(prev => ({
      ...prev,
      [field]: isNaN(parsed) ? 0 : parsed
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.roomTypeId) {
      setErrorMsg('Vui lòng chọn loại phòng');
      return;
    }

    if (formData.roomCount < 1) {
      setErrorMsg('Số lượng phòng phải ít nhất là 1');
      return;
    }

    if (new Date(formData.checkOutDate) <= new Date(formData.checkInDate)) {
      setErrorMsg('Ngày trả phòng phải sau ngày nhận phòng');
      return;
    }

    createWalkInMutation.mutate(formData, {
      onSuccess: (res) => {
        // Redirection to the new booking detail
        const newBookingId = res.data.booking._id || res.data.booking.id;
        navigate(`/receptionist/bookings/${newBookingId}`);
      },
      onError: (err) => {
        setErrorMsg(err.response?.data?.message || err.message || 'Lỗi khi tạo đặt phòng trực tiếp');
      }
    });
  };

  const roomTypes = roomTypesData?.data || [];

  return (
    <div className="walkin-booking-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="receptionist-card">
        <div className="detail-card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
            <UserPlus size={20} className="receptionist-icon" style={{ color: 'var(--blue-dark)' }} />
            Tạo đặt phòng trực tiếp (Walk-in Booking)
          </h3>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>
          Ghi nhận lượt đặt phòng trực tiếp tại quầy lễ tân. Đặt phòng walk-in sẽ tự động được thiết lập ở trạng thái <strong>Đã xác nhận (Confirmed)</strong> và <strong>Đã thanh toán (Paid)</strong> để tiến hành làm thủ tục nhận phòng (Check-in) ngay.
        </p>

        {errorMsg && (
          <div className="alert-box alert-error" style={{ marginBottom: '16px' }}>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div className="form-field">
            <label htmlFor="roomTypeId">Chọn loại phòng lưu trú (*):</label>
            <select
              id="roomTypeId"
              value={formData.roomTypeId}
              onChange={(e) => handleInputChange('roomTypeId', e.target.value)}
              disabled={isLoadingTypes}
            >
              <option value="">-- Chọn loại phòng --</option>
              {roomTypes.map((type) => (
                <option key={type._id} value={type._id}>
                  {type.name} (Giá gốc: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(type.base_price)} / đêm)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-row">
            <div className="form-field">
              <label htmlFor="roomCount">Số lượng phòng (*):</label>
              <input
                id="roomCount"
                type="number"
                min="1"
                value={formData.roomCount}
                onChange={(e) => handleNumericChange('roomCount', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="guestCount">Tổng số khách nghỉ (*):</label>
              <input
                id="guestCount"
                type="number"
                min="1"
                value={formData.guestCount}
                onChange={(e) => handleNumericChange('guestCount', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-field">
              <label htmlFor="adultCount">Số người lớn:</label>
              <input
                id="adultCount"
                type="number"
                min="1"
                value={formData.adultCount}
                onChange={(e) => handleNumericChange('adultCount', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="childCount">Số trẻ em:</label>
              <input
                id="childCount"
                type="number"
                min="0"
                value={formData.childCount}
                onChange={(e) => handleNumericChange('childCount', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-field">
              <label htmlFor="checkInDate">Ngày nhận phòng (Check-in Date) (*):</label>
              <input
                id="checkInDate"
                type="date"
                value={formData.checkInDate}
                onChange={(e) => handleInputChange('checkInDate', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="checkOutDate">Ngày trả phòng (Check-out Date) (*):</label>
              <input
                id="checkOutDate"
                type="date"
                value={formData.checkOutDate}
                onChange={(e) => handleInputChange('checkOutDate', e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="specialRequest">Yêu cầu đặc biệt (nếu có):</label>
            <textarea
              id="specialRequest"
              rows="3"
              placeholder="Yêu cầu thêm giường phụ, phòng tầng cao, nước uống..."
              value={formData.specialRequest}
              onChange={(e) => handleInputChange('specialRequest', e.target.value)}
              style={{ border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', outline: 'none', background: 'white', resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            className="btn-checkin-primary"
            disabled={createWalkInMutation.isPending}
            style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '10px' }}
          >
            {createWalkInMutation.isPending ? 'Đang tạo đặt phòng...' : 'Tạo đặt phòng & Đi đến chi tiết'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WalkinBookingForm;
