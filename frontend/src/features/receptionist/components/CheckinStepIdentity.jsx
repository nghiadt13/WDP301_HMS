import { useState } from 'react';
import StayGuestForm from './StayGuestForm.jsx';

const CheckinStepIdentity = ({ booking, rooms, stayGuests, onChange }) => {
  const [sameGuestForAll, setSameGuestForAll] = useState(() => {
    // If all rooms have the exact same guest details, sameGuestForAll can default to true
    if (rooms.length <= 1) return false;
    const room1Guest = stayGuests[rooms[0].id]?.[0];
    if (!room1Guest) return false;
    
    // Check if other rooms have the exact same guest details
    return rooms.slice(1).every(r => {
      const g = stayGuests[r.id]?.[0];
      return g && g.fullName === room1Guest.fullName && g.idCardNumber === room1Guest.idCardNumber;
    });
  });

  const handleGuestComplete = (bookingRoomId, guestObj) => {
    onChange(prev => {
      const next = { ...prev };
      if (guestObj) {
        if (sameGuestForAll) {
          // Sync to all rooms
          rooms.forEach(r => {
            next[r.id] = [guestObj];
          });
        } else {
          // Update only this room
          next[bookingRoomId] = [guestObj];
        }
      } else {
        if (sameGuestForAll) {
          // Clear all rooms
          rooms.forEach(r => {
            delete next[r.id];
          });
        } else {
          delete next[bookingRoomId];
        }
      }
      return next;
    });
  };

  // Sync rooms if checkbox changes
  const handleCheckboxChange = (checked) => {
    setSameGuestForAll(checked);
    if (checked) {
      const room1Guest = stayGuests[rooms[0].id]?.[0];
      onChange(prev => {
        const next = { ...prev };
        if (room1Guest) {
          rooms.forEach(r => {
            next[r.id] = [room1Guest];
          });
        } else {
          rooms.forEach(r => {
            delete next[r.id];
          });
        }
        return next;
      });
    } else {
      // If unchecking, keep room 1, clear others so receptionist must fill them manually
      onChange(prev => {
        const next = { ...prev };
        rooms.slice(1).forEach(r => {
          delete next[r.id];
        });
        return next;
      });
    }
  };

  return (
    <div className="checkin-step-identity">
      <h3>Ghi nhận danh tính khách lưu trú (Step 2 of 4)</h3>
      <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>
        Ghi nhận thông tin CCCD hoặc Hộ chiếu của tất cả các khách nghỉ tương ứng với từng phòng được gán.
      </p>

      {rooms.length > 1 && (
        <div style={{ marginBottom: '16px', background: '#f0fdf4', border: '1px solid #dcfce7', padding: '12px 16px', borderRadius: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', color: '#15803d' }}>
            <input
              type="checkbox"
              checked={sameGuestForAll}
              onChange={(e) => handleCheckboxChange(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            Cùng 1 khách ở tất cả các phòng (Sử dụng thông tin khách đại diện của Phòng #1)
          </label>
        </div>
      )}

      <div style={{ display: 'grid', gap: '20px' }}>
        {rooms.map((room, idx) => {
          const isHiddenOrLocked = sameGuestForAll && idx > 0;
          
          if (isHiddenOrLocked) {
            return (
              <div key={room.id} className="room-guest-block" style={{ opacity: 0.8, background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
                  <span>Phòng #{idx + 1}: {room.roomTypeName}</span>
                  <span style={{ fontSize: '12px', color: '#15803d', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ✓ Sử dụng chung thông tin từ Phòng #1
                  </span>
                </h4>
              </div>
            );
          }

          return (
            <div key={room.id} className="room-guest-block">
              <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Phòng #{idx + 1}: {room.roomTypeName}</span>
                {room.roomName && <span style={{ color: 'var(--muted)', fontWeight: 'normal' }}>(Gán phòng: {room.roomName})</span>}
              </h4>
              
              <StayGuestForm
                bookingRoom={room}
                booking={booking}
                roomIndex={idx}
                initialGuest={stayGuests[room.id]?.[0]}
                onComplete={(guestObj) => handleGuestComplete(room.id, guestObj)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CheckinStepIdentity;
