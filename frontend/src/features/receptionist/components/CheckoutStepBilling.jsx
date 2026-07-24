import { useState, useMemo } from 'react';
import { useCompleteCheckout } from '../hooks/use-checkout';
import { FileText, CreditCard, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
      };
    }).filter(Boolean)
  ));
};

const CheckoutStepBilling = ({ bookingId, summary, onComplete }) => {
  const { mutate: completeCheckout, isPending: isCompleting } = useCompleteCheckout(bookingId);

  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const isCheckoutCompleted = summary?.booking?.status === 'CheckedOut';

  const approvedDamageTotal = Number(summary?.inspectionState?.approvedDamageTotal || 0);
  const manualChargesTotal = useMemo(
    () => [...(summary.charges || []), ...buildHousekeepingInventoryCharges(summary)]
      .reduce((sum, charge) => sum + Number(charge.amount || 0), 0),
    [summary]
  );

  const roomCharge = Number(summary.booking?.totalAmount || 0);
  const depositDeducted = Number(summary.booking?.depositAmount || 0);
  const subtotal = roomCharge + manualChargesTotal + approvedDamageTotal;
  const finalTotal = Math.max(0, subtotal - depositDeducted);
  const invoice = {
    ...(summary.invoice || {}),
    invoice_code: summary.invoice?.invoice_code || 'DRAFT',
    status: summary.invoice?.status || 'Unpaid',
    room_charge: roomCharge,
  extra_charges: manualChargesTotal + approvedDamageTotal,
    subtotal,
    deposit_deducted: depositDeducted,
    final_total: finalTotal,
  };

  const handleComplete = () => {
    completeCheckout({ payment_method: paymentMethod }, {
      onSuccess: () => {
        toast.success('Trả phòng và thanh toán thành công!');
        onComplete();
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Lỗi khi thanh toán');
      }
    });
  };

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  return (
    <div className="wizard-step-content">
      <div className="wizard-step-header" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
          <FileText size={20} className="receptionist-icon" />
          Hóa đơn & Thanh toán
        </h3>
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '14px' }}>
          Kiểm tra tổng chi phí và tiến hành thanh toán cuối cùng.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        <div className="detail-card" style={{ flex: 3 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '16px' }}>Mã HĐ: {invoice.invoice_code}</h4>
            <span className={`receptionist-status ${invoice.status === 'Paid' ? 'checked-in' : 'pending'}`}>
              {invoice.status === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </span>
          </div>

          <div style={{ display: 'grid', gap: '12px', fontSize: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Tiền phòng (theo hóa đơn/đặt phòng):</span>
              <span style={{ fontWeight: '500' }}>{formatCurrency(roomCharge)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Phụ phí khác:</span>
              <span style={{ fontWeight: '500' }}>{formatCurrency(manualChargesTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Bồi thường đã duyệt:</span>
              <span style={{ fontWeight: '500' }}>{formatCurrency(approvedDamageTotal)}</span>
            </div>
            <div style={{ borderTop: '1px dashed var(--line)', margin: '8px 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Tổng cộng (Subtotal):</span>
              <span style={{ fontWeight: '600', fontSize: '16px' }}>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Đã đặt cọc:</span>
              <span style={{ fontWeight: '500', color: 'var(--green)' }}>- {formatCurrency(depositDeducted)}</span>
            </div>

            <div style={{ borderTop: '1px solid var(--line)', margin: '8px 0' }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>SỐ TIỀN CẦN THANH TOÁN:</span>
              <span style={{ fontWeight: 'bold', fontSize: '24px', color: 'var(--blue-dark)' }}>{formatCurrency(finalTotal)}</span>
            </div>
          </div>
        </div>

        <div className="detail-card" style={{ flex: 2 }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={18} />
            Phương thức thanh toán
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="radio" name="payment_method" value="Cash" checked={paymentMethod === 'Cash'} onChange={e => setPaymentMethod(e.target.value)} />
              <span>Tiền mặt (Cash)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="radio" name="payment_method" value="Credit Card" checked={paymentMethod === 'Credit Card'} onChange={e => setPaymentMethod(e.target.value)} />
              <span>Thẻ tín dụng/Ghi nợ</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="radio" name="payment_method" value="Bank Transfer" checked={paymentMethod === 'Bank Transfer'} onChange={e => setPaymentMethod(e.target.value)} />
              <span>Chuyển khoản (Bank Transfer)</span>
            </label>
          </div>

          <button 
            className="btn-receptionist-primary" 
            style={{
              width: '100%',
              height: '48px',
              fontSize: '16px',
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              border: 'none',
              borderRadius: '12px',
              background: isCheckoutCompleted ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#ffffff',
              fontWeight: '700',
              boxShadow: isCheckoutCompleted ? 'none' : '0 12px 24px -16px rgba(37, 99, 235, 0.9)',
              cursor: isCompleting || isCheckoutCompleted ? 'not-allowed' : 'pointer',
            }}
            onClick={handleComplete}
            disabled={isCompleting || isCheckoutCompleted}
          >
            {isCompleting ? 'Đang xử lý...' : isCheckoutCompleted ? 'Checkout đã hoàn tất' : <><CheckCircle2 size={20}/> Hoàn tất thanh toán</>}
          </button>
          {!isCheckoutCompleted ? (
            <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'var(--muted)', lineHeight: '1.5' }}>
              Bấm nút này để xác nhận thanh toán cuối cùng và kết thúc quy trình check-out.
            </p>
          ) : null}
        </div>
      </div>

    </div>
  );
};

export default CheckoutStepBilling;
