import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, CalendarDays, Users } from 'lucide-react';

import axiosClient from '../api/axiosClient';

const RoomListPage = () => {
  const [pageData, setPageData] = useState({
    hero: null,
    rooms: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const response = await axiosClient.get('/rooms');
        setPageData({
          hero: response.data.hero || null,
          rooms: response.data.rooms || []
        });
      } catch {
        setErrorMessage('Không thể tải danh sách phòng.');
      } finally {
        setIsLoading(false);
      }
    };

    loadRooms();
  }, []);

  if (isLoading) {
    return <section className="room-result-state">Đang tải danh sách phòng...</section>;
  }

  if (errorMessage) {
    return <section className="room-result-state is-error">{errorMessage}</section>;
  }

  return (
    <section className="room-list-page" aria-label="Danh sách phòng">
      <div className="room-list-hero">
        <img
          src={pageData.hero?.image || 'https://paddingtonbayviewhalong.com/vnt_upload/weblink/slide_1.jpg'}
          alt={pageData.hero?.title || 'Phòng nghỉ'}
        />
      </div>

      <header className="room-list-intro">
        <div>
          <h1>{pageData.hero?.title || 'PHÒNG NGHỈ'}</h1>
          <span aria-hidden="true" />
          <p>{pageData.hero?.description}</p>
        </div>
      </header>

      <div className="room-list-stack">
        {pageData.rooms.map((room) => (
          <article className="room-list-item" key={room.id}>
            <img src={room.image} alt={room.name} />
            <div className="room-list-copy">
              <h2>{room.name}</h2>
              <div className="room-list-meta">
                <span><CalendarDays size={17} />{room.area}</span>
                <span><Users size={17} />{room.guests}</span>
                <span><BedDouble size={17} />{room.beds}</span>
              </div>
              <p>{room.description}</p>
              <div className="room-list-actions">
                <Link to={`/rooms/${room.id}`}>Xem chi tiết</Link>
                <Link to={`/rooms/${room.id}`}>Đặt phòng</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default RoomListPage;
