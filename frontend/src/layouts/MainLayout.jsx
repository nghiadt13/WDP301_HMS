import { Link, Outlet, useLocation } from 'react-router-dom';
import { ArrowUpRight, Building2, Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react';

import AppHeader from '../components/AppHeader.jsx';

// ─── Social Icons (Custom Clean SVG Components) ─────────────────
const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
  </svg>
);

const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const YoutubeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.47A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
    <polygon fill="white" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
  </svg>
);

const ZaloIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.03 2 11c0 2.87 1.49 5.42 3.82 7.07-.15.93-.65 3.01-.73 3.42-.04.22.1.33.27.2.22-.16 2.58-1.78 3.63-2.52.97.2 2 .33 3.01.33 5.52 0 10-4.03 10-9s-4.48-9-10-9zm1.37 11.53h-3.15c-.27 0-.5-.22-.5-.5s.23-.5.5-.5h1.79l-1.99-2.61c-.13-.17-.18-.39-.08-.59.1-.2.31-.33.53-.33h2.9c.27 0 .5.22.5.5s-.23.5-.5.5h-1.6l2.02 2.65c.14.19.17.43.05.64-.11.21-.31.34-.57.34z" />
  </svg>
);

const MainLayout = () => {
  const location = useLocation();
  const hiddenPrefixes = ['/login', '/register', '/forgot-password', '/reset-password', '/manager', '/receptionist', '/admin'];
  const shouldShowHeader = !hiddenPrefixes.some((prefix) => location.pathname.startsWith(prefix));
  const footerHiddenPrefixes = ['/login', '/register', '/manager', '/receptionist', '/admin', '/customer'];
  const shouldShowFooter = !footerHiddenPrefixes.some((prefix) => location.pathname.startsWith(prefix));

  return (
    <main className="app-shell min-h-[100dvh] flex flex-col bg-[#FDFBF7] dark:bg-[#0F131C] text-[#525966] dark:text-gray-300 transition-colors duration-300 overflow-x-hidden w-full max-w-full">
      {shouldShowHeader ? <AppHeader /> : null}
      
      <div className="flex-1 w-full">
        <Outlet />
      </div>

      {shouldShowFooter ? (
        <footer className="w-full mt-auto">
          {/* Reservation Invitation Strip */}
          <div className="border-t border-b border-[#C5A880]/30 bg-gradient-to-r from-[#FFFDF9] via-[#F5F0E6] to-[#FFFDF9] dark:from-[#0A1326] dark:via-[#101828] dark:to-[#0A1326] py-16 px-6 sm:px-12 text-center relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-10 w-96 h-96 bg-[#C5A880]/15 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#0F5132]/10 rounded-full blur-3xl pointer-events-none -z-10" />
            
            <div className="max-w-4xl mx-auto space-y-5">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.2em] font-bold bg-[#C5A880]/20 text-[#8B6B3D] dark:text-[#D4AF37] border border-[#C5A880]/30 shadow-sm font-mono">
                ✦ KHÁM PHÁ HẠ LONG CÙNG CHÚNG TÔI ✦
              </span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-3d-dark dark:text-3d-white max-w-2xl mx-auto leading-tight">
                Sẵn sàng cho một kỳ nghỉ thoải mái bên vịnh biển?
              </h2>
              <p className="font-sans text-sm sm:text-base text-[#525966] dark:text-gray-300 max-w-xl mx-auto leading-relaxed font-medium">
                Tận hưởng không gian lưu trú hiện đại, tiện nghi cùng dịch vụ chăm sóc khách hàng chu đáo 24/7 và tầm nhìn thoáng đãng hướng Vịnh Hạ Long.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/booking"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#0F131C] dark:bg-[#D4AF37] text-white dark:text-[#0F131C] font-sans text-sm font-semibold hover:bg-[#1A2234] dark:hover:bg-[#E5B83B] transition-all shadow-md group"
                >
                  <span>Đặt phòng trực tuyến</span>
                  <span className="text-xs font-bold group-hover:translate-x-0.5 transition-transform">↗</span>
                </Link>
                <a
                  href="tel:0868729129"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full border border-[#E8E4DB] dark:border-white/20 text-[#1A1D24] dark:text-white hover:border-[#C5A880] hover:bg-black/5 dark:hover:bg-white/5 transition-all font-sans text-sm font-semibold shadow-sm"
                >
                  <Phone size={16} className="text-[#C5A880]" />
                  <span>Hotline: 0868.729.129</span>
                </a>
              </div>
            </div>
          </div>

          {/* Luxury Resort Coastal Navy Footer (Replacing pitch black) */}
          <div className="bg-[#0A1326] text-[#A3AAB8] pt-20 pb-12 px-6 sm:px-12 font-sans border-t-2 border-[#C5A880]/30 shadow-2xl">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 border-b border-white/10 pb-16">
              
              {/* Col 1: Brand & VIP Guest Club (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <Link to="/" className="inline-flex items-center gap-2.5 hover:opacity-90 transition-opacity">
                  <div className="w-9 h-9 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#0A1326] shadow-sm">
                    <Building2 size={18} strokeWidth={2} />
                  </div>
                  <span className="font-display text-2xl font-bold tracking-tight text-white">
                    Hotelify<span className="text-[#D4AF37] font-sans text-xs ml-1.5 font-semibold tracking-wider uppercase">Khách Sạn 5 Sao</span>
                  </span>
                </Link>
                
                <p className="text-sm text-gray-300 leading-relaxed max-w-sm font-medium">
                  Hệ thống đặt phòng khách sạn trực tuyến hiện đại, nhanh chóng. Mang đến trải nghiệm lưu trú thoải mái, tiện nghi và chu đáo cho kỳ nghỉ tại Vịnh Hạ Long.
                </p>

                {/* VIP Guest Club Newsletter */}
                <div className="space-y-3 pt-2">
                  <p className="text-xs uppercase tracking-[0.15em] font-bold text-shimmer-gold font-mono">
                    ✦ Đăng Ký Nhận Ưu Đãi & Khuyến Mãi ✦
                  </p>
                  <form onSubmit={(e) => e.preventDefault()} className="max-w-sm flex items-center bg-white/10 border border-white/20 rounded-full p-1.5 focus-within:border-[#D4AF37] transition-colors shadow-inner">
                    <input
                      type="email"
                      placeholder="Nhập địa chỉ email của bạn..."
                      className="bg-transparent text-sm text-white placeholder:text-gray-400 px-4 py-2 flex-1 focus:outline-none font-medium"
                      required
                    />
                    <button
                      type="submit"
                      className="w-10 h-10 rounded-full bg-[#D4AF37] text-[#0A1326] font-bold flex items-center justify-center hover:bg-[#E5B83B] transition-all duration-200 shrink-0 shadow-md"
                      aria-label="Đăng ký nhận ưu đãi"
                      title="Đăng ký nhận ưu đãi"
                    >
                      ↗
                    </button>
                  </form>
                  <span className="text-[11px] text-gray-400 block font-medium">
                    Nhận đặc quyền giảm 15% cho đặt phòng sớm và ưu đãi ẩm thực độc quyền.
                  </span>
                </div>
              </div>

              {/* Col 2: Vị Trí & Liên Hệ (3 cols) */}
              <div className="lg:col-span-3 space-y-4">
                <h3 className="font-display font-extrabold text-3d-white text-base tracking-wide uppercase">
                  Vị Trí & Liên Hệ
                </h3>
                <ul className="space-y-3.5 text-sm text-[#8E96A4]">
                  <li className="flex items-start gap-2.5">
                    <MapPin size={18} className="text-[#C5A880] shrink-0 mt-0.5" />
                    <span>Bãi Cháy, TP. Hạ Long, Quảng Ninh, Việt Nam</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Phone size={18} className="text-[#C5A880] shrink-0" />
                    <a href="tel:0868729129" className="hover:text-white transition-colors font-medium text-gray-200">
                      0868.729.129
                    </a>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Mail size={18} className="text-[#C5A880] shrink-0" />
                    <a href="mailto:tinlatoi2003@gmail.com" className="hover:text-white transition-colors">
                      tinlatoi2003@gmail.com
                    </a>
                  </li>
                </ul>
              </div>

              {/* Col 3: Chính Sách Khách Sạn (2 cols) */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-display font-extrabold text-3d-white text-base tracking-wide uppercase">
                  Chính Sách
                </h3>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <Link to="/customer/policies" className="hover:text-[#C5A880] transition-colors">
                      Chính sách bảo mật
                    </Link>
                  </li>
                  <li>
                    <Link to="/customer/policies" className="hover:text-[#C5A880] transition-colors">
                      Điều khoản sử dụng
                    </Link>
                  </li>
                  <li>
                    <Link to="/customer/policies" className="hover:text-[#C5A880] transition-colors">
                      Chính sách hủy & hoàn tiền
                    </Link>
                  </li>
                  <li>
                    <Link to="/customer/policies" className="hover:text-[#C5A880] transition-colors">
                      Quy định nhận/trả phòng
                    </Link>
                  </li>
                  <li>
                    <Link to="/customer/policies" className="hover:text-[#C5A880] transition-colors">
                      Hướng dẫn thanh toán VNPAY
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Col 4: Kết Nối (2 cols) */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-display font-extrabold text-3d-white text-base tracking-wide uppercase">
                  Kết Nối
                </h3>
                <p className="text-xs text-[#8E96A4]">
                  Theo dõi hành trình nghỉ dưỡng và câu chuyện văn hóa biển Hạ Long trên mạng xã hội:
                </p>
                <div className="flex items-center gap-3 pt-1" aria-label="Social media links">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-gray-300 hover:border-[#C5A880] hover:text-[#C5A880] hover:bg-white/5 transition-all duration-200"
                    aria-label="Facebook Hotelify"
                  >
                    <FacebookIcon size={18} />
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-gray-300 hover:border-[#C5A880] hover:text-[#C5A880] hover:bg-white/5 transition-all duration-200"
                    aria-label="Instagram Hotelify"
                  >
                    <InstagramIcon size={18} />
                  </a>
                  <a
                    href="https://zalo.me/0868729129"
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-gray-300 hover:border-[#C5A880] hover:text-[#C5A880] hover:bg-white/5 transition-all duration-200"
                    aria-label="Zalo Hotelify"
                    title="Chat qua Zalo 0868729129"
                  >
                    <ZaloIcon size={18} />
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-gray-300 hover:border-[#C5A880] hover:text-[#C5A880] hover:bg-white/5 transition-all duration-200"
                    aria-label="YouTube Hotelify"
                  >
                    <YoutubeIcon size={18} />
                  </a>
                </div>
              </div>

            </div>

            {/* Copyright & Legal */}
            <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
              <p>© 2026 Hotelify Hotel System. All rights reserved.</p>
              <p className="flex items-center gap-1.5">
                <span>Dịch vụ lưu trú chất lượng bên vịnh biển.</span>
                <span className="text-[#C5A880]">✦</span>
                <span>Powered by VNPAY & MongoDB Cloud</span>
              </p>
            </div>
          </div>
        </footer>
      ) : null}
    </main>
  );
};

export default MainLayout;
