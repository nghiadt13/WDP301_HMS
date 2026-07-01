import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Copy,
  QrCode,
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
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentInfo, setPaymentInfo] = useState(null);
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
  const remainingAmount = paymentStatus?.remainingAmount ?? paymentInfo?.remainingAmount ?? reservation?.totalAmount;

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
      setPaymentStatus(response.data);

      if (/paid/i.test(String(response.data.paymentStatus || ''))) {
        setPageData((currentData) => ({
          ...currentData,
          reservation: {
            ...currentData.reservation,
            depositAmount: response.data.paidAmount,
            paymentStatus: response.data.paymentStatus
          }
        }));
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
    const createVietQrPayment = async () => {
      if (!reservation?.id || /paid/i.test(String(reservation.paymentStatus || ''))) {
        return;
      }

      setIsCreatingPayment(true);
      setPaymentError('');

      try {
        const response = await axiosClient.post(`/payments/reservations/${reservation.id}/vietqr`);
        setPaymentInfo(response.data);
      } catch (error) {
        setPaymentError(error.response?.data?.message || 'Không thể tạo mã VietQR.');
      } finally {
        setIsCreatingPayment(false);
      }
    };

    createVietQrPayment();
  }, [reservation?.id, reservation?.paymentStatus]);

  useEffect(() => {
    if (!reservation?.id || /paid/i.test(String(currentPaymentStatus))) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      checkPaymentStatus({ silent: true });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [reservation?.id, currentPaymentStatus]);

  const handleCopy = async (value) => {
    try {
      await navigator.clipboard.writeText(String(value || ''));
      setPaymentError('');
    } catch {
      setPaymentError('Không thể copy nội dung. Vui lòng copy thủ công.');
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
            <p>Booking của bạn đã được tạo. Quét VietQR hoặc chuyển khoản đúng nội dung để Casso tự động xác nhận.</p>
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
              <input type="radio" name="payment-method" defaultChecked />
              <span>
                <strong>VietQR chuyển khoản ngân hàng</strong>
                <small>Casso sẽ tự động xác nhận khi giao dịch về đúng nội dung chuyển khoản.</small>
              </span>
            </label>
          </section>

          <section className="vietqr-payment-card">
            <div className="vietqr-payment-heading">
              <span><QrCode size={18} /> VietQR</span>
              <strong>{currentPaymentStatus}</strong>
            </div>

            {isCreatingPayment ? (
              <p>Đang tạo mã VietQR...</p>
            ) : paymentInfo?.qrUrl ? (
              <div className="vietqr-payment-layout">
                <img src={paymentInfo.qrUrl} alt="VietQR payment code" />
                <div className="vietqr-payment-info">
                  <span>
                    <small>Ngân hàng</small>
                    <strong>{paymentInfo.bank?.bankId}</strong>
                  </span>
                  <span>
                    <small>Số tài khoản</small>
                    <strong>{paymentInfo.bank?.accountNo}</strong>
                    <button type="button" onClick={() => handleCopy(paymentInfo.bank?.accountNo)}>
                      <Copy size={15} /> Copy
                    </button>
                  </span>
                  <span>
                    <small>Chủ tài khoản</small>
                    <strong>{paymentInfo.bank?.accountName || 'Hotelify'}</strong>
                  </span>
                  <span>
                    <small>Số tiền</small>
                    <strong>{formatCurrency(paymentInfo.amount)}</strong>
                    <button type="button" onClick={() => handleCopy(paymentInfo.amount)}>
                      <Copy size={15} /> Copy
                    </button>
                  </span>
                  <span>
                    <small>Nội dung chuyển khoản</small>
                    <strong>{paymentInfo.transferContent}</strong>
                    <button type="button" onClick={() => handleCopy(paymentInfo.transferContent)}>
                      <Copy size={15} /> Copy
                    </button>
                  </span>
                </div>
              </div>
            ) : /paid/i.test(String(currentPaymentStatus)) ? (
              <div className="vietqr-paid-state">
                <CheckCircle2 size={32} />
                <strong>Thanh toán đã được xác nhận.</strong>
              </div>
            ) : (
              <p>{paymentError || 'Chưa tạo được mã VietQR.'}</p>
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
            <strong>{formatCurrency(paymentStatus?.paidAmount || reservation.depositAmount)}</strong>
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
