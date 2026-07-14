import { useAvailableRooms } from '../hooks/use-checkin';

const CheckinStepRoomAssign = ({ booking, rooms, roomAssignments, onChange }) => {
  const params = {
    roomTypeId: booking.roomType?.id,
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate
  };

  const { data, isLoading, error } = useAvailableRooms(params);
  const availableRooms = data?.data || [];

  const handleRoomChange = (bookingRoomId, roomId) => {
    if (!roomId) {
      onChange(prev => {
        const next = { ...prev };
        delete next[bookingRoomId];
        return next;
      });
      return;
    }

    const room = availableRooms.find(r => r._id === roomId);
    if (room) {
      onChange(prev => ({
        ...prev,
        [bookingRoomId]: { roomId, roomName: room.roomName }
      }));
    }
  };

  const getFilteredOptions = (currentBookingRoomId) => {
    // Exclude physical rooms selected in other rows
    const selectedIds = Object.entries(roomAssignments)
      .filter(([id]) => id !== currentBookingRoomId)
      .map(([, val]) => val.roomId);

    return availableRooms.filter(r => !selectedIds.includes(r._id));
  };

  return (
    <div className="checkin-step-room-assign">
      <h3>Phân bổ phòng vật lý (Step 3 of 4)</h3>
      <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>
        Chọn phòng cụ thể cho khách trong số các phòng trống và sạch của loại phòng <strong>{booking.roomType?.name}</strong>.
      </p>

      {isLoading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
          Đang tải danh sách phòng trống...
        </div>
      ) : error ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--red)' }}>
          Lỗi: {error.message}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {rooms.map((room, idx) => {
            const currentSelection = roomAssignments[room.id]?.roomId || '';
            const filteredOptions = getFilteredOptions(room.id);

            return (
              <div key={room.id} className="room-guest-block" style={{ padding: '16px', background: '#f8faff', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '15px' }}>Phòng ở #{idx + 1}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Loại phòng đặt: {room.roomTypeName}</div>
                  </div>
                  
                  <div className="form-field" style={{ minWidth: '220px' }}>
                    <label htmlFor={`room-select-${room.id}`}>Chọn số phòng trống (*):</label>
                    <select
                      id={`room-select-${room.id}`}
                      value={currentSelection}
                      onChange={(e) => handleRoomChange(room.id, e.target.value)}
                    >
                      <option value="">-- Chọn phòng trống --</option>
                      {currentSelection && !filteredOptions.some(r => r._id === currentSelection) && (
                        // keep current selection in options if it was selected
                        <option value={currentSelection}>
                          Phòng {roomAssignments[room.id]?.roomName} (Hiện tại)
                        </option>
                      )}
                      {filteredOptions.map((opt) => (
                        <option key={opt._id} value={opt._id}>
                          Phòng {opt.roomName} ({opt.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}

          {availableRooms.length === 0 && (
            <div className="alert-box alert-error" style={{ margin: 0 }}>
              Không còn phòng trống sạch nào thuộc loại phòng này cho khoảng thời gian yêu cầu!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CheckinStepRoomAssign;
