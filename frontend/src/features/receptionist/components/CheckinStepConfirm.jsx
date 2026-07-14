import { AlertTriangle, CheckCircle } from 'lucide-react';

const CheckinStepConfirm = ({ booking, rooms, canCheckin, blockingReasons }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="checkin-step-confirm">
      <h3>Xác nhận điều kiện nhận phòng (Step 1 of 4)</h3>
      <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>
        Hệ thống tự động kiểm tra trạng thái thanh toán và điều kiện gán phòng lưu trú của đặt phòng này.
      </p>

      {canCheckin ? (
        <div className="alert-box alert-success">
          <CheckCircle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Đủ điều kiện nhận phòng!</strong> Đặt phòng đã thanh toán đầy đủ và các phòng ở trạng thái sẵn sàng.
          </div>
        </div>
      ) : (
        <div className="alert-box alert-error">
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Chưa đủ điều kiện nhận phòng!</strong> Vui lòng giải quyết các vấn đề sau trước khi tiếp tục:
            <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
              {blockingReasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="summary-block">
        <div className="summary-block-title">Tóm tắt đặt phòng</div>
        <div className="info-row">
          <span className="info-label">Mã Booking:</span>
          <span className="info-value">{booking.bookingCode}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Khách đặt:</span>
          <span className="info-value">{booking.customer ? booking.customer.fullName : 'Khách vãng lai'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Thời gian lưu trú:</span>
          <span className="info-value">{formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Loại phòng:</span>
          <span className="info-value">{booking.roomType ? booking.roomType.name : ''} ({booking.roomQuantity} phòng)</span>
        </div>
        <div className="info-row">
          <span className="info-label">Tổng thanh toán:</span>
          <span className="info-value">{formatCurrency(booking.totalAmount)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Đã thanh toán cọc:</span>
          <span className="info-value">{formatCurrency(booking.depositAmount)}</span>
        </div>
      </div>
    </div>
  );
};

export default CheckinStepConfirm;
