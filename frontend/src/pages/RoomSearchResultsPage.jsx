import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BedDouble, CalendarDays, Search, Users } from 'lucide-react';

import axiosClient from '../api/axiosClient';

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

const RoomSearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const query = useMemo(
    () => ({
      checkIn: searchParams.get('checkIn') || '',
      checkOut: searchParams.get('checkOut') || '',
      adults: searchParams.get('adults') || '1',
      children: searchParams.get('children') || '0'
    }),
    [searchParams]
  );

  const queryString = useMemo(() => new URLSearchParams(query).toString(), [query]);

  useEffect(() => {
    const loadRooms = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await axiosClient.get('/rooms/search', { params: query });
        setResult(response.data);
      } catch (error) {
        setResult(null);
        setErrorMessage(error.response?.data?.message || 'Không thể kiểm tra phòng trống. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    };

    loadRooms();
  }, [query]);

  const rooms = result?.rooms || [];
  const availableRooms = rooms.filter((room) => room.availability?.canBook);

  return (
    <section className="room-search-page" aria-label="Kết quả tìm phòng">
      <header className="room-search-hero">
        <Link to="/" className="room-back-link">
          <ArrowLeft size={18} />
          Trang chủ
        </Link>
        <span>Kết quả tìm phòng</span>
        <h1>Phòng phù hợp với lịch lưu trú</h1>
        <p>Mỗi phòng cần ít nhất 1 người lớn, tối đa 2 người lớn và kèm tối đa 1 trẻ em.</p>
      </header>

      <section className="room-search-summary" aria-label="Thông tin tìm kiếm">
        <div>
          <CalendarDays size={19} />
          <span>Ngày đến</span>
          <strong>{formatDate(query.checkIn)}</strong>
        </div>
        <div>
          <CalendarDays size={19} />
          <span>Ngày đi</span>
          <strong>{formatDate(query.checkOut)}</strong>
        </div>
        <div>
          <Users size={19} />
          <span>Khách</span>
          <strong>{query.adults} người lớn, {query.children} trẻ em</strong>
        </div>
        <div>
          <Search size={19} />
          <span>Số phòng cần</span>
          <strong>{result?.search?.requiredRooms || 0} phòng</strong>
        </div>
      </section>

      {isLoading ? (
        <div className="room-result-state">Đang kiểm tra phòng trống...</div>
      ) : errorMessage ? (
        <div className="room-result-state is-error">{errorMessage}</div>
      ) : (
        <>
          <div className={`room-result-note${result?.search?.isAssignable ? '' : ' is-warning'}`}>
            {result?.search?.message}
            {result?.search?.isAssignable ? ` Có ${availableRooms.length} loại phòng đủ số lượng.` : ''}
          </div>

          <div className="room-result-grid">
            {rooms.map((room) => {
              const availability = room.availability || {};
              const canBook = Boolean(availability.canBook);

              return (
                <article className={`room-result-card${canBook ? '' : ' is-unavailable'}`} key={room.id}>
                  <img src={room.image} alt={room.name} />
                  <div className="room-result-content">
                    <div>
                      <span className={canBook ? 'room-status is-available' : 'room-status'}>
                        {canBook ? `Còn ${availability.availableRooms} phòng` : 'Không đủ phòng'}
                      </span>
                      <h2>{room.name}</h2>
                      <p>{room.description}</p>
                    </div>

                    <div className="room-result-meta">
                      <span><CalendarDays size={17} />{room.area}</span>
                      <span><Users size={17} />{room.guests}</span>
                      <span><BedDouble size={17} />{room.beds}</span>
                    </div>

                    <div className="room-result-availability">
                      <span>Tổng: {availability.totalRooms || 0}</span>
                      <span>Đã đặt: {availability.bookedRooms || 0}</span>
                      <span>Cần: {availability.requiredRooms || result?.search?.requiredRooms || 0}</span>
                    </div>

                    <div className="room-result-actions">
                      <Link to={`/rooms/${room.id}?${queryString}`}>Xem chi tiết</Link>
                      {canBook ? (
                        <Link to={`/rooms/${room.id}?${queryString}`}>Chọn phòng</Link>
                      ) : (
                        <button type="button" disabled>
                          Không khả dụng
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};

export default RoomSearchResultsPage;
