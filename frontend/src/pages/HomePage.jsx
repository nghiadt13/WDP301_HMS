import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Award,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Compass,
  Maximize2,
  ShieldCheck,
  Sparkles,
  Users,
  Waves
} from 'lucide-react';

import axiosClient from '../api/axiosClient';
import DateRangePicker from '../components/DateRangePicker.jsx';

const normalizeIndex = (index, length) => {
  if (length <= 0) {
    return 0;
  }
  return (index + length) % length;
};

const formatDateLabel = (value, fallback) => {
  if (!value) {
    return fallback;
  }
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(`${value}T00:00:00`));
};

const HomePage = () => {
  const navigate = useNavigate();
  const [homeData, setHomeData] = useState({
    banners: [],
    lobby: {
      eyebrow: '',
      title: '',
      description: '',
      images: []
    },
    roomIntro: null,
    rooms: []
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeLobbyIndex, setActiveLobbyIndex] = useState(0);
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [policies, setPolicies] = useState([]);
  const [bookingDates, setBookingDates] = useState({
    checkIn: '',
    checkOut: ''
  });
  const [guestCounts, setGuestCounts] = useState({
    adults: '1',
    children: '0'
  });

  const banners = homeData.banners;
  const lobbyImages = homeData.lobby.images || [];
  const roomTypes = homeData.rooms;
  const activeRoom = roomTypes[activeRoomIndex];

  useEffect(() => {
    const loadHomePage = async () => {
      try {
        const [response, policyResponse] = await Promise.all([
          axiosClient.get('/home'),
          axiosClient.get('/policies').catch(() => ({ data: { data: [] } }))
        ]);
        setHomeData({
          banners: response.data.banners || [],
          lobby: response.data.lobby || { eyebrow: '', title: '', description: '', images: [] },
          roomIntro: response.data.roomIntro || null,
          rooms: response.data.rooms || []
        });
        setPolicies(policyResponse.data.data || policyResponse.data.policies || []);
      } catch {
        setErrorMessage('Không thể tải dữ liệu trang chủ. Vui lòng kiểm tra kết nối hệ thống.');
      } finally {
        setIsLoading(false);
      }
    };

    loadHomePage();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
    setActiveLobbyIndex(0);
    setActiveRoomIndex(0);
  }, [homeData]);

  useEffect(() => {
    if (banners.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => normalizeIndex(prev + 1, banners.length));
    }, 5500);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    if (lobbyImages.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveLobbyIndex((prev) => normalizeIndex(prev + 1, lobbyImages.length));
    }, 6500);
    return () => window.clearInterval(timer);
  }, [lobbyImages.length]);

  useEffect(() => {
    if (roomTypes.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveRoomIndex((prev) => normalizeIndex(prev + 1, roomTypes.length));
    }, 6000);
    return () => window.clearInterval(timer);
  }, [roomTypes.length]);

  const goToSlide = (index) => setActiveIndex(normalizeIndex(index, banners.length));
  const goToLobbySlide = (index) => setActiveLobbyIndex(normalizeIndex(index, lobbyImages.length));
  const goToRoomSlide = (index) => setActiveRoomIndex(normalizeIndex(index, roomTypes.length));

  const policyPreview = useMemo(() => {
    return [...policies]
      .sort((first, second) => Number(first.display_order ?? first.displayOrder ?? 0) - Number(second.display_order ?? second.displayOrder ?? 0))
      .slice(0, 6);
  }, [policies]);

  const handleAvailabilitySubmit = (event) => {
    event.preventDefault();
    setBookingError('');

    if (!bookingDates.checkIn || !bookingDates.checkOut) {
      setBookingError('Vui lòng chọn ngày đến và ngày đi để tiếp tục.');
      return;
    }

    if (new Date(`${bookingDates.checkOut}T00:00:00`) <= new Date(`${bookingDates.checkIn}T00:00:00`)) {
      setBookingError('Ngày trả phòng phải diễn ra sau ngày nhận phòng.');
      return;
    }

    const params = new URLSearchParams({
      checkIn: bookingDates.checkIn,
      checkOut: bookingDates.checkOut,
      adults: guestCounts.adults,
      children: guestCounts.children
    });

    navigate(`/booking?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center bg-[#FDFBF7] dark:bg-[#0F131C] text-[#1A1D24] dark:text-white font-sans space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#C5A880] border-t-transparent animate-spin" />
        <p className="text-sm tracking-widest uppercase font-semibold text-[#B39260] animate-pulse">
          Đang tải hệ thống đặt phòng khách sạn...
        </p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#FDFBF7] dark:bg-[#0F131C] text-center px-4 font-sans">
        <div className="max-w-md p-8 rounded-3xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 space-y-4">
          <p className="text-red-600 dark:text-red-400 font-semibold text-base">{errorMessage}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-full bg-[#0F131C] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FDFBF7] dark:bg-[#0F131C] text-[#525966] dark:text-gray-300 transition-colors duration-300 overflow-x-hidden font-sans">
      
      {/* 1. HERO CINEMATIC SECTION (HANOI DAEWOO HOTEL LUXURY STYLE) */}
      <section className="relative w-full h-[85dvh] min-h-[600px] max-h-[880px] flex flex-col justify-between overflow-hidden bg-[#0A1120] text-white pt-24 sm:pt-32 pb-14 sm:pb-20">
        {/* Carousel Background */}
        <div className="absolute inset-0 z-0">
          {banners.length > 0 ? (
            banners.map((banner, index) => (
              <div
                key={banner.id || index}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === activeIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                } transition-transform duration-[7000ms]`}
              >
                <img
                  src={banner.src}
                  alt={banner.alt || 'Khu nghỉ dưỡng Vịnh Hạ Long Hotelify'}
                  className="w-full h-full object-cover object-center"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
              </div>
            ))
          ) : (
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0F131C] via-[#1E293B] to-[#0F5132]" />
          )}
        </div>

        {/* Side Banner Navigation Arrows (Floating left/right like Daewoo Hotel) */}
        {banners.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => goToSlide(activeIndex - 1)}
              className="absolute left-2 sm:left-6 md:left-10 top-1/2 -translate-y-1/2 z-20 w-10 sm:w-14 h-16 sm:h-24 flex items-center justify-center text-white/75 hover:text-white transition-all duration-300 hover:scale-110"
              aria-label="Banner trước"
            >
              <ChevronLeft size={46} strokeWidth={0.75} />
            </button>
            <button
              type="button"
              onClick={() => goToSlide(activeIndex + 1)}
              className="absolute right-2 sm:right-6 md:right-10 top-1/2 -translate-y-1/2 z-20 w-10 sm:w-14 h-16 sm:h-24 flex items-center justify-center text-white/75 hover:text-white transition-all duration-300 hover:scale-110"
              aria-label="Banner tiếp theo"
            >
              <ChevronRight size={46} strokeWidth={0.75} />
            </button>
          </>
        ) : null}

        {/* Top Spacer to push title down toward center-lower */}
        <div className="flex-1" />

        {/* Hero Content: DAEWOO HOTEL SIGNATURE ITALIC SERIF TITLE */}
        <div className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-8 pb-10 sm:pb-16 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
          <h1 className="font-display italic font-normal text-3xl sm:text-5xl md:text-6xl lg:text-[62px] text-white tracking-wide leading-[1.2] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] [text-shadow:_0_2px_15px_black]">
            Chào mừng đến với Hotelify Hạ Long
          </h1>

          {/* Banner Dots */}
          {banners.length > 1 ? (
            <div className="flex items-center justify-center gap-2.5 mt-8 sm:mt-10">
              {banners.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={`h-[3px] rounded-none transition-all duration-300 ${
                    index === activeIndex ? 'w-10 bg-white shadow-[0_0_10px_white]' : 'w-4 bg-white/40 hover:bg-white/75'
                  }`}
                  aria-label={`Chuyển đến banner ${index + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* 2. DAEWOO SIGNATURE FLAT WHITE RECTANGULAR BOOKING BAR (1:1 ARCHITECTURAL CLONE) */}
      <section className="relative z-30 max-w-6xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 mb-20 sm:mb-28">
        <div className="bg-white dark:bg-[#151B18] shadow-[0_25px_60px_rgba(0,0,0,0.25)] border border-gray-200 dark:border-white/10 rounded-none sm:rounded-xs overflow-visible">
          <form
            onSubmit={handleAvailabilitySubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-white/10"
            aria-label="Kiểm tra phòng trống"
          >
            {/* Col 1 & 2: Check-in and Check-out (6 cols total: 3 + 3) */}
            <div className="sm:col-span-2 lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-white/10">
              <DateRangePicker
                adults={guestCounts.adults}
                children={guestCounts.children}
                className="col-span-1 sm:col-span-2 w-full static"
                onApply={(range) => setBookingDates(range)}
                value={bookingDates}
                customTrigger={({ open, checkIn, checkOut }) => (
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-white/10 w-full">
                    {/* Check-in Column */}
                    <div
                      onClick={open}
                      className="p-5 sm:p-7 flex flex-col justify-center text-left hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-600 dark:text-gray-400 mb-1.5 flex items-center justify-between">
                        <span>Check-in</span>
                        <CalendarDays size={15} className="text-gray-400 group-hover:text-[#D4AF37] transition-colors duration-300" />
                      </span>
                      <span className="font-sans font-bold text-lg sm:text-xl text-[#111A15] dark:text-white truncate">
                        {checkIn ? formatDateLabel(checkIn, '') : '25/07/2026'}
                      </span>
                    </div>

                    {/* Check-out Column */}
                    <div
                      onClick={open}
                      className="p-5 sm:p-7 flex flex-col justify-center text-left hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-600 dark:text-gray-400 mb-1.5 flex items-center justify-between">
                        <span>Check-out</span>
                        <CalendarDays size={15} className="text-gray-400 group-hover:text-[#D4AF37] transition-colors duration-300" />
                      </span>
                      <span className="font-sans font-bold text-lg sm:text-xl text-[#111A15] dark:text-white truncate">
                        {checkOut ? formatDateLabel(checkOut, '') : '26/07/2026'}
                      </span>
                    </div>
                  </div>
                )}
              />
            </div>

            {/* Col 3: Guests (3 cols) */}
            <div className="sm:col-span-1 lg:col-span-3 p-5 sm:p-7 flex flex-col justify-center hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors group">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-600 dark:text-gray-400 mb-1.5 flex items-center justify-between">
                <span>Guests</span>
                <Users size={15} className="text-gray-400 group-hover:text-[#D4AF37] transition-colors duration-300" />
              </span>
              <div className="flex items-center gap-1">
                <select
                  value={guestCounts.adults}
                  onChange={(e) => setGuestCounts((prev) => ({ ...prev, adults: e.target.value }))}
                  className="font-sans font-bold text-lg sm:text-xl text-[#111A15] dark:text-white bg-transparent p-0 border-0 focus:outline-none cursor-pointer"
                  aria-label="Số lượng người lớn"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                    <option key={num} value={num} className="bg-white dark:bg-[#161B26] text-[#111A15] dark:text-white text-sm font-bold">
                      {num} Người lớn
                    </option>
                  ))}
                </select>
                <span className="text-gray-400 font-bold">,</span>
                <select
                  value={guestCounts.children}
                  onChange={(e) => setGuestCounts((prev) => ({ ...prev, children: e.target.value }))}
                  className="font-sans font-bold text-lg sm:text-xl text-[#111A15] dark:text-white bg-transparent p-0 border-0 focus:outline-none cursor-pointer"
                  aria-label="Số lượng trẻ em"
                >
                  {[0, 1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num} className="bg-white dark:bg-[#161B26] text-[#111A15] dark:text-white text-sm font-bold">
                      {num === 0 ? '0 Trẻ em' : `${num} Trẻ em`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Col 4: DAEWOO SIGNATURE BLACK-BORDERED WHITE RECTANGULAR SUBMIT BUTTON */}
            <div className="sm:col-span-1 lg:col-span-3 p-3 sm:p-4 bg-white dark:bg-[#151B18] flex items-center justify-center">
              <button
                type="submit"
                className="w-full h-full min-h-[54px] sm:min-h-[64px] px-6 rounded-none border border-[#111A15] dark:border-white bg-white dark:bg-[#151B18] hover:bg-[#111A15] dark:hover:bg-white text-[#111A15] dark:text-white hover:text-white dark:hover:text-[#111A15] font-sans font-bold text-xs sm:text-[13px] tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-xs hover:shadow-lg"
              >
                <span>ĐẶT PHÒNG NGAY</span>
              </button>
            </div>

            {bookingError ? (
              <div className="col-span-1 sm:col-span-2 lg:col-span-12 p-3.5 bg-red-50 text-red-600 text-xs font-bold text-center border-t border-red-200">
                {bookingError}
              </div>
            ) : null}
          </form>
        </div>
      </section>

      {/* 3. LOBBY & RESORT EXPERIENCE (GAPLESS BENTO GRID) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-24 sm:py-32 space-y-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-shimmer-gold flex items-center gap-2 font-mono">
              <Award size={16} className="text-[#D4AF37]" />
              <span>Tiêu Chuẩn Dịch Vụ Chất Lượng Cao</span>
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-3d-dark dark:text-3d-white leading-tight">
              {homeData.lobby.title || 'Không Gian Lưu Trú Thư Giãn & Tiện Nghi Bên Vịnh Biển'}
            </h2>
            <p className="text-base text-[#525966] dark:text-gray-300 leading-relaxed font-medium">
              {homeData.lobby.description || 'Khách sạn sở hữu vị trí giao thông thuận tiện, tầm nhìn thoáng đãng hướng ra biển cùng hệ thống phòng ngủ được trang bị đầy đủ tiện nghi hiện đại cho kỳ nghỉ của bạn.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#C5A880]/20 text-[#8B6B3D] dark:text-[#D4AF37] text-xs font-bold shadow-sm border border-[#C5A880]/30">
              <CheckCircle2 size={16} />
              <span>Hỗ trợ lễ tân & đặt phòng 24/7</span>
            </div>
          </div>
        </div>

        {/* Gapless Asymmetrical Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[260px]">
          {/* Box 1: Large Bay View (8 cols, 2 rows) */}
          <div className="md:col-span-8 md:row-span-2 rounded-3xl overflow-hidden relative group shadow-lg">
            <img
              src={lobbyImages[0]?.src || 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80'}
              alt={lobbyImages[0]?.alt || 'Tầm nhìn toàn cảnh Vịnh Hạ Long'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1120]/85 via-[#0A1120]/25 to-transparent flex flex-col justify-end p-8">
              <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold mb-2 font-mono">✦ Vị Trí Đắc Địa ✦</span>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-3d-white mb-2">
                Tầm Nhìn Hướng Biển & Thành Phố
              </h3>
              <p className="text-sm text-gray-200 max-w-lg font-medium drop-shadow-sm">
                Không gian ban công thoáng đãng giúp bạn dễ dàng ngắm nhìn trọn vẹn vẻ đẹp lung linh của Vịnh Hạ Long lúc bình minh hay hoàng hôn.
              </p>
            </div>
          </div>

          {/* Box 2: Dining & Cafe (4 cols, 1 row) */}
          <div className="md:col-span-4 md:row-span-1 rounded-3xl overflow-hidden relative group shadow-lg bg-[#FFFDF9] dark:bg-[#101828] text-[#1A1D24] dark:text-white p-7 flex flex-col justify-between border border-[#E8E4DB] dark:border-white/15">
            <div className="w-11 h-11 rounded-2xl bg-[#C5A880]/25 text-[#92703E] dark:text-[#D4AF37] flex items-center justify-center">
              <Coffee size={22} strokeWidth={2.2} />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-widest text-[#92703E] dark:text-[#D4AF37] font-bold block mb-1 font-mono">✦ Nhà Hàng & Cafe ✦</span>
              <h3 className="font-display text-xl font-extrabold text-3d-dark dark:text-3d-white mb-1">Nhà Hàng Ẩm Thực Phố Biển</h3>
              <p className="text-xs text-[#525966] dark:text-gray-300 font-medium">Phục vụ điểm tâm sáng phong phú cùng các món đặc sản hải sản Hạ Long tươi ngon trong không gian ấm cúng.</p>
            </div>
          </div>

          {/* Box 3: Amenities (4 cols, 1 row) */}
          <div className="md:col-span-4 md:row-span-1 rounded-3xl overflow-hidden relative group shadow-lg">
            <img
              src={lobbyImages[1]?.src || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80'}
              alt={lobbyImages[1]?.alt || 'Khu vực thư giãn'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1120]/90 via-[#0A1120]/30 to-transparent flex flex-col justify-end p-6">
              <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-bold uppercase mb-1 font-mono">
                <Waves size={16} />
                <span>✦ Tiện Ích ✦</span>
              </div>
              <h3 className="font-display text-xl font-extrabold text-3d-white">Khu Vực Thư Giãn Chung</h3>
            </div>
          </div>

          {/* Box 4: Tour & Support (4 cols, 1 row) */}
          <div className="md:col-span-4 md:row-span-1 rounded-3xl overflow-hidden relative group shadow-lg bg-gradient-to-br from-[#0F5132] to-[#0A3622] text-white p-7 flex flex-col justify-between border border-emerald-500/20">
            <div className="w-11 h-11 rounded-2xl bg-white/20 text-white flex items-center justify-center shadow-inner">
              <Compass size={22} strokeWidth={2} />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-widest text-emerald-300 font-bold block mb-1 font-mono">✦ Dịch Vụ Hỗ Trợ ✦</span>
              <h3 className="font-display text-xl font-extrabold text-3d-white mb-1">Dịch Vụ Đặt Tour & Xe Đưa Đón</h3>
              <p className="text-xs text-emerald-100 font-medium">Hỗ trợ tư vấn lịch trình tham quan Vịnh Hạ Long, thuê tàu, đặt xe sân bay tiện lợi và nhanh chóng.</p>
            </div>
          </div>

          {/* Box 5: Lobby Gallery Thumb (8 cols, 1 row) */}
          <div className="md:col-span-8 md:row-span-1 rounded-3xl overflow-hidden relative group shadow-lg">
            <img
              src={lobbyImages[2]?.src || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'}
              alt={lobbyImages[2]?.alt || 'Sảnh chờ khách sạn'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A1120]/85 via-[#0A1120]/40 to-transparent flex items-center justify-between p-8">
              <div className="max-w-md">
                <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold block mb-1 font-mono">✦ Đón Tiếp Tận Tâm ✦</span>
                <h3 className="font-display text-2xl font-extrabold text-3d-white mb-1">Sảnh Chờ Khách Sạn Sang Trọng</h3>
                <p className="text-xs text-gray-200 font-medium">Khu vực sảnh tiếp đón rộng rãi, điều hòa mát lạnh cùng đội ngũ nhân viên nhiệt tình, chuyên nghiệp.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/listRoom')}
                className="hidden sm:inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/40 hover:bg-white hover:text-[#0F131C] font-semibold text-xs transition-all"
              >
                <span>Khám phá ngay</span>
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BRAND STORY PARALLAX BANNER (Bright Ivory Gold Invitation Card instead of black box) */}
      {homeData.roomIntro ? (
        <section
          className="relative w-full py-28 sm:py-36 bg-fixed bg-cover bg-center overflow-hidden text-center"
          style={{ backgroundImage: `url('${homeData.roomIntro.image || 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80'}')` }}
        >
          <div className="absolute inset-0 bg-[#0A1120]/30 backdrop-blur-[1px]" />
          <div className="relative z-10 max-w-4xl mx-auto px-6">
            <div className="bg-[#FFFDF9]/95 dark:bg-[#0F172A]/90 backdrop-blur-md p-8 sm:p-14 rounded-3xl border border-[#C5A880]/40 shadow-2xl space-y-6 text-[#1A1D24] dark:text-white">
              <span className="inline-block px-4 py-1.5 rounded-full bg-[#C5A880]/15 text-[#8B6B3D] dark:text-[#D4AF37] border border-[#C5A880]/30 text-xs font-bold uppercase tracking-widest font-mono">
                ✦ PHƯƠNG CHÂM PHỤC VỤ ✦
              </span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight text-3d-dark dark:text-3d-white">
                &ldquo;{homeData.roomIntro.title}&rdquo;
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-[#D4AF37] to-[#C5A880] mx-auto rounded-full shadow-sm" />
              <p className="font-sans text-base sm:text-lg text-[#525966] dark:text-gray-200 leading-relaxed max-w-2xl mx-auto font-medium">
                {homeData.roomIntro.description}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* 5. ROOM & SUITE COLLECTION (Z-AXIS INTERACTIVE SHOWCASE) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-24 sm:py-32 space-y-16" id="rooms">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#92703E] dark:text-[#D4AF37] font-mono block">
              ✦ KHÔNG GIAN LƯU TRÚ ✦
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0F131C] dark:text-white">
              Danh Sách Phòng Nghỉ & Phòng VIP Hiện Đại
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/listRoom')}
            className="inline-flex items-center gap-2 font-semibold text-sm text-[#0F131C] dark:text-white hover:text-[#92703E] dark:hover:text-[#D4AF37] transition-colors group"
          >
            <span>Xem tất cả loại phòng ({roomTypes.length})</span>
            <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-[#92703E] dark:text-[#D4AF37]" />
          </button>
        </div>

        {/* Room Showcase Feature */}
        {activeRoom ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white dark:bg-[#161B26] rounded-3xl p-6 sm:p-10 shadow-2xl border border-[#E8E4DB] dark:border-white/10">
            {/* Left Image Showcase (7 cols) */}
            <div className="lg:col-span-7 rounded-2xl overflow-hidden relative aspect-4/3 sm:aspect-16/10 group shadow-lg">
              <img
                src={activeRoom.src}
                alt={activeRoom.alt || activeRoom.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute top-4 left-4 bg-[#0F131C]/85 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-white/10 shadow-sm">
                Hạng Phòng Được Yêu Thích
              </div>

              {/* Slider Controls inside Image */}
              {roomTypes.length > 1 ? (
                <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-full border border-white/20">
                  <button
                    type="button"
                    onClick={() => goToRoomSlide(activeRoomIndex - 1)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#C5A880] hover:text-[#0F131C] flex items-center justify-center text-white transition-all"
                    aria-label="Phòng trước"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-xs font-bold text-white px-2">
                    {activeRoomIndex + 1} / {roomTypes.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => goToRoomSlide(activeRoomIndex + 1)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#C5A880] hover:text-[#0F131C] flex items-center justify-center text-white transition-all"
                    aria-label="Phòng tiếp theo"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              ) : null}
            </div>

            {/* Right Room Details (5 cols) */}
            <div className="lg:col-span-5 space-y-6 lg:pl-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#B39260] uppercase tracking-widest block">
                  Đặc Quyền Lựa Chọn
                </span>
                <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-3d-dark dark:text-3d-white leading-tight">
                  {activeRoom.name}
                </h3>
              </div>

              {/* Amenity Pills */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F5F2EB] dark:bg-white/5 text-[#1A1D24] dark:text-gray-200 text-xs font-semibold border border-[#E8E4DB] dark:border-white/10">
                  <Maximize2 size={16} className="text-[#C5A880]" />
                  <span>{activeRoom.area || '45m²'}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F5F2EB] dark:bg-white/5 text-[#1A1D24] dark:text-gray-200 text-xs font-semibold border border-[#E8E4DB] dark:border-white/10">
                  <Users size={16} className="text-[#C5A880]" />
                  <span>{activeRoom.guests || '2 Người lớn'}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F5F2EB] dark:bg-white/5 text-[#1A1D24] dark:text-gray-200 text-xs font-semibold border border-[#E8E4DB] dark:border-white/10">
                  <BedDouble size={16} className="text-[#C5A880]" />
                  <span>{activeRoom.beds || '1 Giường King'}</span>
                </div>
              </div>

              <p className="text-sm sm:text-base text-[#525966] dark:text-gray-400 leading-relaxed">
                {activeRoom.description || 'Được thiết kế tinh xảo với nội thất gỗ tự nhiên, bồn tắm đá cẩm thạch và tầm nhìn hướng ra biển hoặc sân vườn nhiệt đới.'}
              </p>

              <div className="pt-4 border-t border-[#E8E4DB] dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate(`/booking?roomId=${activeRoom.id}`)}
                  className="flex-1 py-3.5 px-6 rounded-full bg-[#0F131C] dark:bg-[#D4AF37] text-white dark:text-[#0F131C] font-sans font-semibold text-sm transition-all shadow-md hover:bg-[#1A2234] dark:hover:bg-[#E5B83B] flex items-center justify-center gap-2 group"
                >
                  <span>Đặt phòng ngay</span>
                  <span className="text-xs font-bold group-hover:translate-x-0.5 transition-transform">↗</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/rooms/${activeRoom.id}`)}
                  className="py-3.5 px-6 rounded-full border border-[#E8E4DB] dark:border-white/20 text-[#1A1D24] dark:text-white font-semibold text-sm hover:border-[#92703E] dark:hover:border-[#D4AF37] hover:bg-black/5 dark:hover:bg-white/5 transition-all text-center"
                >
                  Khám phá chi tiết
                </button>
              </div>

              {/* Room Selector Pills */}
              {roomTypes.length > 1 ? (
                <div className="pt-4 flex items-center gap-2 overflow-x-auto pb-2">
                  {roomTypes.map((room, idx) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => goToRoomSlide(idx)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        idx === activeRoomIndex
                          ? 'bg-[#C5A880] text-[#0F131C] shadow-md font-bold'
                          : 'bg-black/5 dark:bg-white/5 text-[#525966] dark:text-gray-400 hover:bg-black/10'
                      }`}
                    >
                      {room.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#161B26] border border-[#E8E4DB] dark:border-white/10 text-gray-500">
            Chưa có danh sách phòng trong hệ thống.
          </div>
        )}
      </section>

      {/* 6. POLICIES & VIP COMMITMENTS (TRUST SECTION) */}
      <section className="bg-[#F5F2EB]/60 dark:bg-[#121620] py-24 sm:py-32 border-t border-[#E8E4DB] dark:border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-shimmer-gold flex items-center justify-center gap-2 font-mono">
              <ShieldCheck size={16} className="text-[#D4AF37]" />
              <span>✦ CAM KẾT DỊCH VỤ VÀNG ✦</span>
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-3d-dark dark:text-3d-white">
              Quy Định & Đặc Quyền Lưu Trú
            </h2>
            <p className="text-sm sm:text-base text-[#525966] dark:text-gray-300 font-medium">
              Minh bạch trong mọi quy trình đặt phòng, thanh toán an toàn qua cổng VNPAY và chính sách hoàn hủy linh hoạt dành cho quý khách hàng.
            </p>
          </div>

          {policyPreview.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {policyPreview.map((policy, idx) => (
                <div
                  key={policy._id || policy.id || idx}
                  className="luxury-glass-card bg-white dark:bg-[#161B26] p-7 rounded-3xl border border-[#E8E4DB] dark:border-white/10 space-y-4 hover:border-[#C5A880]/60 transition-all duration-300 shadow-md group hover-physics flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#F5F2EB] dark:bg-white/5 text-[#C5A880] flex items-center justify-center group-hover:bg-[#C5A880] group-hover:text-[#0F131C] transition-colors duration-300">
                      <ShieldCheck size={24} strokeWidth={1.8} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#C5A880] block">
                      {policy.category || 'Chính sách Hotelify'}
                    </span>
                    <h3 className="font-display text-xl font-extrabold text-3d-dark dark:text-3d-white group-hover:text-3d-gold transition-all">
                      {policy.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#525966] dark:text-gray-400 leading-relaxed line-clamp-3">
                      {policy.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#161B26] border border-[#E8E4DB] text-gray-500">
              Chưa có thông tin chính sách trong cơ sở dữ liệu.
            </div>
          )}

          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => navigate('/policies')}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full border border-[#1A1D24] dark:border-white/30 text-[#1A1D24] dark:text-white font-sans text-sm font-semibold hover:bg-[#1A1D24] hover:text-white dark:hover:bg-white dark:hover:text-[#0F131C] transition-all duration-300"
            >
              <span>Xem Toàn Bộ Chi Tiết Quy Định & Chính Sách</span>
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
