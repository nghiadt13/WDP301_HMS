import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Building2, CalendarDays, Globe, LogOut, Menu, Phone, Search, ShieldCheck, Sparkles, User, X } from 'lucide-react';

import { getCustomerFeedbackStatus } from '../features/customer/api/customerApi';

const readStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('hotelify_user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(readStoredUser);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const syncUser = () => {
      setUser(readStoredUser());
      setIsProfileMenuOpen(false);
    };

    window.addEventListener('hotelify-auth-change', syncUser);
    window.addEventListener('storage', syncUser);

    return () => {
      window.removeEventListener('hotelify-auth-change', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return undefined;
    }

    const closeProfileMenu = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', closeProfileMenu);
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('keydown', closeProfileMenu);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isProfileMenuOpen]);

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'VIP';

  const roleName = String(user?.role?.name || user?.role_name || user?.role || '').toLowerCase();
  const isCustomer = roleName.includes('customer') || roleName.includes('khách');
  const isManager = roleName.includes('manager');
  const isReceptionist = roleName.includes('receptionist');
  const hasDashboard = isManager || isReceptionist;
  const dashboardUrl = isManager ? '/manager' : isReceptionist ? '/receptionist' : '';

  useEffect(() => {
    if (!isCustomer || !localStorage.getItem('hotelify_token')) {
      setPendingFeedbackCount(0);
      return;
    }

    let isMounted = true;
    getCustomerFeedbackStatus()
      .then((status) => {
        if (isMounted) {
          setPendingFeedbackCount(Number(status.pendingCount || 0));
        }
      })
      .catch(() => {
        if (isMounted) {
          setPendingFeedbackCount(0);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isCustomer, user?._id]);

  const handleLogout = () => {
    localStorage.removeItem('hotelify_token');
    localStorage.removeItem('hotelify_user');
    setUser(null);
    setIsProfileMenuOpen(false);
    window.dispatchEvent(new Event('hotelify-auth-change'));
    navigate('/login', { replace: true });
  };

  const navLinks = [
    { name: 'TRANG CHỦ', path: '/' },
    { name: 'PHÒNG NGHỈ', path: '/listRoom' },
    { name: 'ĐẶT PHÒNG', path: '/booking' },
    { name: 'CHÍNH SÁCH', path: isCustomer ? '/customer/policies' : '/policies' }
  ];

  if (isCustomer) {
    navLinks.push({
      name: 'GÓP Ý & ĐÁNH GIÁ',
      path: '/customer/feedback',
      badge: pendingFeedbackCount > 0 ? pendingFeedbackCount : null
    });
  }

  const isHome = location.pathname === '/';

  return (
    <header
      className={`w-full font-sans transition-all duration-500 z-50 ${
        isHome && !scrolled
          ? 'absolute top-0 left-0 bg-gradient-to-b from-black/80 via-black/35 to-transparent pt-4 sm:pt-6 pb-4'
          : scrolled
          ? 'fixed top-0 left-0 bg-[#0A1120]/95 dark:bg-[#0A0F0D]/95 backdrop-blur-2xl shadow-2xl border-b border-white/15 py-3 animate-in fade-in duration-300'
          : 'sticky top-0 bg-[#0A1120] dark:bg-[#0A0F0D] shadow-2xl border-b border-white/20 py-3 sm:py-4'
      }`}
    >
      {/* 1. DAEWOO SIGNATURE TOP-CENTERED EMBLEM (Only shown on Home Hero top state for cinematic grandeur) */}
      {isHome && !scrolled ? (
        <div className="w-full flex flex-col items-center justify-center text-center pb-4 sm:pb-6 border-b border-white/15 animate-in fade-in duration-700">
          <Link to="/" className="flex flex-col items-center group" aria-label="Trang chủ Hotelify Hạ Long">
            {/* Delicate Monogram Emblem */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-white/70 flex items-center justify-center p-1 shadow-[0_4px_15px_rgba(0,0,0,0.6)] bg-black/20 group-hover:scale-105 transition-transform duration-500">
              <span className="font-display text-xl sm:text-2xl font-normal !text-white" style={{ color: '#FFFFFF', textShadow: '0 2px 4px #000' }}>H</span>
            </div>
            {/* Centered Stately Typography */}
            <span className="font-display text-lg sm:text-2xl font-normal tracking-[0.22em] sm:tracking-[0.26em] !text-white uppercase mt-2" style={{ color: '#FFFFFF', textShadow: '0 2px 8px #000, 0 0 20px rgba(0,0,0,0.8)' }}>
              HOTELIFY
            </span>
            <span className="font-sans text-[9px] sm:text-[11px] tracking-[0.32em] font-extrabold !text-white uppercase mt-0.5" style={{ color: '#FFFFFF', textShadow: '0 1px 4px #000, 0 0 15px rgba(0,0,0,0.8)' }}>
              KHU NGHỈ DƯỠNG VỊNH HẠ LONG
            </span>
          </Link>
        </div>
      ) : null}

      {/* 2. MAIN HORIZONTAL NAVIGATION ROW (HANOI DAEWOO HOTEL ARCHITECTURE) */}
      <div className={`w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between gap-3 md:gap-6 ${isHome && !scrolled ? 'pt-4 sm:pt-5' : ''}`}>
        
        {/* LEFT: MINIMALIST HAMBURGER MENU & 24/7 SUPPORT */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <button
            type="button"
            className="p-1.5 sm:p-2 !text-white hover:!text-[#D4AF37] transition-colors focus:outline-none flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
            style={{ color: '#FFFFFF' }}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
          >
            {isMobileMenuOpen ? <X size={28} strokeWidth={2} /> : <Menu size={28} strokeWidth={2} />}
          </button>

          {/* Inline Compact Logo when scrolled or not on home */}
          {!isHome || scrolled ? (
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center bg-black/20">
                <span className="font-display text-base font-normal !text-white" style={{ color: '#FFFFFF' }}>H</span>
              </div>
              <span className="font-display text-base sm:text-lg tracking-[0.2em] font-normal !text-white uppercase" style={{ color: '#FFFFFF' }}>
                HOTELIFY
              </span>
            </Link>
          ) : (
            <a
              href="tel:0868729129"
              className="hidden lg:flex items-center gap-2 !text-white hover:!text-[#D4AF37] font-sans text-[13px] font-extrabold tracking-[0.18em] uppercase transition-colors"
              style={{ color: '#FFFFFF', textShadow: '0 2px 4px #000, 0 0 15px rgba(0,0,0,0.8)' }}
              title="Hỗ trợ đặt phòng 24/7"
            >
              <Phone size={15} strokeWidth={2.5} className="!text-[#D4AF37] drop-shadow-[0_1px_2px_black]" style={{ color: '#D4AF37' }} />
              <span>0868 729 129</span>
            </a>
          )}
        </div>

        {/* CENTER: CRISP WHITE UPPERCASE NAVIGATION LINKS (DAEWOO HOTEL STYLE) */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-8 font-sans text-xs xl:text-[13px] font-extrabold tracking-[0.18em] xl:tracking-[0.22em] uppercase" aria-label="Điều hướng chính">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`py-1 relative transition-all duration-300 whitespace-nowrap shrink-0 group ${
                  isActive ? '!text-[#D4AF37] font-extrabold scale-105' : '!text-white hover:!text-[#D4AF37]'
                }`}
                style={
                  isActive
                    ? { color: '#D4AF37', textShadow: '0 2px 4px #000, 0 0 15px rgba(0,0,0,0.8)' }
                    : { color: '#FFFFFF', textShadow: '0 2px 4px #000, 0 0 15px rgba(0,0,0,0.8)' }
                }
              >
                <span>{link.name}</span>
                {link.badge ? (
                  <span className="ml-1.5 inline-flex items-center justify-center bg-[#DC2626] !text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full min-w-3.5 h-3.5 shadow-md" style={{ color: '#FFFFFF' }}>
                    {link.badge}
                  </span>
                ) : null}

                {/* Minimalist Bottom Underline on Hover/Active */}
                <span className={`absolute bottom-0 left-0 h-[2px] bg-[#D4AF37] transition-all duration-300 shadow-[0_1px_3px_black] ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </Link>
            );
          })}
        </nav>

        {/* RIGHT: ACCOUNT PORTAL & RECTANGULAR WHITE "BOOK NOW" BUTTON */}
        <div className="flex items-center gap-4 sm:gap-5 xl:gap-7 shrink-0">
          {/* Search Icon */}
          <Link
            to="/listRoom"
            className="p-2 !text-white hover:!text-[#D4AF37] transition-colors"
            style={{ color: '#FFFFFF', textShadow: '0 2px 4px #000, 0 0 15px rgba(0,0,0,0.8)' }}
            aria-label="Tìm kiếm phòng nghỉ"
            title="Tìm kiếm phòng nghỉ"
          >
            <Search size={20} strokeWidth={2.5} style={{ color: 'inherit' }} />
          </Link>

          {/* User Profile / Login Link */}
          {user ? (
            <div className="relative shrink-0" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 font-extrabold !text-white hover:!text-[#D4AF37] transition-all py-1.5 px-3.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md text-xs sm:text-[13px] shadow-lg"
                style={{ color: '#FFFFFF', textShadow: '0 1px 3px #000' }}
              >
                <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-[#0A1120] text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                  {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : initials[0]}
                </span>
                <span className="max-w-20 sm:max-w-24 truncate font-extrabold">{user.full_name?.split(' ').slice(-1)[0] || 'Tài khoản'}</span>
                <span className="text-[9px] opacity-80">▼</span>
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen ? (
                <div className="absolute right-0 mt-3 w-64 bg-[#0A1120] text-white rounded-2xl p-3.5 shadow-2xl border border-white/20 animate-in fade-in zoom-in-95 duration-150 z-50 text-left">
                  <div className="p-3 mb-2.5 rounded-xl bg-white/[0.08] border border-white/15">
                    <p className="font-display font-bold text-sm text-white truncate">{user.full_name}</p>
                    <p className="font-sans text-xs text-[#D4AF37] truncate mt-0.5">{user.email || 'Khách hàng VIP'}</p>
                  </div>

                  <div className="space-y-1 font-sans text-xs">
                    {hasDashboard ? (
                      <Link
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white hover:bg-[#D4AF37]/20 hover:text-[#D4AF37] font-extrabold transition-colors"
                        to={dashboardUrl}
                      >
                        <Sparkles size={15} className="text-[#D4AF37]" />
                        <span>Trang Quản Trị</span>
                      </Link>
                    ) : (
                      <>
                        <Link className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/15 hover:text-[#D4AF37] font-bold transition-colors" to="/profile">
                          <User size={15} className="text-[#D4AF37]" />
                          <span>Hồ sơ của tôi</span>
                        </Link>
                        <Link className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/15 hover:text-[#D4AF37] font-bold transition-colors" to="/change-password">
                          <ShieldCheck size={15} className="text-[#D4AF37]" />
                          <span>Đổi mật khẩu</span>
                        </Link>
                      </>
                    )}
                    <div className="h-px bg-white/15 my-2" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[#FF6B6B] hover:bg-red-500/15 font-extrabold transition-colors text-left"
                    >
                      <LogOut size={15} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-2 !text-white hover:!text-[#D4AF37] font-sans text-[13px] font-extrabold tracking-[0.18em] uppercase transition-colors"
              style={{ color: '#FFFFFF', textShadow: '0 2px 4px #000, 0 0 15px rgba(0,0,0,0.8)' }}
            >
              <User size={15} strokeWidth={2.5} className="!text-[#D4AF37] drop-shadow-[0_1px_2px_black]" style={{ color: '#D4AF37' }} />
              <span>ĐĂNG NHẬP</span>
            </Link>
          )}

          {/* DAEWOO SIGNATURE RECTANGULAR WHITE BOX BUTTON ("BOOK NOW" / "ĐẶT PHÒNG") */}
          <Link
            to="/booking"
            className="inline-flex items-center justify-center px-5 sm:px-7 xl:px-9 py-2.5 sm:py-3 bg-white hover:bg-[#D4AF37] text-[#111A15] hover:text-white font-sans text-xs sm:text-[13px] font-extrabold tracking-[0.2em] sm:tracking-[0.24em] uppercase transition-all duration-300 shadow-2xl rounded-none shrink-0 whitespace-nowrap border border-white"
          >
            <span>ĐẶT PHÒNG</span>
          </Link>
        </div>
      </div>

      {/* MOBILE NAVIGATION DROPDOWN */}
      {isMobileMenuOpen ? (
        <div className="lg:hidden bg-[#111A15] border-t border-white/10 px-6 py-6 shadow-2xl animate-in slide-in-from-top-4 duration-300 mt-3">
          <nav className="flex flex-col space-y-2 font-sans" aria-label="Điều hướng di động">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-extrabold tracking-wider uppercase transition-all ${
                    isActive
                      ? 'bg-white/10 text-white border-l-4 border-[#D4AF37] shadow-sm'
                      : 'text-white/80 hover:bg-white/5 hover:text-white font-bold'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span>{link.name}</span>
                  {link.badge ? (
                    <span className="inline-flex items-center justify-center bg-[#DC2626] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {link.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}

            <div className="h-px bg-white/10 my-3" />

            <a
              href="tel:0868729129"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.05] text-white font-bold text-sm"
            >
              <Phone size={16} className="text-[#D4AF37]" />
              <span>Hotline 24/7: 0868 729 129</span>
            </a>

            <Link
              to="/booking"
              className="w-full flex items-center justify-center gap-3 py-4 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#0F131C] font-extrabold text-sm tracking-widest uppercase shadow-lg mt-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>ĐẶT PHÒNG NGAY</span>
              <span className="text-base font-bold">↗</span>
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
};

export default AppHeader;
