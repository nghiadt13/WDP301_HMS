import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle2, Loader2, Lock, Mail, ShieldCheck, Sparkles, User, X } from 'lucide-react';

import axiosClient from '../api/axiosClient';
import registerResortImage from '../assets/register-resort.png';
import PasswordInput from '../components/PasswordInput';
import { getApiValidationErrors, getPasswordValidationErrors } from '../utils/passwordValidation';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    login_account: '',
    accepted_terms: false
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policyItems, setPolicyItems] = useState([]);
  const [isPolicyLoading, setIsPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState('');

  useEffect(() => {
    const loadPolicies = async () => {
      setIsPolicyLoading(true);
      setPolicyError('');

      try {
        const response = await axiosClient.get('/payments/public/hotel-policies');
        setPolicyItems(response.data?.policies || []);
      } catch (error) {
        setPolicyError(error.response?.data?.message || 'Cannot load hotel policies right now.');
      } finally {
        setIsPolicyLoading(false);
      }
    };

    loadPolicies();
  }, []);

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
    setValidationErrors([]);

    if (!formData.accepted_terms) {
      setErrorMessage('Vui lòng đọc và đồng ý điều khoản, điều kiện trước khi tạo tài khoản.');
      setIsPolicyModalOpen(true);
      return;
    }

    const passwordErrors = getPasswordValidationErrors(formData.password);
    if (passwordErrors.length > 0) {
      setValidationErrors(passwordErrors);
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axiosClient.post('/auth/register', formData);

      localStorage.setItem('hotelify_token', response.data.token);
      localStorage.setItem('hotelify_user', JSON.stringify(response.data.user));
      window.dispatchEvent(new Event('hotelify-auth-change'));
      navigate('/home');
    } catch (error) {
      const apiValidationErrors = getApiValidationErrors(error);
      if (apiValidationErrors.length > 0) {
        setValidationErrors(apiValidationErrors);
        return;
      }

      setErrorMessage(
        error.response?.data?.message ||
          'Không thể kết nối đến máy chủ. Vui lòng kiểm tra hệ thống Backend.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex bg-[#FFFDF9] dark:bg-[#0A1120] font-sans selection:bg-[#C5A880]/30 selection:text-[#0F131C]">
      
      {/* LEFT COLUMN: Auth Form Panel (Bright Ivory / Light Resort Sand) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 relative overflow-y-auto bg-[#FFFDF9] dark:bg-[#0A1120] order-2 lg:order-1">
        <div className="w-full max-w-lg space-y-8 my-auto">
          
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
              ✦ GIA NHẬP CỘNG ĐỒNG VIP CLUB ✦
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-embossed-dark dark:text-embossed-white">
              Tạo tài khoản Hotelify
            </h1>
            <p className="text-sm text-[#525966] dark:text-gray-300 leading-relaxed font-medium">
              Trải nghiệm dịch vụ đặt phòng trực tuyến tiện lợi, tích lũy điểm thưởng và nhận đặc quyền giảm giá cho thành viên.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1A1D24] dark:text-gray-200 flex items-center gap-1.5">
                  <User size={14} className="text-[#C5A880]" />
                  <span>Họ và tên</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  placeholder="Nhập họ và tên đầy đủ..."
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-[#131E30] border border-[#E8E4DB] dark:border-white/15 text-sm font-medium text-[#1A1D24] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#C5A880] focus:ring-4 focus:ring-[#C5A880]/15 transition-all shadow-sm"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1A1D24] dark:text-gray-200 flex items-center gap-1.5">
                  <Mail size={14} className="text-[#C5A880]" />
                  <span>Địa chỉ Email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Nhập địa chỉ email..."
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-[#131E30] border border-[#E8E4DB] dark:border-white/15 text-sm font-medium text-[#1A1D24] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#C5A880] focus:ring-4 focus:ring-[#C5A880]/15 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Login Account */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1A1D24] dark:text-gray-200 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#C5A880]" />
                <span>Tên tài khoản đăng nhập (Username)</span>
              </label>
              <input
                type="text"
                name="login_account"
                placeholder="Nhập username định danh..."
                value={formData.login_account}
                onChange={handleChange}
                autoComplete="off"
                required
                className="w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-[#131E30] border border-[#E8E4DB] dark:border-white/15 text-sm font-medium text-[#1A1D24] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#C5A880] focus:ring-4 focus:ring-[#C5A880]/15 transition-all shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1A1D24] dark:text-gray-200 flex items-center gap-1.5">
                  <Lock size={14} className="text-[#C5A880]" />
                  <span>Mật khẩu</span>
                </label>
                <PasswordInput
                  name="password"
                  placeholder="Nhập mật khẩu..."
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1A1D24] dark:text-gray-200 flex items-center gap-1.5">
                  <Lock size={14} className="text-[#C5A880]" />
                  <span>Xác nhận mật khẩu</span>
                </label>
                <PasswordInput
                  name="confirm_password"
                  placeholder="Nhập lại mật khẩu..."
                  value={formData.confirm_password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            
            <small className="text-[11px] text-gray-500 dark:text-gray-400 block leading-normal font-medium">
              ✦ Mật khẩu cần tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
            </small>

            {/* Terms Checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-[#525966] dark:text-gray-200 select-none font-medium">
                <input
                  type="checkbox"
                  name="accepted_terms"
                  checked={formData.accepted_terms}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-[#C5A880] focus:ring-[#C5A880] accent-[#C5A880] cursor-pointer"
                />
                <span>Tôi đã đọc và đồng ý với</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsPolicyModalOpen(true);
                  }}
                  className="font-extrabold text-[#92703E] dark:text-[#D4AF37] hover:underline"
                >
                  Điều khoản & Chính sách bảo mật
                </button>
              </label>
            </div>

            {errorMessage ? (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold leading-relaxed animate-in fade-in duration-200 shadow-sm">
                ⚠️ {errorMessage}
              </div>
            ) : null}

            {validationErrors.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold space-y-1 shadow-sm">
                <p className="font-extrabold">Vui lòng kiểm tra lại:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {validationErrors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Clean Modern Hotel Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#0F131C] dark:bg-[#D4AF37] text-white dark:text-[#0F131C] font-sans font-semibold text-sm shadow-md hover:bg-[#1A2234] dark:hover:bg-[#E5B83B] transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
            >
              <span>{isSubmitting ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký'}</span>
              {!isSubmitting ? (
                <span className="text-xs font-bold group-hover:translate-x-0.5 transition-transform">↗</span>
              ) : null}
            </button>
          </form>

          {/* Footer Prompt */}
          <div className="pt-6 border-t border-[#E8E4DB] dark:border-white/10 text-center">
            <p className="text-sm text-[#525966] dark:text-gray-300 font-medium">
              Đã có tài khoản thành viên?{' '}
              <Link
                to="/login"
                className="font-extrabold text-embossed-dark dark:text-embossed-white hover:text-[#92703E] dark:hover:text-[#D4AF37] underline underline-offset-4 transition-colors"
              >
                Đăng nhập ngay ↗
              </Link>
            </p>
          </div>
          
          <div className="text-center text-[11px] text-gray-400 pt-2 font-medium">
            © 2026 Hotelify Hotel System. Bảo mật thông tin SSL 256-bit.
          </div>

        </div>
      </div>

      {/* RIGHT COLUMN (on desktop): Cinematic Coastal Resort Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#101828] text-white flex-col justify-between p-12 overflow-hidden border-l border-[#E8E4DB] dark:border-white/10 order-1 lg:order-2">
        <div className="absolute inset-0 z-0">
          <img
            src={registerResortImage}
            alt="Hotelify Resort Infinity Pool"
            className="w-full h-full object-cover object-center opacity-85 scale-105 transform hover:scale-100 transition-transform duration-[10s] ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1120]/90 via-[#0A1120]/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-l from-[#0A1120]/40 via-transparent to-[#0A1120]/50" />
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
            <span className="text-embossed-white">Thành Viên Hotelify</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-5">
          <blockquote className="font-display text-3xl sm:text-4xl font-extrabold leading-tight text-embossed-white">
            &ldquo;Trải nghiệm kỳ nghỉ thoải mái và tiện nghi tại Vịnh Hạ Long.&rdquo;
          </blockquote>
          <div className="w-16 h-1 bg-gradient-to-r from-[#D4AF37] to-[#C5A880] rounded-full shadow-sm" />
          <p className="text-sm text-gray-100 font-sans leading-relaxed drop-shadow-md">
            Đăng ký tài khoản thành viên để dễ dàng theo dõi lịch sử đặt phòng, quản lý thông tin lưu trú và nhận các chương trình ưu đãi tri ân khách hàng.
          </p>
          <div className="pt-2 flex items-center gap-6 text-xs text-gray-200 font-medium">
            <span className="flex items-center gap-1"><span className="text-[#D4AF37]">✦</span> Ưu đãi thành viên</span>
            <span className="flex items-center gap-1"><span className="text-[#D4AF37]">✦</span> Hỗ trợ 24/7</span>
            <span className="flex items-center gap-1"><span className="text-[#D4AF37]">✦</span> Đặt phòng nhanh</span>
          </div>
        </div>
      </div>

      {/* POLICY MODAL */}
      {isPolicyModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200"
          role="presentation"
          onMouseDown={() => setIsPolicyModalOpen(false)}
        >
          <section
            className="w-full max-w-2xl bg-[#FFFDF9] dark:bg-[#0F172A] rounded-3xl shadow-2xl border border-[#E8E4DB] dark:border-white/10 flex flex-col max-h-[85vh] overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hotel-policy-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <header className="px-6 py-5 border-b border-[#E8E4DB] dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#0A1120]">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-shimmer-gold block font-mono">
                  ✦ CHÍNH SÁCH HOTELIFY HOTEL ✦
                </span>
                <h2 id="hotel-policy-modal-title" className="font-display text-xl font-extrabold text-embossed-dark dark:text-embossed-white">
                  Điều khoản và Điều kiện thành viên
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(false)}
                className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 flex items-center justify-center text-gray-500 hover:text-[#1A1D24] dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </header>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-[#525966] dark:text-gray-300 leading-relaxed font-sans">
              {isPolicyLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <Loader2 size={28} className="animate-spin text-[#C5A880]" />
                  <p className="text-xs font-medium text-gray-400">Đang tải chính sách khách sạn...</p>
                </div>
              ) : null}
              {!isPolicyLoading && policyError ? (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 text-xs text-center font-bold">
                  {policyError}
                </div>
              ) : null}
              {!isPolicyLoading && !policyError && policyItems.length > 0 ? (
                policyItems.map((policy, idx) => (
                  <article key={policy.id || idx} className="space-y-2 pb-4 border-b border-gray-200 dark:border-white/10 last:border-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#92703E] dark:text-[#D4AF37] block font-mono">
                      ✦ {policy.category || 'Chính sách'} ✦
                    </span>
                    <h3 className="font-display font-extrabold text-base text-embossed-dark dark:text-embossed-white">
                      {policy.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line font-medium">{policy.content}</p>
                  </article>
                ))
              ) : null}
              {!isPolicyLoading && !policyError && policyItems.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-xs font-medium">Hiện tại chưa có danh sách chính sách nào.</p>
              ) : null}
            </div>

            {/* Modal Footer */}
            <footer className="px-6 py-4 border-t border-[#E8E4DB] dark:border-white/10 bg-white dark:bg-[#0A1120] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(false)}
                className="px-5 py-2.5 rounded-full border border-gray-300 dark:border-white/20 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData((currentData) => ({
                    ...currentData,
                    accepted_terms: true
                  }));
                  setErrorMessage('');
                  setIsPolicyModalOpen(false);
                }}
                className="px-6 py-2 rounded-xl bg-[#0F131C] dark:bg-[#D4AF37] text-white dark:text-[#0F131C] font-semibold text-xs shadow-sm hover:bg-[#1A2234]"
              >
                Đồng ý điều khoản
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  );
};

export default RegisterPage;
