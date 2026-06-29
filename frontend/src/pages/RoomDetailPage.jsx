import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BedDouble, CalendarDays, CheckCircle2, Star, Users } from 'lucide-react';

import axiosClient from '../api/axiosClient';
import DateRangePicker from '../components/DateRangePicker.jsx';

const formatDate = (value) => {
  if (!value) {
    return 'Chưa chọn';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(`${value}T00:00:00`));
};

const formatSubmittedDate = (value) => {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value));
};

const getInitials = (name) =>
  String(name || 'Hotelify customer')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const RoomDetailPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [roomData, setRoomData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reviewForm, setReviewForm] = useState({
    rating: '5',
    feedbackText: ''
  });
  const [reviewMessage, setReviewMessage] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  const query = useMemo(
    () => ({
      checkIn: searchParams.get('checkIn') || '',
      checkOut: searchParams.get('checkOut') || '',
      adults: searchParams.get('adults') || '',
      children: searchParams.get('children') || ''
    }),
    [searchParams]
  );

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    return params.toString();
  }, [query]);

  const isLoggedIn = Boolean(localStorage.getItem('hotelify_token'));

  const loadRoomDetail = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await axiosClient.get(`/rooms/${roomId}`, { params: query });
      setRoomData(response.data);
    } catch (error) {
      setRoomData(null);
      setErrorMessage(error.response?.data?.message || 'Không thể tải chi tiết phòng.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoomDetail();
    setReviewMessage('');
  }, [roomId, query]);

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    setReviewMessage('');

    if (!isLoggedIn) {
      setReviewMessage('Bạn cần đăng nhập trước khi bình luận.');
      return;
    }

    setIsSubmittingReview(true);

    try {
      const response = await axiosClient.post(`/rooms/${roomId}/reviews`, {
        rating: reviewForm.rating,
        feedbackText: reviewForm.feedbackText
      });
      setReviewMessage(response.data.message || 'Đã gửi đánh giá.');
      setReviewForm({ rating: '5', feedbackText: '' });
      await loadRoomDetail();
    } catch (error) {
      setReviewMessage(error.response?.data?.message || 'Không thể gửi đánh giá.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCreateBooking = async () => {
    setBookingMessage('');

    if (!isLoggedIn) {
      setBookingMessage('Bạn cần đăng nhập trước khi đặt phòng.');
      navigate('/login');
      return;
    }

    if (!search) {
      navigate(`/booking?roomId=${roomId}`);
      return;
    }

    setIsBooking(true);

    try {
      const response = await axiosClient.post(`/rooms/${roomId}/bookings`, {
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        adults: search.adults,
        children: search.children,
        specialRequest
      });
      setBookingMessage(response.data.message || 'Đặt phòng thành công.');
      setSpecialRequest('');
      window.dispatchEvent(new Event('hotelify-booking-change'));
      if (response.data.reservation?.id) {
        navigate(`/payment/${response.data.reservation.id}`);
      } else {
        await loadRoomDetail();
      }
    } catch (error) {
      setBookingMessage(error.response?.data?.message || 'Không thể đặt phòng.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleDetailDateApply = (range) => {
    const params = new URLSearchParams({
      checkIn: range.checkIn,
      checkOut: range.checkOut,
      adults: query.adults || '2',
      children: query.children || '0'
    });

    navigate(`/rooms/${roomId}?${params.toString()}`);
  };

  if (isLoading) {
    return <section className="room-result-state">Đang tải chi tiết phòng...</section>;
  }

  if (errorMessage || !roomData?.room) {
    return <section className="room-result-state is-error">{errorMessage || 'Không tìm thấy phòng.'}</section>;
  }

  const { room, search, otherRooms = [], reviews = [] } = roomData;
  const availability = room.availability;
  const canBook = Boolean(availability?.canBook);

  return (
    <section className="room-detail-page" aria-label="Chi tiết phòng">
      <Link to={queryString ? `/booking?${queryString}` : '/'} className="room-back-link">
        <ArrowLeft size={18} />
        {queryString ? 'Quay lại kết quả' : 'Trang chủ'}
      </Link>

      <div className="room-detail-hero">
        <img src={room.image} alt={room.name} />
      </div>

      <div className="room-detail-layout">
        <article className="room-detail-main">
          <span>Hotelify room</span>
          <h1>{room.name}</h1>
          <div className="room-result-meta">
            <span><CalendarDays size={18} />{room.area}</span>
            <span><Users size={18} />{room.guests}</span>
            <span><BedDouble size={18} />{room.beds}</span>
          </div>
          <p>{room.description}</p>

          <div className="room-detail-features">
            {(room.facilities.length > 0 ? room.facilities : ['Wi-Fi', 'Điều hòa', 'Dọn phòng', 'Minibar']).map((item) => (
              <span key={item}>
                <CheckCircle2 size={17} />
                {item}
              </span>
            ))}
          </div>
        </article>

        <aside className="room-detail-sidebar">
          <section className="room-detail-booking">
            <h2>Thông tin đặt phòng</h2>
            {search ? (
              <>
                <div>
                  <span>Ngày đến</span>
                  <strong>{formatDate(search.checkIn)}</strong>
                </div>
                <div>
                  <span>Ngày đi</span>
                  <strong>{formatDate(search.checkOut)}</strong>
                </div>
                <div>
                  <span>Khách</span>
                  <strong>{search.adults} người lớn, {search.children} trẻ em</strong>
                </div>
                <div>
                  <span>Số phòng cần</span>
                  <strong>{search.requiredRooms} phòng</strong>
                </div>
              <div>
                <span>Phòng còn</span>
                <strong>{availability?.availableRooms || 0} phòng</strong>
              </div>
              <label className="room-detail-request">
                <span>Yêu cầu thêm</span>
                <textarea
                  rows={3}
                  value={specialRequest}
                  maxLength={500}
                  placeholder="Ví dụ: phòng tầng cao, nhận phòng sớm..."
                  onChange={(event) => setSpecialRequest(event.target.value)}
                />
              </label>
              <p className={search.isAssignable ? '' : 'is-warning'}>{search.message}</p>
              <DateRangePicker
                adults={search.adults}
                children={search.children}
                className="room-detail-date-picker"
                onApply={handleDetailDateApply}
                roomId={room.id}
                triggerLabel="Thời gian lưu trú"
                triggerText="Đổi ngày"
                value={{ checkIn: search.checkIn, checkOut: search.checkOut }}
              />
              <button type="button" disabled={!canBook || isBooking} onClick={handleCreateBooking}>
                {isBooking ? 'Đang đặt...' : canBook ? 'Đặt phòng' : 'Không đủ điều kiện'}
              </button>
              {bookingMessage ? <p className="room-detail-booking-message">{bookingMessage}</p> : null}
            </>
          ) : (
              <>
                <p>Chọn ngày và số khách ở trang tìm phòng để kiểm tra tình trạng còn phòng.</p>
                <DateRangePicker
                  adults="2"
                  children="0"
                  className="room-detail-date-picker"
                  onApply={handleDetailDateApply}
                  roomId={room.id}
                  triggerLabel="Thời gian lưu trú"
                  triggerText="Đặt phòng"
                  value={{ checkIn: '', checkOut: '' }}
                />
                <Link to={`/booking?roomId=${room.id}`}>Tìm phòng nâng cao</Link>
              </>
            )}
          </section>

          <section className="room-other-card" aria-label="Phòng khác">
            <h2>Phòng khác</h2>
            <div className="room-other-list">
              {otherRooms.map((otherRoom) => (
                <Link
                  to={`/rooms/${otherRoom.id}${queryString ? `?${queryString}` : ''}`}
                  className="room-other-item"
                  key={otherRoom.id}
                >
                  <img src={otherRoom.image} alt={otherRoom.name} />
                  <span>
                    <strong>{otherRoom.name}</strong>
                    <small>{otherRoom.area} · {otherRoom.beds}</small>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <section className="room-review-section" aria-label="Đánh giá phòng">
        <div className="room-review-list">
          <header>
            <span>Đánh giá</span>
            <h2>Nhận xét của khách hàng</h2>
          </header>

          {reviews.length > 0 ? (
            reviews.map((review) => (
              <article className="room-review-item" key={review.id}>
                <div className="room-review-avatar">
                  {review.customerAvatar ? (
                    <img src={review.customerAvatar} alt={review.customerName} />
                  ) : (
                    <span>{getInitials(review.customerName)}</span>
                  )}
                </div>
                <div>
                  <header>
                    <strong>{review.customerName}</strong>
                    <small>{formatSubmittedDate(review.submittedAt)}</small>
                  </header>
                  <div className="room-review-stars" aria-label={`${review.rating} sao`}>
                    {'★'.repeat(Math.max(0, Math.min(5, Number(review.rating || 0))))}
                  </div>
                  <p>{review.text}</p>
                </div>
              </article>
            ))
          ) : (
            <div className="room-review-empty">Chưa có đánh giá nào cho phòng này.</div>
          )}
        </div>

        <form className="room-review-form" onSubmit={handleReviewSubmit}>
          <header>
            <Star size={22} />
            <h2>Bình luận về phòng</h2>
          </header>

          {!isLoggedIn ? (
            <div className="room-review-login">
              <p>Bạn cần đăng nhập để bình luận về phòng.</p>
              <Link to="/login">Đăng nhập</Link>
            </div>
          ) : (
            <>
              <label>
                <span>Số sao</span>
                <select
                  value={reviewForm.rating}
                  onChange={(event) => setReviewForm((currentForm) => ({ ...currentForm, rating: event.target.value }))}
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option value={rating} key={rating}>
                      {rating} sao
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Bình luận</span>
                <textarea
                  value={reviewForm.feedbackText}
                  rows={5}
                  maxLength={1000}
                  placeholder="Chia sẻ trải nghiệm của bạn sau khi lưu trú..."
                  onChange={(event) =>
                    setReviewForm((currentForm) => ({ ...currentForm, feedbackText: event.target.value }))
                  }
                />
              </label>
              <button type="submit" disabled={isSubmittingReview}>
                {isSubmittingReview ? 'Đang gửi...' : 'Gửi bình luận'}
              </button>
            </>
          )}

          {reviewMessage ? <p className="room-review-message">{reviewMessage}</p> : null}
        </form>
      </section>
    </section>
  );
};

export default RoomDetailPage;
