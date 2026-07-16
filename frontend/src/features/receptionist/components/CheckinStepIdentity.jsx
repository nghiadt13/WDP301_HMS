import StayGuestForm from './StayGuestForm.jsx';

const CheckinStepIdentity = ({ booking, rooms, stayGuests, onChange }) => {
  const handleGuestComplete = (bookingRoomId, guestObj) => {
    onChange(prev => {
      const next = { ...prev };
      if (guestObj) {
        next[bookingRoomId] = [guestObj]; // store as array for this room
      } else {
        delete next[bookingRoomId];
      }
      return next;
    });
  };

  return (
    <div className="checkin-step-identity">
      <h3>Ghi nhận danh tính khách lưu trú (Step 2 of 4)</h3>
      <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>
        Ghi nhận thông tin CCCD hoặc Hộ chiếu của tất cả các khách nghỉ tương ứng với từng phòng được gán.
      </p>

      <div style={{ display: 'grid', gap: '20px' }}>
        {rooms.map((room, idx) => (
          <div key={room.id} className="room-guest-block">
            <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Phòng #{idx + 1}: {room.roomTypeName}</span>
              {room.roomName && <span style={{ color: 'var(--muted)', fontWeight: 'normal' }}>(Gán phòng: {room.roomName})</span>}
            </h4>
            
            <StayGuestForm
              bookingRoom={room}
              booking={booking}
              roomIndex={idx}
              onComplete={(guestObj) => handleGuestComplete(room.id, guestObj)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckinStepIdentity;
