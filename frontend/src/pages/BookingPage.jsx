import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BedDouble, CalendarDays, CheckCircle2, ChevronRight, Info, Tag, Users, X } from 'lucide-react';

import axiosClient from '../api/axiosClient';
import DateRangePicker from '../components/DateRangePicker.jsx';

const BOOKING_HERO_IMAGE = 'https://cdn.xanhsm.com/2025/02/cc449227-khach-san-quan-1-view-dep-19.jpg';

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

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    currency: 'VND',
    maximumFractionDigits: 0,
    style: 'currency'
  }).format(Number(value || 0));

const getNightCount = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) {
    return 0;
  }

  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  const nights = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));

  return Math.max(0, nights);
};

const buildQueryString = (query, roomId = '') => {
  const params = new URLSearchParams({
    checkIn: query.checkIn,
    checkOut: query.checkOut,
    adults: query.adults,
    children: query.children
  });

  if (roomId) {
    params.set('roomId', roomId);
  }

  return params.toString();
};

const BookingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = useMemo(
    () => ({
      checkIn: searchParams.get('checkIn') || '',
      checkOut: searchParams.get('checkOut') || '',
      adults: searchParams.get('adults') || '1',
      children: searchParams.get('children') || '0',
      roomId: searchParams.get('roomId') || ''
    }),
    [searchParams]
  );

  const [form, setForm] = useState(query);
  const [result, setResult] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(query.roomId);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [openCalendarRoomId, setOpenCalendarRoomId] = useState('');

  const hasSearchDates = Boolean(query.checkIn && query.checkOut);
  const rooms = result?.rooms || [];
  const visibleRooms = openCalendarRoomId
    ? rooms.filter((room) => room.id === openCalendarRoomId)
    : rooms;
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) || null;
  const selectedAvailability = selectedRoom?.availability || null;
  const nights = getNightCount(query.checkIn, query.checkOut);
  const requiredRooms = result?.search?.requiredRooms || selectedAvailability?.requiredRooms || 1;
  const guestTotal = Number(query.adults || 0) + Number(query.children || 0);
  const totalAmount = Number(selectedRoom?.price || 0) * nights * requiredRooms;

  useEffect(() => {
    setForm(query);
    setSelectedRoomId(query.roomId);
  }, [query]);

  useEffect(() => {
    const loadRooms = async () => {
      setIsLoading(true);
      setErrorMessage('');
      setBookingMessage('');

      try {
        if (query.checkIn && query.checkOut) {
          const response = await axiosClient.get('/rooms/search', {
            params: {
              checkIn: query.checkIn,
              checkOut: query.checkOut,
              adults: query.adults,
              children: query.children
            }
          });
          setResult(response.data);
        } else {
          const response = await axiosClient.get('/rooms');
          setResult({
            search: null,
            rooms: response.data.rooms || []
          });
        }
      } catch (error) {
        setResult(null);
        setErrorMessage(error.response?.data?.message || 'Không thể tải danh sách phòng.');
      } finally {
        setIsLoading(false);
      }
    };

    loadRooms();
  }, [query.checkIn, query.checkOut, query.adults, query.children]);

  useEffect(() => {
    if (rooms.length === 0) {
      return;
    }

    if (selectedRoomId && rooms.some((room) => room.id === selectedRoomId)) {
      return;
    }

    const firstAvailableRoom = rooms.find((room) => room.availability?.canBook) || rooms[0];
    setSelectedRoomId(firstAvailableRoom.id);
  }, [rooms, selectedRoomId]);

  useEffect(() => {
    if (!openCalendarRoomId) {
      return;
    }

    if (!rooms.some((room) => room.id === openCalendarRoomId)) {
      setOpenCalendarRoomId('');
    }
  }, [openCalendarRoomId, rooms]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setErrorMessage('');
    setBookingMessage('');

    if (!form.checkIn || !form.checkOut) {
      setErrorMessage('Vui lòng chọn ngày đến và ngày đi.');
      return;
    }

    if (new Date(`${form.checkOut}T00:00:00`) <= new Date(`${form.checkIn}T00:00:00`)) {
      setErrorMessage('Ngày đi phải sau ngày đến.');
      return;
    }

    const params = buildQueryString(form, selectedRoomId);
    navigate(`/booking?${params}`);
  };

  const handleDateApply = (range, roomId = selectedRoomId) => {
    const nextForm = {
      ...form,
      ...range
    };
    setForm(nextForm);

    const nextRoomId = roomId || selectedRoomId;
    if (nextRoomId) {
      setSelectedRoomId(nextRoomId);
    }

    setOpenCalendarRoomId('');
    navigate(`/booking?${buildQueryString(nextForm, nextRoomId)}`);
  };

  const handleSelectRoom = (room) => {
    setSelectedRoomId(room.id);

    if (hasSearchDates) {
      navigate(`/booking?${buildQueryString(query, room.id)}`, { replace: true });
    }
  };

  const handleBook = async () => {
    setBookingMessage('');

    if (!localStorage.getItem('hotelify_token')) {
      setBookingMessage('Bạn cần đăng nhập trước khi đặt phòng.');
      navigate('/login');
      return;
    }

    if (!hasSearchDates || nights < 1) {
      setBookingMessage('Vui lòng chọn thời gian lưu trú trước khi đặt phòng.');
      return;
    }

    if (!selectedRoom) {
      setBookingMessage('Vui lòng chọn một phòng để đặt.');
      return;
    }

    if (!selectedAvailability?.canBook) {
      setBookingMessage('Phòng này không đủ số lượng trong khoảng ngày đã chọn.');
      return;
    }

    setIsBooking(true);

    try {
      const response = await axiosClient.post(`/rooms/${selectedRoom.id}/bookings`, {
        checkIn: query.checkIn,
        checkOut: query.checkOut,
        adults: query.adults,
        children: query.children
      });
      window.dispatchEvent(new Event('hotelify-booking-change'));
      navigate(`/payment/${response.data.reservation.id}`);
    } catch (error) {
      setBookingMessage(error.response?.data?.message || 'Không thể tạo đặt phòng.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <section className="booking-page" aria-label="Đặt phòng">
      <div className="booking-hero">
        <img src={BOOKING_HERO_IMAGE} alt="Hotel booking" />
      </div>

      <form className="booking-search-panel" onSubmit={handleSearchSubmit}>
        <div className="booking-search-field">
          <DateRangePicker
            adults={form.adults}
            children={form.children}
            className="booking-panel-date-picker"
            onApply={(range) => handleDateApply(range)}
            roomId={selectedRoomId}
            triggerLabel="Select dates"
            value={form}
          />
        </div>

        <label>
          <span>Select rooms and guests</span>
          <div>
            <Users size={18} />
            <select
              value={form.adults}
              onChange={(event) => setForm((current) => ({ ...current, adults: event.target.value }))}
            >
              {[1, 2, 3, 4, 5, 6].map((value) => (
                <option value={value} key={value}>
                  {value} người lớn
                </option>
              ))}
            </select>
            <select
              value={form.children}
              onChange={(event) => setForm((current) => ({ ...current, children: event.target.value }))}
            >
              {[0, 1, 2, 3, 4].map((value) => (
                <option value={value} key={value}>
                  {value} trẻ em
                </option>
              ))}
            </select>
          </div>
        </label>

        <button className="booking-promo-button" type="button">
          <Tag size={18} />
          Add promo code
        </button>

        <button className="booking-search-button" type="submit">
          Kiểm tra
        </button>
      </form>

      <div className="booking-content">
        <main className="booking-results">
          {isLoading ? (
            <div className="booking-empty-state">Đang kiểm tra phòng trống...</div>
          ) : errorMessage ? (
            <div className="booking-empty-state is-error">{errorMessage}</div>
          ) : (
            <>
              {result?.search ? (
                <div className={`booking-availability-note${result.search.isAssignable ? '' : ' is-warning'}`}>
                  {result.search.message}
                </div>
              ) : null}

              {visibleRooms.map((room) => {
                const availability = room.availability || {};
                const canBook = hasSearchDates && Boolean(availability.canBook);
                const isSelected = room.id === selectedRoomId;
                const roomTotal = Number(room.price || 0) * nights * requiredRooms;

                return (
                  <article className={`booking-room-card${isSelected ? ' is-selected' : ''}`} key={room.id}>
                    <div className="booking-room-main">
                      <div className="booking-room-image">
                        <img src={room.image} alt={room.name} />
                        <button type="button" onClick={() => handleSelectRoom(room)} aria-label={`Chọn ${room.name}`}>
                          <ChevronRight size={28} />
                        </button>
                      </div>

                      <div className="booking-room-copy">
                        <header>
                          <h2>{room.name}</h2>
                          {hasSearchDates ? (
                            <span className={canBook ? 'is-available' : 'is-sold-out'}>
                              {canBook ? `Còn ${availability.availableRooms} phòng` : 'Hết phòng'}
                            </span>
                          ) : null}
                        </header>
                        <div className="booking-room-meta">
                          <span><Users size={15} />{room.guests}</span>
                          <span><BedDouble size={15} />{room.beds}</span>
                          <span><Info size={15} />{room.area}</span>
                        </div>
                        <p>{room.description}</p>
                        <Link to={`/rooms/${room.id}?${buildQueryString(query, room.id)}`}>More info</Link>
                      </div>
                    </div>

                    {canBook ? (
                      <>
                        <div className="booking-rate-row">
                          <div>
                            <h3>Standard Rate</h3>
                            <span><CheckCircle2 size={16} />Free cancellation</span>
                            <span><CheckCircle2 size={16} />Free breakfast</span>
                            <span><CheckCircle2 size={16} />Book now, pay later</span>
                          </div>
                          <div className="booking-rate-price">
                            <strong>{formatCurrency(roomTotal)}</strong>
                            <small>Cost for {nights} night{nights > 1 ? 's' : ''}, {guestTotal} guests</small>
                            <button type="button" onClick={() => handleSelectRoom(room)}>
                              Select
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="booking-unavailable-row">
                        <strong>
                          {hasSearchDates
                            ? `${formatDate(query.checkIn)} - ${formatDate(query.checkOut)} are unavailable`
                            : 'Chọn ngày lưu trú để kiểm tra phòng khả dụng'}
                        </strong>
                        {openCalendarRoomId === room.id ? (
                          <>
                            <button
                              className="booking-calendar-close"
                              type="button"
                              onClick={() => setOpenCalendarRoomId('')}
                            >
                              <X size={20} />
                              Close room calendar
                            </button>
                            <DateRangePicker
                              adults={form.adults}
                              children={form.children}
                              className="booking-inline-calendar"
                              inline
                              onApply={(range) => handleDateApply(range, room.id)}
                              roomId={room.id}
                              value={form}
                            />
                          </>
                        ) : (
                          <button
                            className="booking-find-date-button"
                            type="button"
                            onClick={() => {
                              setSelectedRoomId(room.id);
                              setOpenCalendarRoomId(room.id);
                            }}
                          >
                            <CalendarDays size={18} />
                            Find available dates
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </>
          )}
        </main>

        <aside className="booking-summary-card">
          <div className="booking-summary-line">
            <span>{formatDate(query.checkIn)} - {formatDate(query.checkOut)}</span>
            <strong>{nights || 0} night{nights === 1 ? '' : 's'}</strong>
          </div>
          <p>{requiredRooms} room{requiredRooms > 1 ? 's' : ''}, {guestTotal || 1} guests</p>
          <hr />

          {selectedRoom ? (
            <div className="booking-selected-room">
              <img src={selectedRoom.image} alt={selectedRoom.name} />
              <span>
                <strong>{selectedRoom.name}</strong>
                <small>{formatCurrency(selectedRoom.price)} / đêm</small>
              </span>
            </div>
          ) : (
            <div className="booking-summary-empty">Select a rate to continue</div>
          )}

          <div className="booking-summary-total">
            <span>Tổng tiền tạm tính</span>
            <strong>{formatCurrency(totalAmount)}</strong>
          </div>

          <button type="button" disabled={!hasSearchDates || !selectedRoom || !selectedAvailability?.canBook || isBooking} onClick={handleBook}>
            {isBooking ? 'Đang đặt...' : 'Book'}
          </button>
          {bookingMessage ? <p>{bookingMessage}</p> : null}
        </aside>
      </div>
    </section>
  );
};

export default BookingPage;
