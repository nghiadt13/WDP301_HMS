import { useMemo, useState } from 'react';
import { useAddCharge, useRemoveCharge } from '../hooks/use-checkout';
import { Receipt, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const emptyCharge = (summary) => ({
  room_id: (summary.rooms || [])[0]?.roomId || '',
  description: '',
  amount: '',
  charge_type: 'damage',
});

const typeLabels = {
  room_inventory: 'Vật tư phòng',
  damage: 'Bồi thường hư hỏng',
  service: 'Dịch vụ thêm',
  other: 'Khác',
};

const buildHousekeepingInventoryCharges = (summary) => {
  const existingInventoryKeys = new Set(
    (summary.charges || [])
      .filter((charge) => String(charge.charge_type || '').toLowerCase() === 'room_inventory')
      .map((charge) => `${charge.description}|${Number(charge.amount || 0)}`)
  );

  return (summary?.inspectionState?.rooms || []).flatMap((room) => (
    (room.roomInventoryReport?.items || []).map((item, index) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unit_price || 0);
      const amount = Number(item.total || (quantity * unitPrice));
      const description = `${item.name || 'Vật tư phòng'} x${quantity}${room.roomNumber ? ` (${room.roomNumber})` : ''}`;
      const key = `${description}|${amount}`;

      if (quantity <= 0 || amount <= 0 || existingInventoryKeys.has(key)) return null;

      return {
        _id: `housekeeping-inventory-${room.roomNumber || 'room'}-${item.item_id || index}`,
        description,
        amount,
        charge_type: 'room_inventory',
        quantity,
        isAutoHousekeepingCharge: true,
      };
    }).filter(Boolean)
  ));
};

