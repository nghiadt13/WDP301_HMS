import { useEffect, useState } from 'react';
import { useCreateInspection, useInspectionResults } from '../hooks/use-checkout';
import { ClipboardCheck, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CheckoutStepInspection = ({ bookingId, summary, onValidationChange }) => {
  const { data: inspectionData, isLoading: isLoadingResults } = useInspectionResults(bookingId);
  const { mutateAsync: requestInspectionAsync, mutate: requestInspection, isPending } = useCreateInspection(bookingId);
  const [isRequestingAll, setIsRequestingAll] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState(summary.rooms[0]?.roomName || '');
  const inspectionState = inspectionData?.data || {};
  const tasks = inspectionState.tasks || [];
  const pendingRooms = inspectionState.pendingRooms || [];
  const allRoomsConfirmed = Boolean(inspectionState.allRoomsConfirmed);

  useEffect(() => {
    onValidationChange?.(allRoomsConfirmed);
  }, [allRoomsConfirmed, onValidationChange]);

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

  const handleRequestAll = async () => {
    const roomsToRequest = summary.rooms.filter(room => 
      !tasks.some(t => t.room_number === room.roomName)
    );
    
    if (roomsToRequest.length === 0) {
      toast.success('Tất cả các phòng đều đã được yêu cầu kiểm tra.');
      return;
    }

    setIsRequestingAll(true);
    try {
      await Promise.all(roomsToRequest.map(room => 
        requestInspectionAsync({
          room_number: room.roomName,
          priority: 'high',
          description: `Yêu cầu kiểm tra phòng ${room.roomName} ngay cho khách trả phòng.`
        })
      ));
      toast.success(`Đã gửi yêu cầu kiểm tra cho ${roomsToRequest.length} phòng.`);
    } catch (err) {
      toast.error('Có lỗi xảy ra khi gửi yêu cầu kiểm tra.');
    } finally {
      setIsRequestingAll(false);
    }
  };

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
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button"
              onClick={handleRequestInspection}
              disabled={isPending || isRequestingAll}
              style={{ 
                 height: '46px', padding: '0 24px', background: (isPending || isRequestingAll) ? '#94a3b8' : '#2563eb', color: '#fff', 
                 borderRadius: '12px', border: 'none', fontSize: '15px', fontWeight: '600', 
                 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: (isPending || isRequestingAll) ? 'not-allowed' : 'pointer',
                 boxShadow: (isPending || isRequestingAll) ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.2)', transition: 'all 0.2s'
              }}
            >
              {isPending ? 'Đang gửi...' : <><Plus size={18}/> Yêu cầu phòng này</>}
            </button>
            <button 
              type="button"
              onClick={handleRequestAll}
              disabled={isPending || isRequestingAll}
              style={{ 
                 height: '46px', padding: '0 24px', background: (isPending || isRequestingAll) ? '#94a3b8' : '#10b981', color: '#fff', 
                 borderRadius: '12px', border: 'none', fontSize: '15px', fontWeight: '600', 
                 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: (isPending || isRequestingAll) ? 'not-allowed' : 'pointer',
                 boxShadow: (isPending || isRequestingAll) ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.2)', transition: 'all 0.2s'
              }}
            >
              {isRequestingAll ? 'Đang gửi...' : 'Yêu cầu tất cả phòng'}
            </button>
          </div>
        </div>
      </div>

      <div>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Lịch sử & Kết quả kiểm tra
        </h4>

        {!allRoomsConfirmed ? (
          <div style={{ marginBottom: '16px', padding: '14px 16px', borderRadius: '14px', background: '#fff7ed', border: '1px solid #fdba74', color: '#9a3412' }}>
            <div style={{ fontWeight: '700', marginBottom: '4px' }}>Chưa thể chuyển sang bước tiếp theo</div>
            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
              Housekeeping phải xác nhận kiểm tra cho tất cả các phòng trước khi receptionist tiếp tục checkout.
              {pendingRooms.length ? ` Phòng đang chờ xác nhận: ${pendingRooms.join(', ')}.` : ''}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '16px', padding: '14px 16px', borderRadius: '14px', background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' }}>
            Tất cả phòng đã được housekeeping xác nhận kiểm tra. Receptionist có thể tiếp tục bước tiếp theo.
          </div>
        )}
        
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
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: task.inspectionConfirmed ? '#f0fdf4' : '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: task.inspectionConfirmed ? '#16a34a' : '#ea580c' }}>
                    {task.inspectionConfirmed ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a', marginBottom: '4px' }}>{task.title}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>Trạng thái: <span style={{ fontWeight: '600', color: task.inspectionConfirmed ? '#16a34a' : '#ea580c' }}>{task.inspectionConfirmed ? 'Housekeeping đã xác nhận kiểm tra' : 'Đang chờ housekeeping xác nhận'}</span></div>
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
