import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Building2, Lock, Sparkles, User } from 'lucide-react';

import axiosClient from '../api/axiosClient';
import hotelLoginImage from '../assets/hotel-login.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    remember: false
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const handleAuthSuccess = useCallback(
    (data) => {
      localStorage.setItem('hotelify_token', data.token);
      localStorage.setItem('hotelify_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('hotelify-auth-change'));
      
      const roleName = String(data.user?.role?.name || '').toLowerCase();
      if (roleName.includes('admin')) {
        navigate('/admin');
      } else if (roleName.includes('manager') || roleName.includes('housekeeping')) {
        navigate('/manager/housekeeping/tasks');
      } else if (roleName.includes('receptionist')) {
        navigate('/receptionist');
      } else {
        navigate('/home');
      }
    },
    [navigate]
  );

  const handleGoogleCredential = useCallback(
    async (googleResponse) => {
      setErrorMessage('');
      setIsGoogleSubmitting(true);

      try {
        const response = await axiosClient.post('/auth/google', {
          credential: googleResponse.credential
        });
        handleAuthSuccess(response.data);
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message ||
            'Cannot sign in with Google right now. Please try again.'
        );
      } finally {
        setIsGoogleSubmitting(false);
      }
    },
    [handleAuthSuccess]
  );

  useEffect(() => {
    if (!googleClientId) {
      return undefined;
    }

    let isCancelled = false;

    const renderGoogleButton = () => {
      if (isCancelled || !window.google?.accounts?.id) {
        return;
      }

      const buttonTarget = document.getElementById('google-login-button');
      if (!buttonTarget) {
        return;
      }

      buttonTarget.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential
      });
      window.google.accounts.id.renderButton(buttonTarget, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: Math.min(buttonTarget.offsetWidth || 400, 400)
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return () => {
        isCancelled = true;
      };
    }

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    const script = existingScript || document.createElement('script');

    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => {
      if (!isCancelled) {
        setErrorMessage('Cannot load Google sign-in. Please check your network.');
      }
    };

    if (!existingScript) {
      document.head.appendChild(script);
    }

    return () => {
      isCancelled = true;
    };
  }, [googleClientId, handleGoogleCredential]);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await axiosClient.post('/auth/login', {
        login_account: formData.identifier,
        password: formData.password
      });

      handleAuthSuccess(response.data);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          'Cannot connect to the server. Please check that the backend is running.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex bg-[#FFFDF9] dark:bg-[#0A1120] font-sans selection:bg-[#C5A880]/30 selection:text-[#0F131C]">
      
      {/* LEFT COLUMN: Cinematic Coastal Resort Showcase (Light & Vivid Coastal Bay) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#101828] text-white flex-col justify-between p-12 overflow-hidden border-r border-[#E8E4DB] dark:border-white/10">
        {/* Background Image with Lighter, Coastal Navy Gradients (No heavy black) */}
        <div className="absolute inset-0 z-0">
          <img
            src={hotelLoginImage}
            alt="Hotelify Resort Bay View"
            className="w-full h-full object-cover object-center opacity-85 scale-105 transform hover:scale-100 transition-transform duration-[10s] ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1120]/90 via-[#0A1120]/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1120]/40 via-transparent to-[#0A1120]/50" />
        </div>

        {/* Top Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight text-white hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8B6B3D] flex items-center justify-center text-[#0A1120] shadow-lg">
              <Building2 size={22} strokeWidth={2.2} />
            </div>
            <span className="tracking-tighter text-embossed-white">Hotelify<span className="text-shimmer-gold font-sans text-xs ml-1 font-semibold tracking-normal uppercase">Hotel</span></span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-[#F3E5AB] text-[11px] font-bold uppercase tracking-widest shadow-sm">
            <Sparkles size={12} className="text-[#D4AF37]" />
            <span className="text-embossed-white">Hệ Thống Đặt Phòng Trực Tuyến</span>
          </div>
        </div>

        {/* Bottom Story & Quote with 3D Embossed Typography */}
        <div className="relative z-10 max-w-lg space-y-5">
          <blockquote className="font-display text-3xl sm:text-4xl font-extrabold leading-tight text-embossed-white">
            &ldquo;Điểm Dừng Chân Lý Tưởng Bên Vịnh Kỳ Quan Hạ Long.&rdquo;
          </blockquote>
          <div className="w-16 h-1 bg-gradient-to-r from-[#D4AF37] to-[#C5A880] rounded-full shadow-sm" />
          <p className="text-sm text-gray-100 font-sans leading-relaxed drop-shadow-md">
            Chào mừng quý khách đến với hệ thống đặt phòng trực tuyến của Hotelify. Không gian phòng nghỉ thoải mái, tiện nghi cùng phong cách phục vụ chu đáo 24/7.
          </p>
          <div className="pt-2 flex items-center gap-6 text-xs text-gray-200 font-medium">
            <span className="flex items-center gap-1"><span className="text-[#D4AF37]">✦</span> Bảo mật thông tin</span>
            <span className="flex items-center gap-1"><span className="text-[#D4AF37]">✦</span> Lễ tân 24/7</span>
            <span className="flex items-center gap-1"><span className="text-[#D4AF37]">✦</span> Tiện nghi hiện đại</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Auth Form Panel (Bright Ivory / Light Resort Sand) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 relative overflow-y-auto bg-[#FFFDF9] dark:bg-[#0A1120]">
        <div className="w-full max-w-md space-y-8 my-auto">
          
          {/* Back to Home Button */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#525966] dark:text-gray-300 hover:text-[#92703E] dark:hover:text-[#D4AF37] transition-all py-2.5 px-4 rounded-full bg-white dark:bg-white/5 border border-[#E8E4DB] dark:border-white/10 shadow-sm hover:shadow hover:-translate-y-0.5"
            >
              <ArrowLeft size={14} className="text-[#C5A880]" />
              <span className="font-semibold">Quay về trang chủ</span>
            </Link>
          </div>

          {/* Title & Copy with Embossed Typography */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-shimmer-gold block font-mono">
              ✦ CỔNG ĐĂNG NHẬP VIP CLUB ✦
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-embossed-dark dark:text-embossed-white">
              Chào mừng quay trở lại
            </h1>
            <p className="text-sm text-[#525966] dark:text-gray-300 leading-relaxed font-medium">
              Đăng nhập tài khoản của bạn để quản lý kỳ nghỉ, kiểm tra phòng trống hoặc truy cập trung tâm quản trị.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
            <div className="space-y-4">
              {/* Login Account Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1A1D24] dark:text-gray-200 block flex items-center gap-1.5">
                  <User size={14} className="text-[#C5A880]" />
                  <span>Tài khoản / Email đăng nhập</span>
                </label>
                <input
                  type="text"
                  name="identifier"
                  placeholder="Nhập tài khoản hoặc email của bạn..."
                  autoComplete="off"
                  value={formData.identifier}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-[#131E30] border border-[#E8E4DB] dark:border-white/15 text-sm font-medium text-[#1A1D24] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#C5A880] focus:ring-4 focus:ring-[#C5A880]/15 transition-all shadow-sm"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1A1D24] dark:text-gray-200 flex items-center gap-1.5">
                    <Lock size={14} className="text-[#C5A880]" />
                    <span>Mật khẩu</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-[#92703E] dark:text-[#D4AF37] hover:underline transition-colors"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <input
                  type="password"
                  name="password"
                  placeholder="Nhập mật khẩu của bạn..."
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-[#131E30] border border-[#E8E4DB] dark:border-white/15 text-sm font-medium text-[#1A1D24] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#C5A880] focus:ring-4 focus:ring-[#C5A880]/15 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-[#525966] dark:text-gray-200 select-none font-medium">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-[#C5A880] focus:ring-[#C5A880] accent-[#C5A880] cursor-pointer"
                />
                <span>Ghi nhớ đăng nhập trên thiết bị này</span>
              </label>
            </div>

            {errorMessage ? (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold leading-relaxed animate-in fade-in duration-200 shadow-sm">
                ⚠️ {errorMessage}
              </div>
            ) : null}

            {/* Clean Modern Hotel Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#0F131C] dark:bg-[#D4AF37] text-white dark:text-[#0F131C] font-sans font-semibold text-sm shadow-md hover:bg-[#1A2234] dark:hover:bg-[#E5B83B] transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
            >
              <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng nhập ngay'}</span>
              {!isSubmitting ? (
                <span className="text-xs font-bold group-hover:translate-x-0.5 transition-transform">↗</span>
              ) : null}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E8E4DB] dark:border-white/10" />
              </div>
              <span className="relative bg-[#FFFDF9] dark:bg-[#0A1120] px-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Hoặc tiếp tục với
              </span>
            </div>

            {/* Google Login Area */}
            <div className="w-full flex flex-col items-center justify-center">
              {googleClientId ? (
                <div className="w-full flex justify-center">
                  <div id="google-login-button" className="w-full flex justify-center" />
                  {isGoogleSubmitting ? (
                    <span className="text-xs text-gray-500 mt-2 block font-semibold animate-pulse">
                      Đang kết nối Google...
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="w-full py-3 px-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 text-center text-xs text-gray-400 font-medium">
                  Đăng nhập Google chưa được cấu hình (Thiếu Client ID)
                </div>
              )}
            </div>
          </form>

          {/* Footer Prompt */}
          <div className="pt-6 border-t border-[#E8E4DB] dark:border-white/10 text-center">
            <p className="text-sm text-[#525966] dark:text-gray-300 font-medium">
              Chưa có tài khoản Hotelify?{' '}
              <Link
                to="/register"
                className="font-extrabold text-embossed-dark dark:text-embossed-white hover:text-[#92703E] dark:hover:text-[#D4AF37] underline underline-offset-4 transition-colors"
              >
                Đăng ký tài khoản mới ↗
              </Link>
            </p>
          </div>
          
          {/* Copyright notice */}
          <div className="text-center text-[11px] text-gray-400 pt-4 font-medium">
            © 2026 Hotelify Hotel System. Bảo mật thông tin SSL 256-bit.
          </div>

        </div>
      </div>

    </main>
  );
};

export default LoginPage;
