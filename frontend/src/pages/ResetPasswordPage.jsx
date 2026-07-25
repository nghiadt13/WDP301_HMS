import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, Lock, Sparkles } from 'lucide-react';

import axiosClient from '../api/axiosClient';
import hotelLoginImage from '../assets/hotel-login.png';
import PasswordInput from '../components/PasswordInput';
import { getApiValidationErrors, getPasswordValidationErrors } from '../utils/passwordValidation';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setErrorMessage('');
    setValidationErrors([]);

    if (!token) {
      setErrorMessage('Liên kết thiết lập lại mật khẩu không hợp lệ (Thiếu token).');
      return;
    }

    const passwordErrors = getPasswordValidationErrors(formData.password);
    if (passwordErrors.length > 0) {
      setValidationErrors(passwordErrors);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axiosClient.post('/auth/reset-password', {
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      setMessage(response.data?.message || 'Thiết lập mật khẩu mới thành công! Đang chuyển hướng đến trang đăng nhập...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      const apiValidationErrors = getApiValidationErrors(error);
      if (apiValidationErrors.length > 0) {
        setValidationErrors(apiValidationErrors);
        return;
      }

      setErrorMessage(
        error.response?.data?.message ||
          'Không thể cập nhật mật khẩu lúc này. Vui lòng yêu cầu lại liên kết khôi phục mới.'
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
            <span className="text-embossed-white">Trung Tâm Bảo Mật</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-5">
          <blockquote className="font-display text-3xl sm:text-4xl font-extrabold leading-tight text-embossed-white">
            &ldquo;Bảo đảm an toàn tài khoản và quyền riêng tư cho khách hàng.&rdquo;
          </blockquote>
          <div className="w-16 h-1 bg-gradient-to-r from-[#D4AF37] to-[#C5A880] rounded-full shadow-sm" />
          <p className="text-sm text-gray-100 font-sans leading-relaxed drop-shadow-md">
            Mật khẩu mạnh với công nghệ mã hóa một chiều giúp bảo vệ trọn vẹn lịch sử đặt phòng và tài khoản thanh toán của quý khách.
          </p>
          <div className="pt-2 flex items-center gap-6 text-xs text-gray-200 font-medium">
            <span className="flex items-center gap-1"><span className="text-[#D4AF37]">✦</span> Bảo mật SSL 256-bit</span>
            <span className="flex items-center gap-1"><span className="text-[#D4AF37]">✦</span> Hỗ trợ 24/7</span>
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
              <span className="font-semibold">Quay về đăng nhập</span>
            </Link>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-shimmer-gold block font-mono">
              ✦ THIẾT LẬP BẢO MẬT ✦
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-embossed-dark dark:text-embossed-white">
              Tạo mật khẩu mới
            </h1>
            <p className="text-sm text-[#525966] dark:text-gray-300 leading-relaxed font-medium">
              Mật khẩu mới cần tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1A1D24] dark:text-gray-200 flex items-center gap-1.5">
                  <Lock size={14} className="text-[#C5A880]" />
                  <span>Mật khẩu mới</span>
                </label>
                <PasswordInput
                  name="password"
                  placeholder="Nhập mật khẩu mới..."
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1A1D24] dark:text-gray-200 flex items-center gap-1.5">
                  <Lock size={14} className="text-[#C5A880]" />
                  <span>Xác nhận mật khẩu mới</span>
                </label>
                <PasswordInput
                  name="confirmPassword"
                  placeholder="Nhập lại mật khẩu mới..."
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
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

            {validationErrors.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold space-y-1 shadow-sm">
                <p className="font-extrabold">Vui lòng kiểm tra lại:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {validationErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || !token}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#0F131C] dark:bg-[#D4AF37] text-white dark:text-[#0F131C] font-sans font-semibold text-sm shadow-md hover:bg-[#1A2234] dark:hover:bg-[#E5B83B] transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
            >
              <span>{isSubmitting ? 'Đang lưu mật khẩu...' : 'Cập nhật mật khẩu'}</span>
              {!isSubmitting ? (
                <span className="text-xs font-bold group-hover:translate-x-0.5 transition-transform">↗</span>
              ) : null}
            </button>
          </form>

          <div className="pt-6 border-t border-[#E8E4DB] dark:border-white/10 text-center">
            <p className="text-sm text-[#525966] dark:text-gray-300 font-medium">
              Đã cập nhật xong mật khẩu?{' '}
              <Link
                to="/login"
                className="font-extrabold text-embossed-dark dark:text-embossed-white hover:text-[#92703E] dark:hover:text-[#D4AF37] underline underline-offset-4 transition-colors"
              >
                Đăng nhập ngay ↗
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

export default ResetPasswordPage;
