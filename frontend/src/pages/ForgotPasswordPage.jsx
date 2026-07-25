import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Sparkles } from 'lucide-react';

import axiosClient from '../api/axiosClient';
import hotelLoginImage from '../assets/hotel-login.png';

const ForgotPasswordPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await axiosClient.post('/auth/forgot-password', {
        identifier
      });

      setMessage(response.data?.message || 'Email khôi phục mật khẩu đã được gửi thành công. Vui lòng kiểm tra hộp thư của bạn.');
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          'Không thể gửi email khôi phục mật khẩu lúc này. Vui lòng thử lại sau.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex bg-[#FFFDF9] dark:bg-[#0A1120] font-sans selection:bg-[#C5A880]/30 selection:text-[#0F131C]">
      
      {/* LEFT COLUMN: Cinematic Coastal Resort Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#101828] text-white flex-col justify-between p-12 overflow-hidden border-r border-[#E8E4DB] dark:border-white/10">
        <div className="absolute inset-0 z-0">
          <img
            src={hotelLoginImage}
            alt="Hotelify Resort Bay View"
            className="w-full h-full object-cover object-center opacity-85 scale-105 transform hover:scale-100 transition-transform duration-[10s] ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1120]/90 via-[#0A1120]/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1120]/40 via-transparent to-[#0A1120]/50" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight text-white hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8B6B3D] flex items-center justify-center text-[#0A1120] shadow-lg">
              <Building2 size={22} strokeWidth={2.2} />
            </div>
            <span className="tracking-tighter text-embossed-white">Hotelify<span className="text-shimmer-gold font-sans text-xs ml-1 font-semibold tracking-normal uppercase">Hotel</span></span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-[#F3E5AB] text-[11px] font-bold uppercase tracking-widest shadow-sm">
            <Sparkles size={12} className="text-[#D4AF37]" />
            <span className="text-embossed-white">Bảo Mật Tài Khoản</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-5">
          <blockquote className="font-display text-3xl sm:text-4xl font-extrabold leading-tight text-embossed-white">
            &ldquo;Bảo mật tài khoản tuyệt đối cho trải nghiệm nghỉ dưỡng an tâm.&rdquo;
          </blockquote>
          <div className="w-16 h-1 bg-gradient-to-r from-[#D4AF37] to-[#C5A880] rounded-full shadow-sm" />
          <p className="text-sm text-gray-100 font-sans leading-relaxed drop-shadow-md">
            Chúng tôi sử dụng tiêu chuẩn bảo mật SSL 256-bit và liên kết xác thực an toàn để bảo vệ thông tin đặt phòng và điểm thưởng thành viên của quý khách.
          </p>
          <div className="pt-2 flex items-center gap-6 text-xs text-gray-200 font-medium">
            <span className="flex items-center gap-1"><span className="text-[#D4AF37]">✦</span> Khôi phục nhanh chóng</span>
            <span className="flex items-center gap-1"><span className="text-[#D4AF37]">✦</span> Hỗ trợ kỹ thuật 24/7</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Auth Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 relative overflow-y-auto bg-[#FFFDF9] dark:bg-[#0A1120]">
        <div className="w-full max-w-md space-y-8 my-auto">
          
          <div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#525966] dark:text-gray-300 hover:text-[#92703E] dark:hover:text-[#D4AF37] transition-all py-2.5 px-4 rounded-full bg-white dark:bg-white/5 border border-[#E8E4DB] dark:border-white/10 shadow-sm hover:shadow hover:-translate-y-0.5"
            >
              <ArrowLeft size={14} className="text-[#C5A880]" />
              <span className="font-semibold">Quay lại đăng nhập</span>
            </Link>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-shimmer-gold block font-mono">
              ✦ KHÔI PHỤC MẬT KHẨU ✦
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-embossed-dark dark:text-embossed-white">
              Quên mật khẩu?
            </h1>
            <p className="text-sm text-[#525966] dark:text-gray-300 leading-relaxed font-medium">
              Nhập email hoặc tên tài khoản gắn liền với tư cách thành viên. Hệ thống Hotelify sẽ gửi liên kết khôi phục an toàn đến hộp thư của bạn.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1A1D24] dark:text-gray-200 flex items-center gap-1.5">
                <Mail size={14} className="text-[#C5A880]" />
                <span>Email hoặc Tài khoản định danh</span>
              </label>
              <input
                type="text"
                placeholder="Nhập email hoặc username của bạn..."
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-[#131E30] border border-[#E8E4DB] dark:border-white/15 text-sm font-medium text-[#1A1D24] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#C5A880] focus:ring-4 focus:ring-[#C5A880]/15 transition-all shadow-sm"
              />
            </div>

            {message ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold leading-relaxed animate-in fade-in duration-200 shadow-sm">
                ✅ {message}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold leading-relaxed animate-in fade-in duration-200 shadow-sm">
                ⚠️ {errorMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#0F131C] dark:bg-[#D4AF37] text-white dark:text-[#0F131C] font-sans font-semibold text-sm shadow-md hover:bg-[#1A2234] dark:hover:bg-[#E5B83B] transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
            >
              <span>{isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi email khôi phục'}</span>
              {!isSubmitting ? (
                <span className="text-xs font-bold group-hover:translate-x-0.5 transition-transform">↗</span>
              ) : null}
            </button>
          </form>

          <div className="pt-6 border-t border-[#E8E4DB] dark:border-white/10 text-center">
            <p className="text-sm text-[#525966] dark:text-gray-300 font-medium">
              Bạn nhớ ra mật khẩu?{' '}
              <Link
                to="/login"
                className="font-extrabold text-embossed-dark dark:text-embossed-white hover:text-[#92703E] dark:hover:text-[#D4AF37] underline underline-offset-4 transition-colors"
              >
                Trở lại đăng nhập ↗
              </Link>
            </p>
          </div>
          
          <div className="text-center text-[11px] text-gray-400 pt-4 font-medium">
            © 2026 Hotelify Hotel System. Bảo mật thông tin SSL 256-bit.
          </div>

        </div>
      </div>

    </main>
  );
};

export default ForgotPasswordPage;
