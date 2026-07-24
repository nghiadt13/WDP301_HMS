import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble, ChevronLeft, ChevronRight, ShieldCheck, Users } from 'lucide-react';

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
        setErrorMessage('Cannot load homepage content. Please check that the backend is running.');
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
    if (banners.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => normalizeIndex(currentIndex + 1, banners.length));
    }, 5200);

    return () => window.clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    if (lobbyImages.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveLobbyIndex((currentIndex) => normalizeIndex(currentIndex + 1, lobbyImages.length));
    }, 6200);

    return () => window.clearInterval(timer);
  }, [lobbyImages.length]);

  useEffect(() => {
    if (roomTypes.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveRoomIndex((currentIndex) => normalizeIndex(currentIndex + 1, roomTypes.length));
    }, 5500);

    return () => window.clearInterval(timer);
  }, [roomTypes.length]);

  const goToSlide = (index) => {
    setActiveIndex(normalizeIndex(index, banners.length));
  };

  const goToLobbySlide = (index) => {
    setActiveLobbyIndex(normalizeIndex(index, lobbyImages.length));
  };

  const goToRoomSlide = (index) => {
    setActiveRoomIndex(normalizeIndex(index, roomTypes.length));
  };

  const policyPreview = useMemo(() => {
    return [...policies]
      .sort((first, second) => Number(first.display_order ?? first.displayOrder ?? 0) - Number(second.display_order ?? second.displayOrder ?? 0))
      .slice(0, 6);
  }, [policies]);

  const handleAvailabilitySubmit = (event) => {
    event.preventDefault();
    setBookingError('');

    if (!bookingDates.checkIn || !bookingDates.checkOut) {
      setBookingError('Vui lòng chọn ngày đến và ngày đi.');
      return;
    }

    if (new Date(`${bookingDates.checkOut}T00:00:00`) <= new Date(`${bookingDates.checkIn}T00:00:00`)) {
      setBookingError('Ngày đi phải sau ngày đến.');
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
      <section className="home-page home-state-page" aria-label="Hotelify home">
        <span>Loading homepage...</span>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="home-page home-state-page" aria-label="Hotelify home">
        <span>{errorMessage}</span>
      </section>
    );
  }

  return (
    <section className="home-page" aria-label="Hotelify home">
      <div className="home-carousel" aria-label="Hotel banners">
        <div className="home-carousel-track">
          {banners.map((banner, index) => (
            <img
              key={banner.id}
              className={`home-carousel-image${index === activeIndex ? ' is-active' : ''}`}
              src={banner.src}
              alt={banner.alt}
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          ))}
        </div>

        {banners.length > 1 ? (
          <>
            <button
              className="home-carousel-arrow home-carousel-arrow-left"
              type="button"
              onClick={() => goToSlide(activeIndex - 1)}
              aria-label="Previous banner"
            >
              <ChevronLeft size={42} strokeWidth={1.5} />
            </button>

            <button
              className="home-carousel-arrow home-carousel-arrow-right"
              type="button"
              onClick={() => goToSlide(activeIndex + 1)}
              aria-label="Next banner"
            >
              <ChevronRight size={42} strokeWidth={1.5} />
            </button>

            <div className="home-carousel-dots" aria-label="Choose banner">
              {banners.map((banner, index) => (
                <button
                  key={banner.id}
                  className={index === activeIndex ? 'is-active' : ''}
                  type="button"
                  onClick={() => goToSlide(index)}
                  aria-label={`Show banner ${index + 1}`}
                  aria-current={index === activeIndex ? 'true' : undefined}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <form className="home-booking-bar" aria-label="Check room availability" onSubmit={handleAvailabilitySubmit}>
        <div className="home-booking-date-range">
          <DateRangePicker
            adults={guestCounts.adults}
            children={guestCounts.children}
            className="home-date-range-picker"
            onApply={(range) => setBookingDates(range)}
            triggerLabel="NGÀY ĐẾN / NGÀY ĐI"
            triggerText={
              bookingDates.checkIn && bookingDates.checkOut
                ? `${formatDateLabel(bookingDates.checkIn, 'NGÀY ĐẾN')} → ${formatDateLabel(bookingDates.checkOut, 'NGÀY ĐI')}`
                : 'Chọn ngày lưu trú'
            }
            value={bookingDates}
          />
        </div>

        <label className="home-booking-select">
          <span>NGƯỜI LỚN</span>
          <select
            value={guestCounts.adults}
            aria-label="Người lớn"
            onChange={(event) => setGuestCounts((currentCounts) => ({ ...currentCounts, adults: event.target.value }))}
          >
            {[1, 2, 3, 4, 5, 6].map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="home-booking-select">
          <span>TRẺ EM</span>
          <select
            value={guestCounts.children}
            aria-label="Trẻ em"
            onChange={(event) => setGuestCounts((currentCounts) => ({ ...currentCounts, children: event.target.value }))}
          >
            {[0, 1, 2, 3, 4].map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <button type="submit">KIỂM TRA</button>
      </form>
      {bookingError ? <div className="home-booking-error">{bookingError}</div> : null}

      <section className="home-lobby-section" id="hotel-lobby" aria-label="Hotel lobby gallery">
        <div className="home-lobby-copy">
          <h2>{homeData.lobby.title}</h2>
          <p>{homeData.lobby.description}</p>
        </div>

        <div className="home-lobby-carousel">
          <div className="home-lobby-stage">
            {lobbyImages.map((image, index) => (
              <img
                key={image.id}
                className={`home-lobby-image${index === activeLobbyIndex ? ' is-active' : ''}`}
                src={image.src}
                alt={image.alt}
                loading="lazy"
              />
            ))}
          </div>

          {lobbyImages.length > 1 ? (
            <>
              <button
                className="home-lobby-arrow home-lobby-arrow-left"
                type="button"
                onClick={() => goToLobbySlide(activeLobbyIndex - 1)}
                aria-label="Previous lobby image"
              >
                <ChevronLeft size={32} strokeWidth={1.6} />
              </button>

              <button
                className="home-lobby-arrow home-lobby-arrow-right"
                type="button"
                onClick={() => goToLobbySlide(activeLobbyIndex + 1)}
                aria-label="Next lobby image"
              >
                <ChevronRight size={32} strokeWidth={1.6} />
              </button>

              <div className="home-lobby-thumbs" aria-label="Choose lobby image">
                {lobbyImages.map((image, index) => (
                  <button
                    key={image.id}
                    className={index === activeLobbyIndex ? 'is-active' : ''}
                    type="button"
                    onClick={() => goToLobbySlide(index)}
                    aria-label={`Show lobby image ${index + 1}`}
                    aria-current={index === activeLobbyIndex ? 'true' : undefined}
                  >
                    <img src={image.src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>

      {homeData.roomIntro ? (
        <section
          className="home-room-parallax"
          id="room-types"
          aria-label="Room types introduction"
          style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.04), rgba(255,255,255,0.04)), url('${homeData.roomIntro.image}')` }}
        >
          <div className="home-room-frame">
            <div className="home-room-card">
              <h2>{homeData.roomIntro.title}</h2>
              <span aria-hidden="true" />
              <p>{homeData.roomIntro.description}</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="home-rooms-section" id="amenities" aria-label="Các loại phòng khách sạn">
        {activeRoom ? (
          <div className="home-rooms-carousel">
            <div className="home-rooms-stage">
              {roomTypes.map((room, index) => (
                <img
                  key={room.id}
                  className={`home-rooms-image${index === activeRoomIndex ? ' is-active' : ''}`}
                  src={room.src}
                  alt={room.alt}
                  loading="lazy"
                />
              ))}

              {roomTypes.length > 1 ? (
                <>
                  <button
                    className="home-rooms-arrow home-rooms-arrow-left"
                    type="button"
                    onClick={() => goToRoomSlide(activeRoomIndex - 1)}
                    aria-label="Phòng trước"
                  >
                    <ChevronLeft size={32} strokeWidth={1.6} />
                  </button>

                  <button
                    className="home-rooms-arrow home-rooms-arrow-right"
                    type="button"
                    onClick={() => goToRoomSlide(activeRoomIndex + 1)}
                    aria-label="Phòng tiếp theo"
                  >
                    <ChevronRight size={32} strokeWidth={1.6} />
                  </button>

                  <div className="home-rooms-dots" aria-label="Chọn loại phòng">
                    {roomTypes.map((room, index) => (
                      <button
                        key={room.id}
                        className={index === activeRoomIndex ? 'is-active' : ''}
                        type="button"
                        onClick={() => goToRoomSlide(index)}
                        aria-label={`Xem ${room.name}`}
                        aria-current={index === activeRoomIndex ? 'true' : undefined}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <div className="home-rooms-info" key={activeRoom.id}>
              <h3 className="home-rooms-name">{activeRoom.name}</h3>
              <div className="home-rooms-meta">
                <span className="home-rooms-meta-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                  {activeRoom.area}
                </span>
                <span className="home-rooms-meta-item">
                  <Users size={18} strokeWidth={1.8} aria-hidden="true" />
                  {activeRoom.guests}
                </span>
                <span className="home-rooms-meta-item">
                  <BedDouble size={18} strokeWidth={1.8} aria-hidden="true" />
                  {activeRoom.beds}
                </span>
              </div>
              <p className="home-rooms-desc">{activeRoom.description}</p>
              <div className="home-rooms-actions">
                <button
                  type="button"
                  className="home-rooms-btn-outline"
                  onClick={() => navigate(`/rooms/${activeRoom.id}`)}
                >
                  Xem chi tiết
                </button>
                <button
                  type="button"
                  className="home-rooms-btn-solid"
                  onClick={() => navigate(`/booking?roomId=${activeRoom.id}`)}
                >
                  Đặt phòng
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="home-empty-state">Chưa có dữ liệu phòng trong database.</div>
        )}
      </section>

      <section className="home-policy-section" id="hotel-policies" aria-label="Chính sách khách sạn">
        <div className="home-policy-heading">
          <span>Chính sách Hotelify</span>
          <h2>Thông tin cần biết trước khi lưu trú</h2>
          <p>Khách hàng có thể xem nhanh các quy định về đặt phòng, thanh toán, nhận phòng, trả phòng và lưu trú ngay từ trang chủ.</p>
        </div>

        {policyPreview.length > 0 ? (
          <div className="home-policy-grid">
            {policyPreview.map((policy) => (
              <article className="home-policy-card" key={policy._id || policy.id || policy.title}>
                <div className="home-policy-icon">
                  <ShieldCheck size={20} />
                </div>
                <span>{policy.category || 'Chính sách'}</span>
                <h3>{policy.title}</h3>
                <p>{policy.content}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="home-empty-state">Chưa có chính sách khách sạn đang áp dụng.</div>
        )}

        <button type="button" className="home-policy-button" onClick={() => navigate('/policies')}>
          Xem toàn bộ chính sách
        </button>
      </section>
    </section>
  );
};

export default HomePage;
