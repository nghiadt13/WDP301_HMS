import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBooking } from '../hooks/use-checkin';
import CheckinWizard from '../components/CheckinWizard.jsx';
import { Calendar, User, CreditCard, BedDouble, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ReceptionistBookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useBooking(id);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
        Đang tải thông tin đặt phòng...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--red)' }}>
        Có lỗi xảy ra: {error.message}
      </div>
    );
  }

  const { booking, rooms, stayGuests, payments, canCheckin, blockingReasons } = data.data;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN')}`;
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'CheckedIn': return 'Đã nhận phòng';
      case 'CheckedOut': return 'Đã trả phòng';
      case 'Confirmed': return 'Đã xác nhận';
      case 'Pending': return 'Chờ xử lý';
      case 'Canceled': return 'Đã hủy';
      case 'Completed': return 'Hoàn thành';
      default: return status;
    }
  };

  const getPaymentStatusLabel = (status) => {
    switch (status) {
      case 'Paid': return 'Đã thanh toán';
      case 'DepositPaid': return 'Đã đặt cọc';
      case 'Unpaid': return 'Chưa thanh toán';
      default: return status;
    }
  };

  const isCheckinBtnVisible = !['CheckedIn', 'CheckedOut', 'Completed', 'Canceled'].includes(booking.bookingStatus);

  return (
    <div className="booking-detail-container">
      <button
        type="button"
        className="pagination-btn"
        onClick={() => navigate('/receptionist/bookings')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}
      >
        <ArrowLeft size={16} />
        Quay lại danh sách
      </button>

      <div className="receptionist-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '22px', margin: 0 }}>Mã Đặt Phòng: {booking.bookingCode}</h2>
            <p style={{ color: 'var(--muted)', margin: '4px 0 0 0' }}>Ngày tạo: {formatDateTime(booking.createdAt)}</p>
          </div>
          <div>
            <span className={`receptionist-status ${booking.bookingStatus === 'CheckedIn' ? 'checked-in' : booking.bookingStatus === 'Canceled' ? 'check-out' : 'pending'}`} style={{ fontSize: '14px', padding: '10px 16px' }}>
              {getStatusLabel(booking.bookingStatus)}
            </span>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-main-content">
          {/* Thông tin phòng đặt */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BedDouble size={18} className="receptionist-icon" />
                Thông tin phòng lưu trú
              </h3>
            </div>
            <div className="info-row">
              <span className="info-label">Loại phòng:</span>
              <span className="info-value">{booking.roomType ? booking.roomType.name : 'Chưa rõ'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Số phòng đặt:</span>
              <span className="info-value">{booking.roomQuantity} phòng</span>
            </div>
            <div className="info-row">
              <span className="info-label">Số lượng khách:</span>
              <span className="info-value">{booking.guestCount} khách ({booking.adultCount} người lớn, {booking.childCount} trẻ em)</span>
            </div>
            <div className="info-row">
              <span className="info-label">Thời gian lưu trú:</span>
              <span className="info-value">{formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}</span>
            </div>
            {booking.specialRequest && (
              <div className="info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                <span className="info-label">Yêu cầu đặc biệt:</span>
                <span className="info-value" style={{ fontWeight: 'normal', background: '#f8fafc', padding: '10px', borderRadius: '8px', width: '100%' }}>
                  {booking.specialRequest}
                </span>
              </div>
            )}
          </div>

          {/* Danh sách phòng phân bổ */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Danh sách phòng phân bổ chi tiết</h3>
            </div>
            {rooms.length === 0 ? (
              <p style={{ color: 'var(--muted)', margin: 0 }}>Chưa được gán phòng nào.</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {rooms.map(room => (
                  <div key={room.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8faff', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--line)' }}>
                    <div>
                      <strong style={{ fontSize: '15px' }}>{room.roomName ? `Phòng ${room.roomName}` : 'Chưa gán số phòng'}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{room.roomTypeName}</div>
                    </div>
                    <span className={`receptionist-status ${room.status === 'CheckedIn' ? 'checked-in' : 'pending'}`}>
                      {room.status === 'CheckedIn' ? 'Đã nhận phòng' : 'Chờ nhận phòng'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Danh sách khách ở thực tế (StayGuests) */}
          {stayGuests.length > 0 && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Danh sách khách lưu trú thực tế</h3>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                {stayGuests.map(sg => {
                  const bRoom = rooms.find(r => r.id === sg.bookingRoomId);
                  return (
                    <div key={sg.id} style={{ background: '#f8faff', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--line)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{sg.fullName}</strong>
                        {bRoom && <span style={{ fontSize: '12px', color: 'var(--blue-dark)', fontWeight: '700' }}>Phòng {bRoom.roomName}</span>}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px', fontSize: '13px', color: 'var(--muted)' }}>
                        <div>SĐT: <span style={{ color: 'var(--ink)', fontWeight: '600' }}>{sg.phoneNumber || 'N/A'}</span></div>
                        <div>CCCD/Hộ chiếu: <span style={{ color: 'var(--ink)', fontWeight: '600' }}>{sg.idCardNumber || sg.passportNumber || 'N/A'}</span></div>
                        <div>Loại giấy tờ: <span style={{ color: 'var(--ink)', fontWeight: '600' }}>{sg.documentType === 'ID_CARD' ? 'CCCD' : sg.documentType === 'PASSPORT' ? 'Hộ chiếu' : 'Khác'}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="detail-sidebar-content">
          {/* Thông tin khách đặt */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} className="receptionist-icon" />
                Khách liên hệ đặt phòng
              </h3>
            </div>
            {booking.customer ? (
              <>
                <div className="info-row">
                  <span className="info-label">Tên khách:</span>
                  <span className="info-value">{booking.customer.fullName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Số điện thoại:</span>
                  <span className="info-value">{booking.customer.phoneNumber || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value" style={{ fontSize: '12px' }}>{booking.customer.email}</span>
                </div>
                {booking.customer.idCardNumber && (
                  <div className="info-row">
                    <span className="info-label">Số CCCD:</span>
                    <span className="info-value">{booking.customer.idCardNumber}</span>
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--muted)', margin: 0 }}>Khách vãng lai tại quầy.</p>
            )}
          </div>

          {/* Thanh toán & đặt cọc */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} className="receptionist-icon" />
                Thanh toán
              </h3>
            </div>
            <div className="info-row">
              <span className="info-label">Tổng số tiền:</span>
              <span className="info-value" style={{ color: 'var(--blue-dark)' }}>{formatCurrency(booking.totalAmount)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Đã đặt cọc:</span>
              <span className="info-value" style={{ color: 'var(--green)' }}>{formatCurrency(booking.depositAmount)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Trạng thái:</span>
              <span className={`receptionist-status ${booking.paymentStatus === 'Paid' ? 'checked-in' : booking.paymentStatus === 'DepositPaid' ? 'pending' : 'check-out'}`}>
                {getPaymentStatusLabel(booking.paymentStatus)}
              </span>
            </div>

            {/* Nút hành động Check-in */}
            {isCheckinBtnVisible && (
              <div className="checkin-action-area">
                <div className="tooltip-container" style={{ width: '100%' }}>
                  <button
                    type="button"
                    className="btn-checkin-primary"
                    disabled={!canCheckin}
                    onClick={() => setIsWizardOpen(true)}
                  >
                    <CheckCircle2 size={18} />
                    Tiến hành nhận phòng
                  </button>
                  {!canCheckin && blockingReasons.length > 0 && (
                    <span className="tooltip-text">
                      <strong>Không thể nhận phòng vì:</strong>
                      <ul style={{ margin: '4px 0 0 12px', padding: 0, textAlign: 'left' }}>
                        {blockingReasons.map((reason, idx) => <li key={idx}>{reason}</li>)}
                      </ul>
                    </span>
                  )}
                </div>

                {!canCheckin && blockingReasons.length > 0 && (
                  <div className="alert-box alert-error" style={{ fontSize: '12px', marginTop: '8px', padding: '10px' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <div>
                      {blockingReasons.map((reason, idx) => <div key={idx}>• {reason}</div>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isWizardOpen && (
        <CheckinWizard
          bookingId={id}
          onClose={() => setIsWizardOpen(false)}
          onComplete={() => {
            setIsWizardOpen(false);
            refetch(); // reload booking details
          }}
        />
      )}
    </div>
  );
};

export default ReceptionistBookingDetailPage;
