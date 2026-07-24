import { useState } from 'react';

const HousekeepingAssignModal = ({ isOpen, onClose, onAssign, staffList = [] }) => {
  const [staff, setStaff] = useState('');

  if (!isOpen) return null;

  return (
    <div className="housekeeping-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="housekeeping-modal-card" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <h3>Assign task</h3>
        <p>Select a team member to handle this task.</p>
        <select value={staff} onChange={(event) => setStaff(event.target.value)}>
          <option value="">Select staff</option>
          {staffList.map((member) => (
            <option key={member.id} value={member.name}>
              {member.name}
            </option>
          ))}
        </select>
        <div className="housekeeping-modal-actions">
          <button className="housekeeping-outline-btn" type="button" onClick={onClose}>Cancel</button>
          <button className="housekeeping-btn" type="button" onClick={() => { onAssign(staff); onClose(); }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default HousekeepingAssignModal;
