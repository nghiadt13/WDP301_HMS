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
        const response = await axiosClient.get('/rooms/list');
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
    <section className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A1120] pb-24 transition-colors duration-300" aria-label="Danh sách phòng">
      {/* Luxury Hero Banner */}
      <div className="relative h-[45vh] sm:h-[55vh] min-h-[350px] w-full overflow-hidden rounded-b-[40px] shadow-2xl">
        <img
          src={pageData.hero?.image || 'https://paddingtonbayviewhalong.com/vnt_upload/weblink/slide_1.jpg'}
          alt={pageData.hero?.title || 'Phòng nghỉ'}
          className="w-full h-full object-cover scale-105 animate-pulse-slow"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1120] via-[#0A1120]/40 to-transparent flex flex-col justify-end items-center text-center p-8 sm:p-16">
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-shimmer-gold mb-3 font-mono">
            ✦ KHÔNG GIAN LƯU TRÚ HIỆN ĐẠI & TIỆN NGHI ✦
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-3d-white max-w-4xl leading-tight mb-4">
            {pageData.hero?.title || 'DANH SÁCH PHÒNG NGHỈ'}
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-[#D4AF37] to-[#C5A880] rounded-full mb-4 shadow-sm" />
          <p className="font-sans text-base sm:text-lg text-gray-200 max-w-2xl font-medium drop-shadow-md">
            {pageData.hero?.description || 'Tận hưởng không gian phòng nghỉ thoải mái, sạch sẽ với tầm nhìn hướng ra biển hoặc thành phố cùng hệ thống trang thiết bị hiện đại cho kỳ nghỉ của bạn.'}
          </p>
        </div>
      </div>

      {/* Room Collection Grid */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 pt-16 sm:pt-24 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#92703E] dark:text-[#D4AF37] block font-mono">
            ✦ LỰA CHỌN ĐẶC QUYỀN ✦
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-3d-dark dark:text-3d-white">
            Các Hạng Phòng Lưu Trú
          </h2>
          <p className="text-sm sm:text-base text-[#525966] dark:text-gray-300 font-medium">
            Hệ thống phòng ngủ được trang bị giường êm ái, điều hòa mát lạnh và tiện nghi đầy đủ cho mọi nhu cầu lưu trú.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {pageData.rooms.map((room) => (
            <article
              key={room.id}
              className="luxury-glass-card bg-[#FFFDF9] dark:bg-[#161B26] rounded-3xl overflow-hidden border border-[#E8E4DB] dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group hover-physics"
            >
              <div className="relative aspect-16/10 overflow-hidden">
                <img
                  src={room.image}
                  alt={room.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-4 left-4 bg-[#0F131C]/80 backdrop-blur-md text-[#D4AF37] px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border border-white/15 shadow-sm">
                  Phòng Tiêu Chuẩn
                </div>
              </div>

              <div className="p-7 space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="font-display text-2xl font-extrabold text-3d-dark dark:text-3d-white group-hover:text-3d-gold transition-all">
                    {room.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5F2EB] dark:bg-white/5 text-[#1A1D24] dark:text-gray-200 text-xs font-semibold border border-[#E8E4DB] dark:border-white/10">
                      <CalendarDays size={15} className="text-[#C5A880]" />
                      {room.area}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5F2EB] dark:bg-white/5 text-[#1A1D24] dark:text-gray-200 text-xs font-semibold border border-[#E8E4DB] dark:border-white/10">
                      <Users size={15} className="text-[#C5A880]" />
                      {room.guests}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5F2EB] dark:bg-white/5 text-[#1A1D24] dark:text-gray-200 text-xs font-semibold border border-[#E8E4DB] dark:border-white/10">
                      <BedDouble size={15} className="text-[#C5A880]" />
                      {room.beds}
                    </span>
                  </div>

                  <p className="text-sm text-[#525966] dark:text-gray-400 line-clamp-3 leading-relaxed font-normal pt-1">
                    {room.description}
                  </p>
                </div>

                <div className="pt-5 border-t border-[#E8E4DB] dark:border-white/10 flex items-center gap-3">
                  <Link
                    to={`/rooms/${room.id}`}
                    className="flex-1 py-3 px-4 rounded-full border border-[#E8E4DB] dark:border-white/20 text-[#1A1D24] dark:text-white font-semibold text-xs text-center hover:border-[#C5A880] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    Xem chi tiết
                  </Link>
                  <Link
                    to={`/rooms/${room.id}`}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#0F131C] dark:bg-[#D4AF37] text-white dark:text-[#0F131C] font-semibold text-xs text-center shadow-sm hover:bg-[#1A2234] dark:hover:bg-[#E5B83B] transition-all flex items-center justify-center gap-1 group/btn"
                  >
                    <span>Đặt ngay</span>
                    <span className="text-[10px] group-hover/btn:translate-x-0.5 transition-transform">↗</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RoomListPage;
