import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  Users
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
  const navigate = useNavigate();
  const [pageData, setPageData] = useState({
    reservation: null,
    room: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isMockPaying, setIsMockPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    const loadReservation = async () => {
      if (!localStorage.getItem('hotelify_token')) {
        navigate('/login');
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await axiosClient.get(`/reservations/${reservationId}`);
        setPageData({
          reservation: response.data.reservation || null,
          room: response.data.room || null
        });
      } catch (error) {
        setErrorMessage(error.response?.data?.message || 'Không thể tải thông tin thanh toán.');
      } finally {
        setIsLoading(false);
      }
    };

    loadReservation();
  }, [navigate, reservationId]);

  const reservation = pageData.reservation;
  const room = pageData.room;
  const nights = useMemo(
    () => getNightCount(reservation?.checkInDate, reservation?.checkOutDate),
    [reservation?.checkInDate, reservation?.checkOutDate]
  );
  const currentPaymentStatus = paymentStatus?.paymentStatus || reservation?.paymentStatus || 'Unpaid';
  const paidAmount = paymentStatus?.paidAmount ?? reservation?.depositAmount ?? 0;
  const remainingAmount = paymentStatus?.remainingAmount ?? Math.max(Number(reservation?.totalAmount || 0) - Number(paidAmount || 0), 0);
  const isPaid = Number(remainingAmount || 0) <= 0 || /^paid$/i.test(String(currentPaymentStatus));

  const applyPaymentStatus = (statusPayload) => {
    setPaymentStatus(statusPayload);

    setPageData((currentData) => ({
      ...currentData,
      reservation: {
        ...currentData.reservation,
        bookingStatus:
          currentData.reservation?.bookingStatus === 'Pending'
            ? 'Confirmed'
            : currentData.reservation?.bookingStatus,
        depositAmount: statusPayload.paidAmount,
        paymentStatus: statusPayload.paymentStatus
      }
    }));
  };

  const checkPaymentStatus = async ({ silent = false } = {}) => {
    if (!reservation?.id) {
      return;
    }

    if (!silent) {
      setIsCheckingPayment(true);
      setPaymentError('');
    }

    try {
      const response = await axiosClient.get(`/payments/reservations/${reservation.id}/status`);

      if (/paid/i.test(String(response.data.paymentStatus || ''))) {
        applyPaymentStatus(response.data);
      } else {
        setPaymentStatus(response.data);
      }
    } catch (error) {
      if (!silent) {
        setPaymentError(error.response?.data?.message || 'Không thể kiểm tra trạng thái thanh toán.');
      }
    } finally {
      if (!silent) {
        setIsCheckingPayment(false);
      }
    }
  };

  useEffect(() => {
    if (!reservation?.id || isPaid) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      checkPaymentStatus({ silent: true });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [reservation?.id, isPaid]);

  const handleMockPayment = async () => {
    if (!reservation?.id || isPaid) {
      return;
    }

    setIsMockPaying(true);
    setPaymentError('');

    try {
      const response = await axiosClient.post(`/payments/reservations/${reservation.id}/mock`, {
        provider: 'MockAPI',
        cardLast4: '4242'
      });

      applyPaymentStatus(response.data);
    } catch (error) {
      setPaymentError(error.response?.data?.message || 'Không thể thanh toán bằng MockAPI.');
    } finally {
      setIsMockPaying(false);
    }
  };

  if (isLoading) {
    return <section className="payment-state">Đang tải thông tin thanh toán...</section>;
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
            <p>Booking của bạn đã được tạo. Dùng MockAPI để giả lập thanh toán thành công và cập nhật trạng thái đặt phòng.</p>
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

          <section className="payment-method-card">
            <h2>Phương thức thanh toán</h2>
            <label>
              <input type="radio" name="payment-method" checked readOnly />
              <span>
                <strong>MockAPI thanh toán demo</strong>
                <small>Giả lập giao dịch thành công để kiểm thử luồng booking trước khi nối cổng thanh toán thật.</small>
              </span>
            </label>
          </section>

          <section className="vietqr-payment-card mockapi-payment-card">
            <div className="vietqr-payment-heading">
              <span><CreditCard size={18} /> MockAPI</span>
              <strong>{currentPaymentStatus}</strong>
            </div>

            {isPaid ? (
              <div className="vietqr-paid-state">
                <CheckCircle2 size={32} />
                <strong>Thanh toán đã được xác nhận bằng MockAPI.</strong>
              </div>
            ) : (
              <div className="mockapi-payment-box">
                <p>MockAPI sẽ tạo một giao dịch thành công và cập nhật booking sang trạng thái đã thanh toán.</p>
                <button type="button" disabled={isMockPaying} onClick={handleMockPayment}>
                  <CreditCard size={17} />
                  {isMockPaying ? 'Đang thanh toán...' : `Thanh toán ${formatCurrency(remainingAmount)}`}
                </button>
              </div>
            )}

            {paymentError ? <p className="vietqr-payment-error">{paymentError}</p> : null}
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
            Trạng thái thanh toán: {currentPaymentStatus}
          </p>
          <button type="button" disabled={isCheckingPayment} onClick={() => checkPaymentStatus()}>
            <RefreshCw size={17} />
            {isCheckingPayment ? 'Đang kiểm tra...' : 'Kiểm tra thanh toán'}
          </button>
          <button type="button" onClick={() => navigate('/profile')}>
            Xem booking của tôi
          </button>
        </aside>
      </div>
    </section>
  );
};

export default PaymentPage;
