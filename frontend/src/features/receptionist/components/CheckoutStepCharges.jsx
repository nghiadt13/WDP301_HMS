import { useState } from 'react';
import { useAddCharge, useRemoveCharge } from '../hooks/use-checkout';
import { Receipt, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CheckoutStepCharges = ({ bookingId, summary }) => {
  const { mutate: addCharge, isPending: isAdding } = useAddCharge(bookingId);
  const { mutate: removeCharge, isPending: isRemoving } = useRemoveCharge(bookingId);
  const minibarRooms = summary?.inspectionState?.rooms || [];

  const [chargeData, setChargeData] = useState({
    room_id: (summary.rooms || [])[0]?.roomId || '',
    description: '',
    amount: '',
    charge_type: 'service'
  });

  const handleAddCharge = (e) => {
    e.preventDefault();
    if (!chargeData.description || !chargeData.amount) {
      toast.error('Vui lòng nhập đầy đủ thông tin phụ phí');
      return;
    }

    addCharge({
      ...chargeData,
      amount: Number(chargeData.amount)
    }, {
      onSuccess: () => {
        toast.success('Thêm phụ phí thành công');
        setChargeData({ ...chargeData, description: '', amount: '' });
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Lỗi thêm phụ phí');
      }
    });
  };

  const handleRemoveCharge = (chargeId) => {
    if (window.confirm('Bạn có chắc muốn xóa phụ phí này?')) {
      removeCharge(chargeId, {
        onSuccess: () => toast.success('Đã xóa phụ phí'),
        onError: (err) => toast.error(err.response?.data?.message || 'Lỗi xóa phụ phí')
      });
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const minibarTotal = minibarRooms.reduce(
    (roomSum, room) => roomSum + (room.minibarReport?.items || []).reduce((itemSum, item) => itemSum + Number(item.total || (Number(item.quantity || 0) * Number(item.unit_price || 0))), 0),
    0
  );

  return (
    <div className="wizard-step-content">
      <div className="wizard-step-header" style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 8px 0', color: '#0f172a' }}>
          <div style={{ background: '#fef3c7', color: '#d97706', padding: '8px', borderRadius: '10px' }}>
            <Receipt size={20} />
          </div>
          Ghi nhận Phụ phí phát sinh
        </h3>
        <p style={{ color: '#64748b', margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
          Minibar được hệ thống tự động lấy từ báo cáo kiểm tra của Housekeeping. Receptionist chỉ thêm các khoản phí phát sinh khác nếu có.
        </p>
      </div>

      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Báo cáo minibar từ Housekeeping</h4>
        {minibarRooms.some((room) => (room.minibarReport?.items || []).length > 0) ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {minibarRooms.map((room) => {
              const items = room.minibarReport?.items || [];
              const total = items.reduce((sum, item) => sum + Number(item.total || (Number(item.quantity || 0) * Number(item.unit_price || 0))), 0);
              if (!items.length && total <= 0) return null;

              return (
                <article key={room.roomNumber} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ color: '#0f172a' }}>Phòng {room.roomNumber}</strong>
                    <span style={{ fontWeight: '700', color: '#ea580c' }}>{formatCurrency(total)}</span>
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {items.map((item, index) => (
                      <div key={`${room.roomNumber}-${index}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 110px 120px 120px', alignItems: 'center', gap: '12px', fontSize: '14px', padding: '8px 0', borderBottom: index === items.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                        <span>{item.name}</span>
                        <span style={{ textAlign: 'right' }}>{Number(item.quantity || 0)}</span>
                        <span style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price || 0)}</span>
                        <span style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency(item.total || 0)}</span>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '12px', background: '#fff7ed', border: '1px solid #fdba74', fontWeight: '700', color: '#9a3412' }}>
              <span>Tổng minibar charge</span>
              <span>{formatCurrency(minibarTotal)}</span>
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, color: '#64748b' }}>Không có minibar phát sinh từ báo cáo Housekeeping.</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Left Column: Form */}
        <div style={{ flex: '1 1 350px' }}>
          <form onSubmit={handleAddCharge} style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Thêm khoản phí mới</h4>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Loại phụ phí</label>
              <div style={{ position: 'relative' }}>
                <select style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px', color: '#0f172a', outline: 'none', appearance: 'none', cursor: 'pointer' }} value={chargeData.charge_type} onChange={e => setChargeData({...chargeData, charge_type: e.target.value})}>
                  <option value="damage">Bồi thường hư hại</option>
                  <option value="service">Dịch vụ thêm</option>
                  <option value="other">Khác</option>
                </select>
                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8', fontSize: '12px' }}>▼</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Áp dụng cho phòng</label>
              <div style={{ position: 'relative' }}>
                <select style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px', color: '#0f172a', outline: 'none', appearance: 'none', cursor: 'pointer' }} value={chargeData.room_id} onChange={e => setChargeData({...chargeData, room_id: e.target.value})}>
                  <option value="">-- Áp dụng chung toàn bộ hóa đơn --</option>
                  {(summary.rooms || []).map(room => (
                    <option key={room.id} value={room.roomId}>Phòng {room.roomName}</option>
                  ))}
                </select>
                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8', fontSize: '12px' }}>▼</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Mô tả chi tiết</label>
              <input 
                type="text" 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px', color: '#0f172a', outline: 'none', transition: 'border-color 0.2s' }} 
                placeholder="VD: 2 lon Coca, làm vỡ ly..."
                value={chargeData.description}
                onChange={e => setChargeData({...chargeData, description: e.target.value})}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Số tiền (VNĐ)</label>
              <input 
                type="number" 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px', color: '#0f172a', outline: 'none', transition: 'border-color 0.2s' }} 
                placeholder="VD: 50000"
                min="0"
                value={chargeData.amount}
                onChange={e => setChargeData({...chargeData, amount: e.target.value})}
              />
            </div>

            <button type="submit" disabled={isAdding} style={{ 
              width: '100%', height: '46px', background: isAdding ? '#94a3b8' : '#2563eb', color: '#fff', 
              borderRadius: '10px', border: 'none', fontSize: '15px', fontWeight: '600', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: isAdding ? 'not-allowed' : 'pointer',
              boxShadow: isAdding ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.2)', transition: 'all 0.2s'
            }}>
              {isAdding ? 'Đang thêm...' : <><Plus size={18}/> Thêm phụ phí</>}
            </button>
          </form>
        </div>

        {/* Right Column: List */}
        <div style={{ flex: '1 1 350px' }}>
          <div>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Danh sách phụ phí</h4>
            {(summary.charges || []).length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                <div style={{ width: '56px', height: '56px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', margin: '0 auto 16px' }}>
                  <Receipt size={28} />
                </div>
                <p style={{ color: '#475569', margin: 0, fontSize: '15px', fontWeight: '600' }}>Chưa có phụ phí phát sinh</p>
                <p style={{ color: '#94a3b8', margin: '8px 0 0 0', fontSize: '13px' }}>Các phụ phí bạn thêm sẽ hiển thị ở đây.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {(summary.charges || []).map(charge => (
                  <div key={charge._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '15px', color: '#0f172a' }}>{charge.description}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: '500' }}>
                          {charge.charge_type === 'minibar' ? 'Minibar' : charge.charge_type === 'damage' ? 'Bồi thường' : charge.charge_type === 'service' ? 'Dịch vụ' : 'Khác'}
                        </span>
                        {charge.room_id && <span>• Phòng {(summary.rooms || []).find(r => r.roomId === charge.room_id)?.roomName || ''}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontWeight: '700', color: '#ea580c', fontSize: '15px' }}>{formatCurrency(charge.amount)}</span>
                      <button type="button" onClick={() => handleRemoveCharge(charge._id)} disabled={isRemoving} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutStepCharges;