const CheckoutStepCharges = ({ bookingId, summary }) => {
  const { mutate: addCharge, isPending: isAdding } = useAddCharge(bookingId);
  const { mutate: removeCharge, isPending: isRemoving } = useRemoveCharge(bookingId);
  const [chargeData, setChargeData] = useState(() => emptyCharge(summary));

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(val || 0));
  const rooms = summary.rooms || [];

  const roomInventoryReportRooms = summary?.inspectionState?.rooms || [];
  const roomInventoryReportTotal = roomInventoryReportRooms.reduce(
    (roomSum, room) => roomSum + (room.roomInventoryReport?.items || []).reduce((itemSum, item) => itemSum + Number(item.total || (Number(item.quantity || 0) * Number(item.unit_price || 0))), 0),
    0
  );

  const manualChargesTotal = useMemo(
    () => [...(summary.charges || []), ...buildHousekeepingInventoryCharges(summary)]
      .reduce((sum, charge) => sum + Number(charge.amount || 0), 0),
    [summary]
  );
  const displayCharges = useMemo(
    () => [...buildHousekeepingInventoryCharges(summary), ...(summary.charges || [])],
    [summary]
  );

  const handleRoomChange = (event) => {
    setChargeData((current) => ({
      ...current,
      room_id: event.target.value,
    }));
  };

  const handleAddCharge = (event) => {
    event.preventDefault();

    if (!chargeData.description.trim() || Number(chargeData.amount) < 0 || chargeData.amount === '') {
      toast.error('Vui lòng nhập đầy đủ mô tả và số tiền phụ phí.');
      return;
    }

    addCharge({
      room_id: chargeData.room_id || null,
      description: chargeData.description.trim(),
      amount: Number(chargeData.amount),
      charge_type: chargeData.charge_type
    }, {
      onSuccess: () => {
        toast.success('Thêm phụ phí thành công.');
        setChargeData(emptyCharge(summary));
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Không thể thêm phụ phí.');
      }
    });
  };

  const handleRemoveCharge = (chargeId) => {
    if (window.confirm('Bạn có chắc muốn xóa phụ phí này?')) {
      removeCharge(chargeId, {
        onSuccess: () => toast.success('Đã xóa phụ phí.'),
        onError: (err) => toast.error(err.response?.data?.message || 'Không thể xóa phụ phí.')
      });
    }
  };

  return (
    <div className="wizard-step-content">
      <div className="wizard-step-header" style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 8px 0', color: '#0f172a' }}>
          <div style={{ background: '#fef3c7', color: '#d97706', padding: '8px', borderRadius: '10px' }}>
            <Receipt size={20} />
          </div>
          Ghi nhận phụ phí phát sinh
        </h3>
        <p style={{ color: '#64748b', margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
          Vật tư phòng được lấy từ báo cáo Housekeeping. Lễ tân chỉ thêm phụ phí bồi thường cho đồ dùng hoặc thiết bị hư hỏng.
        </p>
      </div>

      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Báo cáo vật tư phòng từ Housekeeping</h4>
        {roomInventoryReportRooms.some((room) => (room.roomInventoryReport?.items || []).length > 0) ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {roomInventoryReportRooms.map((room) => {
              const items = room.roomInventoryReport?.items || [];
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
              <span>Tổng vật tư tham khảo từ báo cáo</span>
              <span>{formatCurrency(roomInventoryReportTotal)}</span>
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, color: '#64748b' }}>Chưa có vật tư phòng phát sinh từ báo cáo Housekeeping.</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 390px' }}>
          <form onSubmit={handleAddCharge} style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Thêm phí hư hỏng</h4>

            <div style={{ display: 'grid', gap: '16px' }}>
              <label style={{ display: 'grid', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                Áp dụng cho phòng
                <select style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px', color: '#0f172a' }} value={chargeData.room_id} onChange={handleRoomChange}>
                  <option value="">Áp dụng chung toàn bộ hóa đơn</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.roomId}>Phòng {room.roomName}</option>
                  ))}
                </select>
              </label>

              <label style={{ display: 'grid', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                Mô tả hư hỏng
                <input
                  type="text"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px', color: '#0f172a' }}
                  placeholder="VD: Hỏng máy sấy phòng CDT301"
                  value={chargeData.description}
                  onChange={(event) => setChargeData({ ...chargeData, description: event.target.value })}
                />
              </label>

              <label style={{ display: 'grid', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                Số tiền bồi thường (VND)
                <input
                  min="0"
                  type="number"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px', color: '#0f172a' }}
                  placeholder="VD: 50000"
                  value={chargeData.amount}
                  onChange={(event) => setChargeData({ ...chargeData, amount: event.target.value })}
                />
              </label>
            </div>

            <button type="submit" disabled={isAdding} style={{
              width: '100%', height: '46px', marginTop: '22px', background: isAdding ? '#94a3b8' : '#2563eb', color: '#fff',
              borderRadius: '10px', border: 'none', fontSize: '15px', fontWeight: '700',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: isAdding ? 'not-allowed' : 'pointer',
            }}>
              {isAdding ? 'Đang thêm...' : <><Plus size={18} /> Thêm phụ phí</>}
            </button>
          </form>
        </div>

        <div style={{ flex: '1 1 390px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Danh sách phụ phí</h4>
          {displayCharges.length === 0 ? (
            <div style={{ padding: '56px 20px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
              <Receipt size={30} style={{ color: '#94a3b8', marginBottom: '12px' }} />
              <p style={{ color: '#475569', margin: 0, fontSize: '15px', fontWeight: '700' }}>Chưa có phụ phí phát sinh</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {displayCharges.map((charge) => (
                <div key={charge._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>{charge.description}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                      <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                        {typeLabels[String(charge.charge_type || '').toLowerCase()] || 'Khác'}
                      </span>
                      {Number(charge.quantity || 0) > 0 && <span> x{charge.quantity}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontWeight: '800', color: '#ea580c', fontSize: '15px' }}>{formatCurrency(charge.amount)}</span>
                    {!charge.isAutoHousekeepingCharge ? (
                      <button type="button" onClick={() => handleRemoveCharge(charge._id)} disabled={isRemoving} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex' }}>
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', fontWeight: '800', color: '#1d4ed8' }}>
                <span>Tổng phụ phí đã thêm</span>
                <span>{formatCurrency(manualChargesTotal)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutStepCharges;
