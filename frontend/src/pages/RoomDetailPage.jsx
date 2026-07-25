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
  String(name || 'Khách hàng Hotelify')
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
    <section className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A1120] pb-24 transition-colors duration-300" aria-label="Chi tiết phòng">
      {/* Top Back Link & Navigation */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 pt-8 pb-4">
        <Link
          to={queryString ? `/booking?${queryString}` : '/listRoom'}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#525966] dark:text-gray-300 hover:text-[#92703E] dark:hover:text-[#D4AF37] transition-all py-2.5 px-4 rounded-full bg-white dark:bg-white/5 border border-[#E8E4DB] dark:border-white/10 shadow-sm hover:shadow hover:-translate-y-0.5"
        >
          <ArrowLeft size={16} className="text-[#C5A880]" />
          <span>{queryString ? 'Quay lại kết quả tìm kiếm' : 'Danh sách phòng'}</span>
        </Link>
      </div>

      {/* Bright Royalty Showcase Card Banner */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 mb-12">
        <div className="bg-[#FFFDF9] dark:bg-[#161B26] rounded-[36px] shadow-2xl border border-[#E8E4DB] dark:border-white/10 overflow-hidden">
          <div className="relative h-[40vh] sm:h-[50vh] w-full overflow-hidden group">
            <img
              src={room.image}
              alt={room.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          </div>
          <div className="p-8 sm:p-10 text-center bg-gradient-to-b from-[#FFFDF9] to-white dark:from-[#161B26] dark:to-[#0F131C] border-t border-[#E8E4DB] dark:border-white/10">
            <span className="inline-block text-xs uppercase tracking-[0.25em] font-bold text-[#92703E] dark:text-[#D4AF37] mb-2 font-mono bg-[#F5F2EB] dark:bg-white/5 py-1 px-4 rounded-full border border-[#E8E4DB] dark:border-white/10">
              ✦ KHÔNG GIAN PHÒNG HIỆN ĐẠI & TIỆN NGHI ✦
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-[#111A15] dark:text-white mt-1">
              {room.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Detail Layout Grid */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Room Info & Amenities (7 cols) */}
        <div className="lg:col-span-7 space-y-10">
          <div className="luxury-glass-card bg-[#FFFDF9] dark:bg-[#161B26] p-8 sm:p-10 rounded-3xl border border-[#E8E4DB] dark:border-white/10 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center gap-3 border-b border-[#E8E4DB] dark:border-white/10 pb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#F5F2EB] dark:bg-white/5 text-[#1A1D24] dark:text-gray-200 text-sm font-semibold border border-[#E8E4DB] dark:border-white/10">
                <CalendarDays size={18} className="text-[#C5A880]" />
                <span>{room.area}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#F5F2EB] dark:bg-white/5 text-[#1A1D24] dark:text-gray-200 text-sm font-semibold border border-[#E8E4DB] dark:border-white/10">
                <Users size={18} className="text-[#C5A880]" />
                <span>{room.guests}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#F5F2EB] dark:bg-white/5 text-[#1A1D24] dark:text-gray-200 text-sm font-semibold border border-[#E8E4DB] dark:border-white/10">
                <BedDouble size={18} className="text-[#C5A880]" />
                <span>{room.beds}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-2xl font-extrabold text-3d-dark dark:text-3d-white">
                Trải Nghiệm Lưu Trú
              </h2>
              <p className="font-sans text-base text-[#525966] dark:text-gray-300 leading-relaxed font-normal">
                {room.description}
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#E8E4DB] dark:border-white/10">
              <h3 className="font-display text-xl font-bold text-[#1A1D24] dark:text-white">
                Tiện Nghi & Đặc Quyền Riêng
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(room.facilities.length > 0 ? room.facilities : ['Wi-Fi tốc độ cao', 'Điều hòa tự động', 'Dọn phòng 24/7', 'Vật tư cao cấp', 'Bữa sáng VIP', 'Ban công hướng biển']).map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-medium text-[#525966] dark:text-gray-200 bg-[#F5F2EB]/60 dark:bg-white/5 p-3 rounded-xl border border-[#E8E4DB]/50 dark:border-white/5">
                    <CheckCircle2 size={16} className="text-[#C5A880] shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="luxury-glass-card bg-[#FFFDF9] dark:bg-[#161B26] p-8 sm:p-10 rounded-3xl border border-[#E8E4DB] dark:border-white/10 shadow-xl space-y-8">
            <div className="flex items-center justify-between border-b border-[#E8E4DB] dark:border-white/10 pb-6">
              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-shimmer-gold font-mono block mb-1">
                  ✦ Ý KIẾN KHÁCH HÀNG ✦
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-3d-dark dark:text-3d-white">
                  Đánh Giá Trải Nghiệm
                </h2>
              </div>
            </div>

            <div className="space-y-6">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="p-5 rounded-2xl bg-white dark:bg-black/20 border border-[#E8E4DB] dark:border-white/5 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8B6B3D] text-[#0F131C] font-bold flex items-center justify-center text-sm shadow-inner overflow-hidden">
                          {review.customerAvatar ? (
                            <img src={review.customerAvatar} alt={review.customerName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{getInitials(review.customerName)}</span>
                          )}
                        </div>
                        <div>
                          <strong className="font-display font-bold text-sm text-[#1A1D24] dark:text-white block">{review.customerName}</strong>
                          <small className="text-xs text-gray-400 font-sans">{formatSubmittedDate(review.submittedAt)}</small>
                        </div>
                      </div>
                      <div className="flex items-center text-[#D4AF37] text-sm font-bold tracking-wider" aria-label={`${review.rating} sao`}>
                        {'★'.repeat(Math.max(0, Math.min(5, Number(review.rating || 0))))}
                      </div>
                    </div>
                    <p className="text-sm text-[#525966] dark:text-gray-300 leading-relaxed pl-13">
                      {review.text}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center rounded-2xl bg-[#F5F2EB]/50 dark:bg-white/5 border border-dashed border-[#C5A880]/30 text-gray-500 font-medium">
                  Chưa có đánh giá nào cho căn phòng này. Hãy là người đầu tiên chia sẻ trải nghiệm!
                </div>
              )}
            </div>

            {/* Review Form */}
            <form onSubmit={handleReviewSubmit} className="pt-6 border-t border-[#E8E4DB] dark:border-white/10 space-y-5">
              <div className="flex items-center gap-2">
                <Star size={20} className="text-[#C5A880]" />
                <h3 className="font-display text-xl font-bold text-[#1A1D24] dark:text-white">Viết Bình Luận Của Bạn</h3>
              </div>

              {!isLoggedIn ? (
                <div className="p-6 rounded-2xl bg-[#F5F2EB] dark:bg-white/5 border border-[#E8E4DB] dark:border-white/10 text-center space-y-3">
                  <p className="text-sm text-[#525966] dark:text-gray-300 font-medium">Quý khách vui lòng đăng nhập vào hệ thống để gửi bình luận và đánh giá sao.</p>
                  <Link to="/login" className="inline-block px-6 py-2 rounded-xl bg-[#0F131C] dark:bg-[#D4AF37] text-white dark:text-[#0F131C] font-semibold text-xs shadow-sm hover:bg-[#1A2234]">
                    Đăng nhập ngay
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-full sm:w-1/3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#525966] dark:text-gray-300 mb-1.5">
                      Đánh Giá Sao
                    </label>
                    <select
                      value={reviewForm.rating}
                      onChange={(event) => setReviewForm((currentForm) => ({ ...currentForm, rating: event.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8E4DB] dark:border-white/15 bg-white dark:bg-black/30 text-sm font-semibold text-[#1A1D24] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
                    >
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <option value={rating} key={rating}>
                          {rating} sao {rating === 5 ? '✦ Tuyệt vời' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#525966] dark:text-gray-300 mb-1.5">
                      Nội Dung Bình Luận
                    </label>
                    <textarea
                      value={reviewForm.feedbackText}
                      rows={4}
                      maxLength={1000}
                      placeholder="Chia sẻ cảm nhận của bạn về tiện nghi, dịch vụ và tầm nhìn của căn phòng..."
                      onChange={(event) =>
                        setReviewForm((currentForm) => ({ ...currentForm, feedbackText: event.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-[#E8E4DB] dark:border-white/15 bg-white dark:bg-black/30 text-sm font-normal text-[#1A1D24] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-8 py-3 rounded-xl bg-[#0F131C] dark:bg-[#D4AF37] text-white dark:text-[#0F131C] font-semibold text-xs shadow-md hover:bg-[#1A2234] disabled:opacity-50"
                  >
                    {isSubmittingReview ? 'Đang gửi đánh giá...' : 'Gửi bình luận'}
                  </button>
                </div>
              )}

              {reviewMessage ? <p className="text-sm font-semibold text-[#92703E] dark:text-[#D4AF37] pt-2">{reviewMessage}</p> : null}
            </form>
          </div>
        </div>

        {/* Right Column: Booking Box & Other Rooms Sidebar (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          <div className="luxury-glass-card bg-[#FFFDF9] dark:bg-[#161B26] p-8 rounded-3xl border border-[#E8E4DB] dark:border-white/10 shadow-2xl sticky top-28 space-y-6">
            <div className="border-b border-[#E8E4DB] dark:border-white/10 pb-4">
              <span className="text-xs uppercase tracking-widest font-bold text-shimmer-gold font-mono block mb-1">
                ✦ ĐẶT PHÒNG TRỰC TUYẾN ✦
              </span>
              <h2 className="font-display text-2xl font-extrabold text-3d-dark dark:text-3d-white">
                Yêu Cầu Đặt Phòng
              </h2>
            </div>

            {search ? (
              <div className="space-y-4 text-sm font-medium">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F2EB]/70 dark:bg-white/5 border border-[#E8E4DB]/50 dark:border-white/5">
                  <span className="text-[#525966] dark:text-gray-400">Ngày đến</span>
                  <strong className="text-[#1A1D24] dark:text-white font-bold">{formatDate(search.checkIn)}</strong>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F2EB]/70 dark:bg-white/5 border border-[#E8E4DB]/50 dark:border-white/5">
                  <span className="text-[#525966] dark:text-gray-400">Ngày đi</span>
                  <strong className="text-[#1A1D24] dark:text-white font-bold">{formatDate(search.checkOut)}</strong>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F2EB]/70 dark:bg-white/5 border border-[#E8E4DB]/50 dark:border-white/5">
                  <span className="text-[#525966] dark:text-gray-400">Khách lưu trú</span>
                  <strong className="text-[#1A1D24] dark:text-white font-bold">{search.adults} lớn, {search.children} trẻ em</strong>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F2EB]/70 dark:bg-white/5 border border-[#E8E4DB]/50 dark:border-white/5">
                  <span className="text-[#525966] dark:text-gray-400">Số lượng cần</span>
                  <strong className="text-[#1A1D24] dark:text-white font-bold">{search.requiredRooms} phòng</strong>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F2EB]/70 dark:bg-white/5 border border-[#E8E4DB]/50 dark:border-white/5">
                  <span className="text-[#525966] dark:text-gray-400">Phòng trống</span>
                  <strong className="text-[#D4AF37] font-bold">{availability?.availableRooms || 0} phòng</strong>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#525966] dark:text-gray-300 mb-1.5">
                    Yêu cầu đặc biệt (Ghi chú nhận phòng sớm, tầng cao, yên tĩnh...)
                  </label>
                  <textarea
                    rows={3}
                    value={specialRequest}
                    maxLength={500}
                    placeholder="Ghi chú thêm cho bộ phận đón tiếp..."
                    onChange={(event) => setSpecialRequest(event.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E4DB] dark:border-white/15 bg-white dark:bg-black/30 text-xs text-[#1A1D24] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
                  />
                </div>

                <p className={`text-xs font-semibold ${search.isAssignable ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {search.message}
                </p>

                <div className="pt-2">
                  <DateRangePicker
                    adults={search.adults}
                    children={search.children}
                    className="w-full"
                    onApply={handleDetailDateApply}
                    roomId={room.id}
                    triggerLabel="Thời gian lưu trú"
                    triggerText="Đổi thời gian khác"
                    value={{ checkIn: search.checkIn, checkOut: search.checkOut }}
                  />
                </div>

                <button
                  type="button"
                  disabled={!canBook || isBooking}
                  onClick={handleCreateBooking}
                  className="w-full py-3.5 rounded-2xl bg-[#0F131C] dark:bg-[#D4AF37] text-white dark:text-[#0F131C] font-semibold text-sm shadow-md hover:bg-[#1A2234] disabled:opacity-50 flex items-center justify-center gap-2 group mt-4"
                >
                  <span>{isBooking ? 'Đang xử lý đặt phòng...' : canBook ? 'Xác nhận đặt phòng' : 'Hết phòng trống'}</span>
                  {canBook ? <span className="text-xs font-bold group-hover:translate-x-0.5 transition-transform">↗</span> : null}
                </button>

                {bookingMessage ? <p className="text-xs font-semibold text-red-500 text-center pt-2">{bookingMessage}</p> : null}
              </div>
            ) : (
              <div className="space-y-5 text-center py-4">
                <p className="text-sm text-[#525966] dark:text-gray-300 font-medium leading-relaxed">
                  Quý khách vui lòng chọn ngày đến, ngày đi và số lượng khách để kiểm tra tình trạng phòng trống chính xác.
                </p>
                <DateRangePicker
                  adults="2"
                  children="0"
                  className="w-full"
                  onApply={handleDetailDateApply}
                  roomId={room.id}
                  triggerLabel="Thời gian lưu trú"
                  triggerText="Chọn Ngày Lưu Trú"
                  value={{ checkIn: '', checkOut: '' }}
                />
                <div className="pt-2">
                  <Link
                    to={`/booking?roomId=${room.id}`}
                    className="inline-block text-xs font-bold uppercase tracking-wider text-[#C5A880] hover:underline"
                  >
                    Tìm kiếm phòng nâng cao ↗
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Other Rooms Suggestion */}
          {otherRooms.length > 0 ? (
            <div className="luxury-glass-card bg-[#FFFDF9] dark:bg-[#161B26] p-7 rounded-3xl border border-[#E8E4DB] dark:border-white/10 shadow-lg space-y-5">
              <h3 className="font-display text-xl font-extrabold text-3d-dark dark:text-3d-white border-b border-[#E8E4DB] dark:border-white/10 pb-3">
                Các Hạng Phòng Khác
              </h3>
              <div className="space-y-4">
                {otherRooms.map((otherRoom) => (
                  <Link
                    to={`/rooms/${otherRoom.id}${queryString ? `?${queryString}` : ''}`}
                    key={otherRoom.id}
                    className="flex items-center gap-4 p-3 rounded-2xl bg-white dark:bg-black/20 border border-[#E8E4DB]/60 dark:border-white/5 hover:border-[#C5A880] transition-all group shadow-sm"
                  >
                    <img src={otherRoom.image} alt={otherRoom.name} className="w-20 h-16 object-cover rounded-xl shrink-0 group-hover:scale-105 transition-transform" />
                    <div className="min-w-0 flex-1">
                      <strong className="font-display font-bold text-sm text-[#1A1D24] dark:text-white group-hover:text-[#C5A880] transition-colors truncate block">
                        {otherRoom.name}
                      </strong>
                      <small className="text-xs text-[#525966] dark:text-gray-400 font-sans block mt-0.5">
                        {otherRoom.area} · {otherRoom.beds}
                      </small>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default RoomDetailPage;
