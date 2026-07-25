import HousekeepingStatusBadge from './HousekeepingStatusBadge.jsx';

const HousekeepingRoomBoard = ({ rooms = [] }) => {
  return (
    <div className="housekeeping-card">
      <div className="housekeeping-card-header">
        <h3>Room board</h3>
        <span className="housekeeping-subtle">Status by room</span>
      </div>
      <div className="housekeeping-list">
        {rooms.map((room) => (
          <div key={room.id} className="housekeeping-room-card">
            <div className="housekeeping-room-main">
              <strong>Room {room.roomNumber}</strong>
              <div className="housekeeping-room-meta">
                <span>{room.roomType}</span>
                <span>Floor {room.floor}</span>
                <span>Building {room.building}</span>
              </div>
              <div className="housekeeping-subtle">{room.notes}</div>
            </div>
            <div className="housekeeping-task-actions">
              <HousekeepingStatusBadge value={room.status} />
              <HousekeepingStatusBadge value={room.priority} variant="priority" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HousekeepingRoomBoard;
