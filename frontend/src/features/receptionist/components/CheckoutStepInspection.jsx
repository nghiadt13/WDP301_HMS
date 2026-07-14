import { useState } from 'react';
import { useCreateInspection, useInspectionResults } from '../hooks/use-checkout';
import { ClipboardCheck, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CheckoutStepInspection = ({ bookingId, summary, onNext }) => {
  const { data: inspectionData, isLoading: isLoadingResults } = useInspectionResults(bookingId);
  const { mutate: requestInspection, isPending } = useCreateInspection(bookingId);

  const [selectedRoom, setSelectedRoom] = useState(summary.rooms[0]?.roomName || '');

  const handleRequestInspection = () => {
    if (!selectedRoom) {
      toast.error('Vui lòng chọn phòng để yêu cầu dọn dẹp/kiểm tra');
      return;
    }
    
    requestInspection({
      room_number: selectedRoom,
      priority: 'high',
      description: `Yêu cầu kiểm tra phòng ${selectedRoom} ngay cho khách trả phòng.`
    }, {
      onSuccess: () => {
        toast.success(`Đã gửi yêu cầu kiểm tra phòng ${selectedRoom}`);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
      }
    });
  };

  const tasks = inspectionData?.data || [];

  return (
    <div className="wizard-step-content">
      <div className="wizard-step-header" style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 8px 0', color: '#0f172a' }}>
          <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '8px', borderRadius: '10px' }}>
            <ClipboardCheck size={20} />
          </div>
          Yêu cầu & Kết quả kiểm tra
        </h3>
        <p style={{ color: '#64748b', margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
          Trước khi khách trả phòng, vui lòng gửi yêu cầu để bộ phận Buồng phòng tiến hành kiểm tra tài sản và minibar.
        </p>
      </div>

      <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Chọn phòng cần kiểm tra
            </label>
            <div style={{ position: 'relative' }}>
              <select 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '15px', color: '#0f172a', outline: 'none', transition: 'border-color 0.2s', appearance: 'none', cursor: 'pointer', fontWeight: '500' }}
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
              >
                {summary.rooms.map(room => (
                  <option key={room.id} value={room.roomName}>Phòng {room.roomName}</option>
                ))}
              </select>
              <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
                ▼
              </div>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleRequestInspection}
            disabled={isPending}
            style={{ 
               height: '46px', padding: '0 24px', background: isPending ? '#94a3b8' : '#2563eb', color: '#fff', 
               borderRadius: '12px', border: 'none', fontSize: '15px', fontWeight: '600', 
               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: isPending ? 'not-allowed' : 'pointer',
               boxShadow: isPending ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.2)', transition: 'all 0.2s',
               minWidth: '180px'
            }}
          >
            {isPending ? 'Đang gửi...' : <><Plus size={18}/> Yêu cầu ngay</>}
          </button>
        </div>
      </div>

      <div>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Lịch sử & Kết quả kiểm tra
        </h4>
        
        {isLoadingResults ? (
          <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
             <p style={{ color: '#64748b', margin: 0, fontWeight: '500' }}>Đang tải kết quả...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
            <div style={{ width: '56px', height: '56px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', margin: '0 auto 16px' }}>
              <ClipboardCheck size={28} />
            </div>
            <p style={{ color: '#475569', margin: 0, fontSize: '16px', fontWeight: '600' }}>Chưa có yêu cầu kiểm tra nào</p>
            <p style={{ color: '#94a3b8', margin: '8px 0 0 0', fontSize: '14px' }}>Hãy chọn phòng và bấm "Yêu cầu ngay" để báo cho bộ phận buồng phòng.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {tasks.map(task => (
              <div key={task._id} style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: task.status === 'closed' ? '#f0fdf4' : '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: task.status === 'closed' ? '#16a34a' : '#ea580c' }}>
                    {task.status === 'closed' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a', marginBottom: '4px' }}>{task.title}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>Trạng thái: <span style={{ fontWeight: '600', color: task.status === 'closed' ? '#16a34a' : '#ea580c' }}>{task.status === 'closed' ? 'Đã hoàn tất kiểm tra' : 'Đang tiến hành dọn/kiểm tra'}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutStepInspection;
