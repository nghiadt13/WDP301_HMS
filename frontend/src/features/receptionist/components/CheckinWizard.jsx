import { useState } from 'react';
import { useBooking, useCheckIn } from '../hooks/use-checkin';
import CheckinStepConfirm from './CheckinStepConfirm.jsx';
import CheckinStepIdentity from './CheckinStepIdentity.jsx';
import CheckinStepRoomAssign from './CheckinStepRoomAssign.jsx';
import CheckinStepComplete from './CheckinStepComplete.jsx';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';

const CheckinWizard = ({ bookingId, onClose, onComplete }) => {
  const { data, isLoading, error } = useBooking(bookingId);
  const checkinMutation = useCheckIn();

  const [currentStep, setCurrentStep] = useState(1);
  const [stayGuests, setStayGuests] = useState({}); // bookingRoomId -> [guestObj]
  const [roomAssignments, setRoomAssignments] = useState({}); // bookingRoomId -> roomId (and roomName for display)
  const [errorMsg, setErrorMsg] = useState('');

  if (isLoading) {
    return (
      <div className="wizard-backdrop">
        <div className="wizard-modal" style={{ padding: '40px', textAlign: 'center' }}>
          Đang tải dữ liệu wizard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wizard-backdrop">
        <div className="wizard-modal" style={{ padding: '40px', textAlign: 'center', color: 'var(--red)' }}>
          Có lỗi xảy ra: {error.message}
          <div style={{ marginTop: '20px' }}>
            <button type="button" className="pagination-btn" onClick={onClose}>Đóng</button>
          </div>
        </div>
      </div>
    );
  }

  const { booking, rooms, canCheckin, blockingReasons } = data.data;

  // Total steps: 4
  const steps = [
    { num: 1, label: 'Xác nhận điều kiện' },
    { num: 2, label: 'Thông tin khách ở' },
    { num: 3, label: 'Gán phòng vật lý' },
    { num: 4, label: 'Hoàn tất' }
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setErrorMsg('');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrorMsg('');
    }
  };

  // Check if current step is validated to enable "Next"
  const isStepValid = () => {
    if (currentStep === 1) {
      return canCheckin;
    }
    if (currentStep === 2) {
      // Must have guest data for all rooms
      return rooms.every(room => {
        const guests = stayGuests[room.id];
        return Array.isArray(guests) && guests.length > 0 && guests.every(g => g.fullName && (g.idCardNumber || g.passportNumber));
      });
    }
    if (currentStep === 3) {
      // Must assign a room for all rooms
      return rooms.every(room => !!roomAssignments[room.id]?.roomId);
    }
    return true;
  };

  const handleSubmit = async () => {
    setErrorMsg('');

    // Prepare payload
    const flatStayGuests = [];
    Object.entries(stayGuests).forEach(([bookingRoomId, guests]) => {
      guests.forEach(g => {
        flatStayGuests.push({
          bookingRoomId,
          fullName: g.fullName,
          phoneNumber: g.phoneNumber,
          idCardNumber: g.idCardNumber,
          passportNumber: g.passportNumber,
          documentType: g.documentType
        });
      });
    });

    const flatRoomAssignments = Object.entries(roomAssignments).map(([bookingRoomId, info]) => ({
      bookingRoomId,
      roomId: info.roomId
    }));

    const payload = {
      stayGuests: flatStayGuests,
      roomAssignments: flatRoomAssignments
    };

    checkinMutation.mutate(
      { id: bookingId, data: payload },
      {
        onSuccess: () => {
          handleNext(); // go to step 4 (Success / Complete step)
        },
        onError: (err) => {
          setErrorMsg(err.response?.data?.message || err.message || 'Lỗi khi check-in');
        }
      }
    );
  };

  return (
    <div className="wizard-backdrop">
      <div className="wizard-modal">
        {/* Header */}
        <div className="wizard-header">
          <h2>Quy trình nhận phòng (Check-in Wizard)</h2>
          <button type="button" className="wizard-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="wizard-progress-bar">
          <div className="wizard-progress-fill" style={{ width: `${(currentStep / 4) * 100}%` }} />
        </div>

        {/* Steps Indicator */}
        <div className="wizard-steps-indicator">
          {steps.map((s) => (
            <div
              key={s.num}
              className={`wizard-step-node ${currentStep === s.num ? 'active' : currentStep > s.num ? 'completed' : ''}`}
            >
              <div className="wizard-step-circle">
                {currentStep > s.num ? <Check size={14} /> : s.num}
              </div>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="wizard-content">
          {errorMsg && (
            <div className="alert-box alert-error" style={{ marginBottom: '16px' }}>
              <span>{errorMsg}</span>
            </div>
          )}

          {currentStep === 1 && (
            <CheckinStepConfirm
              booking={booking}
              rooms={rooms}
              canCheckin={canCheckin}
              blockingReasons={blockingReasons}
            />
          )}

          {currentStep === 2 && (
            <CheckinStepIdentity
              booking={booking}
              rooms={rooms}
              stayGuests={stayGuests}
              onChange={setStayGuests}
            />
          )}

          {currentStep === 3 && (
            <CheckinStepRoomAssign
              booking={booking}
              rooms={rooms}
              roomAssignments={roomAssignments}
              onChange={setRoomAssignments}
            />
          )}

          {currentStep === 4 && (
            <CheckinStepComplete
              booking={booking}
              rooms={rooms}
              stayGuests={stayGuests}
              roomAssignments={roomAssignments}
              isMutating={checkinMutation.isPending}
              isSuccess={checkinMutation.isSuccess}
              onSubmit={handleSubmit}
              onCloseComplete={onComplete}
            />
          )}
        </div>

        {/* Footer Navigation */}
        {currentStep < 4 && (
          <div className="wizard-footer">
            <button
              type="button"
              className="wizard-btn-back"
              disabled={currentStep === 1}
              onClick={handleBack}
            >
              <ArrowLeft size={16} />
              Quay lại
            </button>

            <button
              type="button"
              className="wizard-btn-next"
              disabled={!isStepValid()}
              onClick={handleNext}
            >
              Tiếp theo
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckinWizard;
