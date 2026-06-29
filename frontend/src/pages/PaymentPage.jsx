import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BedDouble, CalendarDays, ShieldCheck, Users } from 'lucide-react';

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
  const [errorMessage, setErrorMessage] = useState('');

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
            <p>Booking của bạn đã được tạo. Vui lòng kiểm tra thông tin trước khi tiếp tục thanh toán.</p>
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
                <strong>Thanh toán tại khách sạn</strong>
                <small>Giữ phòng với trạng thái chờ xác nhận, lễ tân sẽ xử lý thanh toán.</small>
              </span>
            </label>
            <label>
              <input type="radio" name="payment-method" disabled />
              <span>
                <strong>Cổng thanh toán online</strong>
                <small>Sẽ tích hợp sau khi có nhà cung cấp thanh toán.</small>
              </span>
            </label>
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
            <span>Tiền cọc</span>
            <strong>{formatCurrency(reservation.depositAmount)}</strong>
          </div>
          <hr />
          <div className="payment-total-row">
            <span>Tổng tiền</span>
            <strong>{formatCurrency(reservation.totalAmount)}</strong>
          </div>
          <p>
            <ShieldCheck size={17} />
            Trạng thái thanh toán: {reservation.paymentStatus || 'Unpaid'}
          </p>
          <button type="button" onClick={() => navigate('/profile')}>
            Xem booking của tôi
          </button>
        </aside>
      </div>
    </section>
  );
};

export default PaymentPage;
