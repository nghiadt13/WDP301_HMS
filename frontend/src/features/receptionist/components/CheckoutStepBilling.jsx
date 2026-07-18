import { useState, useEffect } from 'react';
import { useGenerateInvoice, useCompleteCheckout } from '../hooks/use-checkout';
import { FileText, CreditCard, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CheckoutStepBilling = ({ bookingId, summary, onPrev, onComplete }) => {
  const { mutate: generateInvoice, isPending: isGenerating } = useGenerateInvoice(bookingId);
  const { mutate: completeCheckout, isPending: isCompleting } = useCompleteCheckout(bookingId);

  const [paymentMethod, setPaymentMethod] = useState('Cash');

  useEffect(() => {
    // Generate or fetch latest invoice when step loads
    generateInvoice();
  }, [bookingId, generateInvoice]);

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

  const invoice = summary.invoice;

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

      {!invoice && isGenerating ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
          Đang tạo hóa đơn...
        </div>
      ) : !invoice ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--red)' }}>
          Lỗi không thể tạo hóa đơn. Vui lòng thử lại.
        </div>
      ) : (
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
                <span style={{ fontWeight: '500' }}>{formatCurrency(invoice.room_charge)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Tổng phụ phí phát sinh:</span>
                <span style={{ fontWeight: '500' }}>{formatCurrency(invoice.extra_charges)}</span>
              </div>
              
              <div style={{ borderTop: '1px dashed var(--line)', margin: '8px 0' }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Tổng cộng (Subtotal):</span>
                <span style={{ fontWeight: '600', fontSize: '16px' }}>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Đã đặt cọc:</span>
                <span style={{ fontWeight: '500', color: 'var(--green)' }}>- {formatCurrency(invoice.deposit_deducted)}</span>
              </div>

              <div style={{ borderTop: '1px solid var(--line)', margin: '8px 0' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>SỐ TIỀN CẦN THANH TOÁN:</span>
                <span style={{ fontWeight: 'bold', fontSize: '24px', color: 'var(--blue-dark)' }}>{formatCurrency(invoice.final_total)}</span>
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
              style={{ width: '100%', height: '48px', fontSize: '16px' }}
              onClick={handleComplete}
              disabled={isCompleting || invoice.status === 'Paid'}
            >
              {isCompleting ? 'Đang xử lý...' : invoice.status === 'Paid' ? 'Hóa đơn đã thanh toán' : <><CheckCircle2 size={20}/> Xác nhận & Hoàn tất Checkout</>}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default CheckoutStepBilling;
