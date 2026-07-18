import { useState } from 'react';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useCheckoutSummary } from '../hooks/use-checkout';
import CheckoutStepInspection from './CheckoutStepInspection';
import CheckoutStepCharges from './CheckoutStepCharges';
import CheckoutStepBilling from './CheckoutStepBilling';

const CheckoutWizard = ({ bookingId, onClose, onComplete }) => {
  const { data, isLoading, error } = useCheckoutSummary(bookingId);
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { num: 1, label: 'Kiểm tra phòng' },
    { num: 2, label: 'Phụ phí' },
    { num: 3, label: 'Hóa đơn & Thanh toán' }
  ];

  if (isLoading) {
    return (
      <div className="wizard-backdrop">
        <div className="wizard-modal" style={{ padding: '40px', textAlign: 'center' }}>
          Đang tải dữ liệu wizard...
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="wizard-backdrop">
        <div className="wizard-modal" style={{ padding: '40px', textAlign: 'center', color: 'var(--red)' }}>
          Lỗi khi tải thông tin checkout
          <div style={{ marginTop: '20px' }}>
            <button type="button" className="pagination-btn" onClick={onClose}>Đóng</button>
          </div>
        </div>
      </div>
    );
  }

  const summary = data.data;

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="wizard-backdrop">
      <div className="wizard-modal">
        {/* Header */}
        <div className="wizard-header">
          <h2>Quy trình Trả phòng (Check-out Wizard)</h2>
          <button type="button" className="wizard-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="wizard-progress-bar">
          <div className="wizard-progress-fill" style={{ width: `${(currentStep / 3) * 100}%` }} />
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

        {/* Customer & Booking Info Header (Optional, simplified for checkout) */}
        <div style={{ padding: '0 24px', display: 'flex', gap: '20px', fontSize: '14px', borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '20px' }}>
            <div><span style={{ color: 'var(--muted)' }}>Khách hàng:</span> <strong style={{color: 'var(--foreground)'}}>{summary.booking.customerName}</strong></div>
            <div><span style={{ color: 'var(--muted)' }}>Mã đặt phòng:</span> <strong style={{color: 'var(--foreground)'}}>{summary.booking.bookingCode}</strong></div>
        </div>

        {/* Step Content */}
        <div className="wizard-content" style={{ paddingTop: 0 }}>
          {currentStep === 1 && (
            <CheckoutStepInspection 
              bookingId={bookingId} 
              summary={summary} 
            />
          )}
          {currentStep === 2 && (
            <CheckoutStepCharges 
              bookingId={bookingId} 
              summary={summary} 
            />
          )}
          {currentStep === 3 && (
            <CheckoutStepBilling 
              bookingId={bookingId} 
              summary={summary} 
              onComplete={onComplete}
            />
          )}
        </div>

        {/* Footer Navigation */}
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

          {currentStep < 3 ? (
             <button
                type="button"
                className="wizard-btn-next"
                onClick={handleNext}
             >
                Tiếp theo
                <ArrowRight size={16} />
             </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CheckoutWizard;
