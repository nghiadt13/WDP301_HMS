import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  Users,
  X,
  XCircle
} from 'lucide-react';

import axiosClient from '../api/axiosClient';

const formatDate = (value) => {
  if (!value) {
    return 'Chưa cập nhật';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value));
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    currency: 'VND',
    maximumFractionDigits: 0,
    style: 'currency'
  }).format(Number(value || 0));

const getNightCount = (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate) {
    return 0;
  }

  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  const nights = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));

  return Math.max(1, nights);
};

const PaymentPage = () => {
  const { reservationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [pageData, setPageData] = useState({
    hotelPolicies: [],
    paymentSummary: null,
    reservation: null,
    room: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isPolicyAccepted, setIsPolicyAccepted] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const vnpayStatus = queryParams.get('vnpayStatus') || '';
  const vnpayMessage = queryParams.get('message') || '';

  useEffect(() => {
    const loadReservation = async () => {
      if (!localStorage.getItem('hotelify_token')) {
        navigate('/login');
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        const [reservationResponse, paymentResponse, policyResponse] = await Promise.all([
          axiosClient.get(`/reservations/${reservationId}`),
          axiosClient.get(`/payments/reservations/${reservationId}/status`),
          axiosClient.get('/payments/hotel-policies')
        ]);

        setPageData({
          hotelPolicies: policyResponse.data?.policies || [],
          paymentSummary: paymentResponse.data || null,
          reservation: reservationResponse.data.reservation || null,
          room: reservationResponse.data.room || null
        });
      } catch (error) {
        setErrorMessage(error.response?.data?.message || 'Không thể tải thông tin đặt phòng.');
      } finally {
        setIsLoading(false);
      }
    };

    loadReservation();
  }, [navigate, reservationId]);

  const reservation = pageData.reservation;
  const room = pageData.room;
  const paymentSummary = pageData.paymentSummary;
  const hotelPolicies = pageData.hotelPolicies || [];
  const nights = useMemo(
    () => getNightCount(reservation?.checkInDate, reservation?.checkOutDate),
    [reservation?.checkInDate, reservation?.checkOutDate]
  );
  const paidAmount = Number(paymentSummary?.paidAmount ?? reservation?.depositAmount ?? 0);
  const remainingAmount = Number(
    paymentSummary?.remainingAmount ?? Math.max(Number(reservation?.totalAmount || 0) - paidAmount, 0)
  );
  const paymentStatus = paymentSummary?.paymentStatus || reservation?.paymentStatus || 'Unpaid';
  const isPaid = remainingAmount <= 0 || /^paid$/i.test(paymentStatus);

  const handleVnpayPayment = async () => {
    if (!reservation || isPaid) {
      return;
    }

    if (!isPolicyAccepted) {
      setPaymentError('Vui lòng đồng ý điều khoản của khách sạn trước khi thanh toán.');
      return;
    }

    setIsCreatingPayment(true);
    setPaymentError('');

    try {
      const response = await axiosClient.post(`/payments/reservations/${reservation.id}/vnpay`, {
        acceptedHotelPolicies: true
      });

      if (response.data.paymentUrl) {
        window.location.assign(response.data.paymentUrl);
        return;
      }

      setPaymentError(response.data.message || 'Không thể tạo phiên thanh toán VNPAY.');
    } catch (error) {
      setPaymentError(error.response?.data?.message || 'Không thể tạo thanh toán VNPAY sandbox.');
    } finally {
      setIsCreatingPayment(false);
    }
  };

  if (isLoading) {
    return <section className="payment-state">Đang tải thông tin đặt phòng...</section>;
  }

  if (errorMessage || !reservation) {
    return (
      <section className="payment-state is-error">
        <p>{errorMessage || 'Không tìm thấy booking.'}</p>
        <Link to="/booking">Quay lại đặt phòng</Link>
      </section>
    );
  }

  return (
    <section className="payment-page" aria-label="Thanh toán đặt phòng">
      <Link className="payment-back-link" to="/profile">
        <ArrowLeft size={18} />
        Booking history
      </Link>

      <div className="payment-layout">
        <article className="payment-card payment-main-card">
          <header>
            <span>Hotelify payment</span>
            <h1>Thanh toán đặt phòng</h1>
            <p>
              Booking của bạn đã được tạo. Hoàn tất thanh toán qua VNPAY sandbox để hệ thống xác nhận
              trạng thái thanh toán tự động.
            </p>
          </header>

          <div className="payment-room-preview">
            {reservation.roomImage || room?.image ? (
              <img src={reservation.roomImage || room.image} alt={reservation.roomName || room?.name} />
            ) : null}
            <div>
              <strong>{reservation.roomName || room?.name || 'Hotelify Room'}</strong>
              <small>{reservation.bookingCode}</small>
              <span>{reservation.bookingStatus || 'Pending'}</span>
            </div>
          </div>

          <div className="payment-info-grid">
            <span>
              <CalendarDays size={18} />
              <small>Ngày đến</small>
              <strong>{formatDate(reservation.checkInDate)}</strong>
            </span>
            <span>
              <CalendarDays size={18} />
              <small>Ngày đi</small>
              <strong>{formatDate(reservation.checkOutDate)}</strong>
            </span>
            <span>
              <Users size={18} />
              <small>Khách</small>
              <strong>{reservation.adultCount} người lớn, {reservation.childCount} trẻ em</strong>
            </span>
            <span>
              <BedDouble size={18} />
              <small>Số phòng</small>
              <strong>{reservation.roomQuantity} phòng</strong>
            </span>
          </div>

          <section className="vnpay-payment-card">
            <div className="vnpay-payment-heading">
              <span>
                <CreditCard size={18} />
                VNPAY sandbox
              </span>
              <strong>{isPaid ? 'Paid' : paymentStatus}</strong>
            </div>

            {vnpayStatus === 'success' ? (
              <p className="vnpay-payment-message is-success">
                <CheckCircle2 size={18} />
                Thanh toán VNPAY thành công. Booking đã được cập nhật.
              </p>
            ) : null}

            {vnpayStatus === 'failed' ? (
              <p className="vnpay-payment-message is-error">
                <XCircle size={18} />
                Thanh toán VNPAY chưa thành công{vnpayMessage ? `: ${vnpayMessage}` : '.'}
              </p>
            ) : null}

            <p>
              Hệ thống sẽ chuyển bạn sang cổng thanh toán VNPAY sandbox. Sau khi thanh toán xong,
              VNPAY sẽ trả kết quả về Hotelify và cập nhật booking.
            </p>

            <label className="hotel-policy-consent">
              <input
                type="checkbox"
                checked={isPolicyAccepted}
                disabled={isPaid}
                onChange={(event) => {
                  setIsPolicyAccepted(event.target.checked);
                  if (event.target.checked) {
                    setPaymentError('');
                  }
                }}
              />
              <span>
                Tôi đã đọc và đồng ý với{' '}
                <button type="button" onClick={() => setIsPolicyModalOpen(true)}>
                  điều khoản của khách sạn
                </button>
              </span>
            </label>

            {paymentError ? <p className="vnpay-payment-error">{paymentError}</p> : null}

            <button type="button" onClick={handleVnpayPayment} disabled={isCreatingPayment || isPaid || !isPolicyAccepted}>
              {isCreatingPayment ? <Loader2 size={18} className="spin-icon" /> : <CreditCard size={18} />}
              {isPaid ? 'Đã thanh toán' : `Thanh toán ${formatCurrency(remainingAmount)}`}
            </button>
          </section>
        </article>

        <aside className="payment-card payment-summary-card">
          <h2>Tóm tắt</h2>
          <div>
            <span>Giá phòng / đêm</span>
            <strong>{formatCurrency(reservation.roomPrice || room?.price)}</strong>
          </div>
          <div>
            <span>Số đêm</span>
            <strong>{nights}</strong>
          </div>
          <div>
            <span>Số phòng</span>
            <strong>{reservation.roomQuantity}</strong>
          </div>
          <div>
            <span>Đã thanh toán</span>
            <strong>{formatCurrency(paidAmount)}</strong>
          </div>
          <hr />
          <div className="payment-total-row">
            <span>Tổng tiền</span>
            <strong>{formatCurrency(reservation.totalAmount)}</strong>
          </div>
          <div>
            <span>Còn lại</span>
            <strong>{formatCurrency(remainingAmount)}</strong>
          </div>
          <p>
            <ShieldCheck size={17} />
            Trạng thái thanh toán: {paymentStatus}
          </p>
          <button type="button" onClick={() => navigate('/profile')}>
            Xem booking của tôi
          </button>
        </aside>
      </div>

      {isPolicyModalOpen ? (
        <div className="hotel-policy-modal-backdrop" role="presentation" onMouseDown={() => setIsPolicyModalOpen(false)}>
          <section
            className="hotel-policy-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hotel-policy-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>Hotelify policies</span>
                <h2 id="hotel-policy-modal-title">Điều khoản của khách sạn</h2>
              </div>
              <button type="button" aria-label="Đóng điều khoản" onClick={() => setIsPolicyModalOpen(false)}>
                <X size={20} />
              </button>
            </header>

            <div className="hotel-policy-modal-content">
              {hotelPolicies.length > 0 ? (
                hotelPolicies.map((policy) => (
                  <article key={policy.id} className="hotel-policy-item">
                    <span>{policy.category || 'Chính sách'}</span>
                    <h3>{policy.title}</h3>
                    <p>{policy.content}</p>
                  </article>
                ))
              ) : (
                <p className="hotel-policy-empty">Chưa có điều khoản khách sạn đang hoạt động.</p>
              )}
            </div>

            <footer>
              <button
                type="button"
                onClick={() => {
                  setIsPolicyAccepted(true);
                  setPaymentError('');
                  setIsPolicyModalOpen(false);
                }}
              >
                Đồng ý điều khoản
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
};

export default PaymentPage;
