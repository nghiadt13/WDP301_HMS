import { CheckCircle2, User, Key, Home, Calendar } from 'lucide-react';

const CheckinStepComplete = ({
  booking,
  rooms,
  stayGuests,
  roomAssignments,
  isMutating,
  isSuccess,
  onSubmit,
  onCloseComplete
}) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
  };

  const roomNamesList = Object.values(roomAssignments).map(v => v.roomName).join(', ');

  return (
    <div className="checkin-step-complete">
      {isSuccess ? (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '72px', height: '72px', borderRadius: '50%', background: '#dcfce7', color: 'var(--green)', marginBottom: '20px' }}>
            <CheckCircle2 size={40} />
          </div>
          <h3 style={{ fontSize: '22px', margin: '0 0 10px 0', color: '#15803d' }}>
            Nhận phòng thành công!
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '15px', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
            Đặt phòng <strong>{booking.bookingCode}</strong> đã được chuyển sang trạng thái <strong>Đã nhận phòng (CheckedIn)</strong>.
          </p>

          <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '16px', padding: '20px', maxWidth: '400px', margin: '0 auto 24px auto', textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
              <Home size={20} className="receptionist-icon" style={{ color: 'var(--blue-dark)' }} />
              <div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Phòng vật lý đã gán:</div>
                <strong style={{ fontSize: '16px', color: 'var(--ink)' }}>Phòng {roomNamesList}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Key size={20} className="receptionist-icon" style={{ color: 'var(--orange)' }} />
              <div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Hướng dẫn lễ tân:</div>
                <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>Bàn giao chìa khóa phòng cho khách hàng.</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-checkin-primary"
            onClick={onCloseComplete}
            style={{ width: 'auto', display: 'inline-flex', padding: '12px 24px' }}
          >
            Đã bàn giao chìa khóa & Đóng
          </button>
        </div>
      ) : (
        <div>
          <h3>Xác nhận & Hoàn tất thủ tục (Step 4 of 4)</h3>
          <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>
            Vui lòng đối chiếu lại toàn bộ thông tin trước khi xác nhận nhận phòng cho khách.
          </p>

          <div className="summary-block">
            <div className="summary-block-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} />
              Thông tin thời gian & phòng
            </div>
            <div style={{ padding: '4px 0 10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="info-label">Mã đặt phòng:</span>
                <span className="info-value">{booking.bookingCode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="info-label">Thời gian lưu trú:</span>
                <span className="info-value">{formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="info-label">Phòng vật lý phân bổ:</span>
                <span className="info-value" style={{ color: 'var(--blue-dark)', fontWeight: '800' }}>
                  Phòng {roomNamesList}
                </span>
              </div>
            </div>
          </div>

          <div className="summary-block">
            <div className="summary-block-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={16} />
              Danh sách khách ở thực tế
            </div>
            <div style={{ display: 'grid', gap: '8px', padding: '4px 0' }}>
              {rooms.map((room, idx) => {
                const guests = stayGuests[room.id] || [];
                const assigned = roomAssignments[room.id];
                return (
                  <div key={room.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px dashed var(--line)', paddingBottom: '8px' }}>
                    <div>
                      <strong>Khách phòng #{idx + 1}:</strong>{' '}
                      {guests.map(g => g.fullName).join(', ') || 'Chưa ghi nhận'}
                    </div>
                    {assigned && <span style={{ fontWeight: '600' }}>Phòng {assigned.roomName}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button
              type="button"
              className="btn-checkin-primary"
              disabled={isMutating}
              onClick={onSubmit}
              style={{ width: '100%', padding: '14px', fontSize: '16px' }}
            >
              {isMutating ? 'Đang gửi yêu cầu check-in...' : 'Xác nhận hoàn tất Check-in'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckinStepComplete;
