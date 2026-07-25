import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowRight } from 'lucide-react';

const WalkinBookingForm = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect to public booking page for streamlined walkin flow
    navigate('/booking', { replace: true });
  }, [navigate]);

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '32px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
        <UserPlus size={28} />
      </div>
      <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#0f172a' }}>Đang chuyển hướng đến trang Đặt phòng...</h2>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
        Luồng đặt phòng Walk-in trực tiếp hiện được thực hiện thông qua trang đặt phòng công khai tích hợp giao diện thanh toán riêng cho Lễ tân.
      </p>
      <button
        type="button"
        onClick={() => navigate('/booking')}
        style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
      >
        Đến trang Đặt phòng ngay <ArrowRight size={16} />
      </button>
    </div>
  );
};

export default WalkinBookingForm;
