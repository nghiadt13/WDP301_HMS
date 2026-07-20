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
  Users,
  Banknote,
  Check,
  Building2,
  RotateCcw,
  Eye,
  UserCheck
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

  const storedUserStr = localStorage.getItem('hotelify_user');
  let isReceptionist = false;
  try {
    const userObj = storedUserStr ? JSON.parse(storedUserStr) : null;
    const roleVal = userObj?.role?.name || userObj?.role_name || userObj?.role || '';
    isReceptionist = String(roleVal).toLowerCase().includes('receptionist');
  } catch {}

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

  // Receptionist Walk-in specific state
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [walkinPaymentMethod, setWalkinPaymentMethod] = useState('Cash');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [isConfirmingWalkin, setIsConfirmingWalkin] = useState(false);
  const [walkinSuccess, setWalkinSuccess] = useState(false);

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
        const resData = response.data.reservation || null;
        setPageData({
          reservation: resData,
          room: response.data.room || null
        });

        // If Receptionist, fetch available rooms for physical room assignment
        if (isReceptionist && resData?.roomTypeId && resData?.checkInDate && resData?.checkOutDate) {
          try {
            const availRes = await axiosClient.get('/receptionist/rooms/available', {
              params: {
                roomTypeId: resData.roomTypeId,
                checkInDate: resData.checkInDate.slice(0, 10),
                checkOutDate: resData.checkOutDate.slice(0, 10)
              }
            });
            setAvailableRooms(availRes.data?.data || []);
          } catch {
            // Available rooms fetch failed non-blocking
          }
        }
      } catch (error) {
        setErrorMessage(error.response?.data?.message || 'Không thể tải thông tin thanh toán.');
      } finally {
        setIsLoading(false);
      }
    };

    loadReservation();
  }, [navigate, reservationId, isReceptionist]);

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

  const handleRoomToggle = (roomId) => {
    const requiredCount = reservation?.roomQuantity || 1;
    setSelectedRoomIds(prev => {
      if (prev.includes(roomId)) {
        return prev.filter(id => id !== roomId);
      } else {
        if (prev.length >= requiredCount) {
          return [...prev.slice(0, requiredCount - 1), roomId];
        }
        return [...prev, roomId];
      }
    });
  };

  const handleWalkInConfirm = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setPaymentError('Vui lòng nhập tên khách hàng đại diện.');
      return;
    }

    setIsConfirmingWalkin(true);
    setPaymentError('');

    try {
      await axiosClient.post(`/receptionist/bookings/${reservationId}/walkin-confirm`, {
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        paymentMethod: walkinPaymentMethod,
        selectedRoomIds
      });

      setWalkinSuccess(true);
      applyPaymentStatus({
        paymentStatus: 'Paid',
        paidAmount: reservation.totalAmount,
        remainingAmount: 0
      });
    } catch (error) {
      setPaymentError(error.response?.data?.message || 'Không thể xác nhận đặt phòng Walk-in.');
    } finally {
      setIsConfirmingWalkin(false);
    }
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
      <Link className="payment-back-link" to={isReceptionist ? "/receptionist/bookings" : "/profile"}>
        <ArrowLeft size={18} />
        {isReceptionist ? "Danh sách đặt phòng Lễ tân" : "Booking history"}
      </Link>

      {isReceptionist && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '14px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1e40af', fontWeight: 600 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={20} style={{ color: '#2563eb' }} />
            <span><strong>Chế độ Lễ tân:</strong> Xác nhận đặt phòng &amp; Ghi nhận thanh toán Walk-in tại quầy</span>
          </span>
          <Link to="/receptionist" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', background: 'white', padding: '6px 12px', borderRadius: '6px', border: '1px solid #93c5fd' }}>
            Bảng điều khiển &rarr;
          </Link>
        </div>
      )}

      <div className="payment-layout">
        <article className="payment-card payment-main-card">
          <header>
            <span>{isReceptionist ? 'Lễ tân Walk-in' : 'Hotelify payment'}</span>
            <h1>{isReceptionist ? 'Xác Nhận Đặt Phòng Walk-in' : 'Thanh toán đặt phòng'}</h1>
            <p>
              {isReceptionist
                ? 'Nhập thông tin tên và SĐT của khách, chọn phòng vật lý (nếu có) và xác nhận phương thức thanh toán trực tiếp tại quầy.'
                : 'Booking của bạn đã được tạo. Dùng MockAPI để giả lập thanh toán thành công và cập nhật trạng thái đặt phòng.'}
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

          {/* RECEPTIONIST WALK-IN CONFIRMATION FORM */}
          {isReceptionist ? (
            <section style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              {walkinSuccess || isPaid ? (
                <div style={{ textAlign: 'center', padding: '24px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #dcfce7' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#15803d', fontSize: '20px' }}>Xác Nhận Đặt Phòng Walk-in Thành Công!</h3>
                  <p style={{ color: '#475569', fontSize: '14px', marginBottom: '20px' }}>
                    Đơn đặt phòng <strong>{reservation.bookingCode}</strong> đã được thiết lập sang trạng thái <strong>Đã xác nhận (Confirmed)</strong> &amp; <strong>Đã thanh toán (Paid)</strong>.
                  </p>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => navigate('/receptionist/bookings')}
                      style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <RotateCcw size={16} />
                      Danh Sách Đặt Phòng
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/receptionist/bookings/${reservation.id}`)}
                      style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Eye size={16} />
                      Xem Chi Tiết &amp; Check-in
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleWalkInConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Thông tin khách hàng &amp; Thanh toán Walk-in</h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Họ và tên khách đại diện (*):</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Nguyễn Văn A"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Số điện thoại liên hệ:</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: 0912345678"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                      />
                    </div>
                  </div>



                  {/* Payment Method Option */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>
                      Chọn phương thức thanh toán (*):
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div
                        onClick={() => setWalkinPaymentMethod('Cash')}
                        style={{
                          border: walkinPaymentMethod === 'Cash' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          background: walkinPaymentMethod === 'Cash' ? '#eff6ff' : 'white',
                          borderRadius: '10px',
                          padding: '12px 14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Banknote size={18} style={{ color: '#16a34a' }} />
                          💵 Tiền mặt
                        </span>
                        {walkinPaymentMethod === 'Cash' && <Check size={16} style={{ color: '#2563eb' }} />}
                      </div>

                      <div
                        onClick={() => setWalkinPaymentMethod('BankTransfer')}
                        style={{
                          border: walkinPaymentMethod === 'BankTransfer' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          background: walkinPaymentMethod === 'BankTransfer' ? '#eff6ff' : 'white',
                          borderRadius: '10px',
                          padding: '12px 14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CreditCard size={18} style={{ color: '#2563eb' }} />
                          🏦 Chuyển khoản
                        </span>
                        {walkinPaymentMethod === 'BankTransfer' && <Check size={16} style={{ color: '#2563eb' }} />}
                      </div>
                    </div>
                  </div>

                  {paymentError && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
                      {paymentError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isConfirmingWalkin}
                    style={{
                      marginTop: '10px',
                      padding: '14px',
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '15px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {isConfirmingWalkin ? 'Đang xử lý...' : `Xác Nhận Thanh Toán (${formatCurrency(reservation.totalAmount)}) & Tạo Đặt Phòng`}
                  </button>
                </form>
              )}
            </section>
          ) : (
            <>
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
            </>
          )}
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
          {!isReceptionist && (
            <button type="button" disabled={isCheckingPayment} onClick={() => checkPaymentStatus()}>
              <RefreshCw size={17} />
              {isCheckingPayment ? 'Đang kiểm tra...' : 'Kiểm tra thanh toán'}
            </button>
          )}
          <button type="button" onClick={() => navigate(isReceptionist ? '/receptionist/bookings' : '/profile')}>
            {isReceptionist ? 'Danh sách đặt phòng Lễ tân' : 'Xem booking của tôi'}
          </button>
        </aside>
      </div>
    </section>
  );
};

export default PaymentPage;
