import { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  Clock,
  CreditCard,
  FileText,
  Sparkles,
  AlertCircle,
  Key,
  Calendar,
  UserCheck,
  Phone,
  Mail,
  CheckCircle2,
  HelpCircle,
  Award,
  Bookmark,
  ChevronRight
} from 'lucide-react';

import { getHotelPolicies } from '../api/customerApi';
import './CustomerPages.css';

// Helper: Select appropriate luxury icon based on policy title or category
const getPolicyIcon = (title = '', category = '') => {
  const text = `${title} ${category}`.toLowerCase();
  if (text.includes('thời gian') || text.includes('nhận') || text.includes('trả') || text.includes('giờ')) {
    return <Clock size={22} className="text-[#D4AF37]" />;
  }
  if (text.includes('thanh toán') || text.includes('tiền') || text.includes('vnpay') || text.includes('hủy') || text.includes('hoàn')) {
    return <CreditCard size={22} className="text-[#D4AF37]" />;
  }
  if (text.includes('giấy tờ') || text.includes('tùy thân') || text.includes('cccd') || text.includes('hộ chiếu') || text.includes('thủ tục')) {
    return <UserCheck size={22} className="text-[#D4AF37]" />;
  }
  if (text.includes('bảo mật') || text.includes('quy định') || text.includes('an ninh') || text.includes('cấm')) {
    return <ShieldCheck size={22} className="text-[#D4AF37]" />;
  }
  if (text.includes('ưu đãi') || text.includes('đặc quyền') || text.includes('vip') || text.includes('dịch vụ')) {
    return <Sparkles size={22} className="text-[#D4AF37]" />;
  }
  if (text.includes('chìa khóa') || text.includes('thẻ phòng') || text.includes('tài sản') || text.includes('hư hỏng')) {
    return <Key size={22} className="text-[#D4AF37]" />;
  }
  if (text.includes('đặt phòng') || text.includes('booking') || text.includes('lịch')) {
    return <Calendar size={22} className="text-[#D4AF37]" />;
  }
  return <FileText size={22} className="text-[#D4AF37]" />;
};

const CustomerPoliciesPage = () => {
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    getHotelPolicies()
      .then(setPolicies)
      .catch(() => setErrorMessage('Không thể tải chính sách khách sạn. Vui lòng thử lại sau.'))
      .finally(() => setIsLoading(false));
  }, []);

  const groupedPolicies = useMemo(() => {
    return policies.reduce((groups, policy) => {
      const category = policy.category || 'Quy định chung';
      return {
        ...groups,
        [category]: [...(groups[category] || []), policy],
      };
    }, {});
  }, [policies]);

  const categories = useMemo(() => ['ALL', ...Object.keys(groupedPolicies)], [groupedPolicies]);

  // Filter groups based on selected category tab
  const displayedGroups = useMemo(() => {
    if (selectedCategory === 'ALL') return groupedPolicies;
    return {
      [selectedCategory]: groupedPolicies[selectedCategory] || [],
    };
  }, [groupedPolicies, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] py-10 px-4 sm:px-8 lg:px-12 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">
        
        {/* 1. BRIGHT IVORY & GOLD CROWN HERO BANNER */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#FFFDF9] via-[#F5F2EB] to-white p-8 sm:p-14 md:p-16 text-center border border-[#E8E4DB] shadow-lg">
          {/* Subtle Ornamental Background Glows */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#C5A880]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFFDF9] border border-[#C5A880] text-[#92703E] text-xs sm:text-[13px] font-extrabold tracking-[0.2em] uppercase shadow-xs">
              <Sparkles size={14} className="animate-pulse text-[#92703E]" />
              <span>Quy định & Đặc quyền 5 Sao</span>
            </div>

            <h1 className="font-display italic text-3xl sm:text-5xl md:text-6xl text-[#111A15] font-normal tracking-wide leading-tight">
              Chính Sách & Nội Quy <span className="not-italic font-bold text-[#92703E]">Hotelify</span>
            </h1>

            <div className="flex items-center justify-center gap-3 text-[#92703E] text-sm">
              <span>✦</span>
              <span className="h-px w-16 bg-gradient-to-r from-transparent via-[#C5A880] to-transparent" />
              <span>✦</span>
              <span className="h-px w-16 bg-gradient-to-r from-transparent via-[#C5A880] to-transparent" />
              <span>✦</span>
            </div>

            <p className="text-[#525966] text-sm sm:text-base md:text-lg font-medium leading-relaxed max-w-2xl mx-auto">
              Cam kết mang đến không gian nghỉ dưỡng chuẩn mực quốc tế bên vịnh di sản. Nắm rõ các nguyên tắc lưu trú, thủ tục check-in/out và đặc quyền khách hàng để chuyến đi của Quý khách luôn trọn vẹn.
            </p>
          </div>
        </div>

        {/* 2. INTERACTIVE CATEGORY FILTER BAR (STICKY LUXURY TABS) */}
        {!isLoading && policies.length > 0 ? (
          <div className="sticky top-20 z-30 bg-white/90 dark:bg-[#111A15]/95 backdrop-blur-xl border border-[#E8E4DB] dark:border-white/10 shadow-xl rounded-2xl p-2.5 max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-3 transition-all">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = cat === 'ALL' ? policies.length : groupedPolicies[cat]?.length || 0;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold tracking-wider uppercase transition-all duration-300 flex items-center gap-2 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A880] text-[#0A1120] shadow-md scale-105'
                      : 'bg-transparent hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-[#0A1120] dark:hover:text-white'
                  }`}
                >
                  <span>{cat === 'ALL' ? 'Tất cả quy định' : cat}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isSelected
                        ? 'bg-[#0A1120] text-white'
                        : 'bg-gray-200 dark:bg-white/15 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {/* 3. MAIN CONTENT AREA */}
        {errorMessage ? (
          <div className="max-w-xl mx-auto p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-center font-semibold flex items-center justify-center gap-3">
            <AlertCircle size={24} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {isLoading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-3 border-[#D4AF37] border-t-transparent animate-spin mx-auto" />
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm sm:text-base">Đang tra cứu danh mục chính sách nghỉ dưỡng...</p>
          </div>
        ) : (
          <div className="space-y-14 sm:space-y-20">
            {Object.entries(displayedGroups).map(([category, items]) => (
              <div key={category} className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
                
                {/* Section Group Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E4DB] dark:border-white/15 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-3 h-8 bg-gradient-to-b from-[#D4AF37] to-[#8B6B3D] rounded-full shrink-0" />
                    <div>
                      <span className="text-[11px] font-extrabold text-[#D4AF37] tracking-[0.2em] uppercase block">DANH MỤC QUY ĐỊNH</span>
                      <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0A1120] dark:text-white mt-0.5">
                        {category}
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-px w-20 bg-gradient-to-r from-transparent to-[#D4AF37]/50 hidden md:block" />
                    <span className="px-4 py-1.5 rounded-full bg-[#0A1120] dark:bg-white/10 text-[#D4AF37] font-sans text-xs font-extrabold tracking-widest uppercase border border-[#D4AF37]/30 shadow-xs shrink-0">
                      {items.length} Điều khoản
                    </span>
                  </div>
                </div>

                {/* 2-Column Responsive Bento Grid for Policy Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {items.map((policy, index) => (
                    <article
                      key={policy._id || index}
                      className="relative group bg-white dark:bg-[#151B18] rounded-3xl p-6 sm:p-8 border border-[#E8E4DB] dark:border-white/10 hover:border-[#D4AF37] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(212,175,55,0.12)] flex flex-col justify-between overflow-hidden"
                    >
                      {/* Top Golden Hover Ribbon */}
                      <div className="absolute top-0 left-0 w-0 group-hover:w-full h-1.5 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C5A880] transition-all duration-500" />

                      {/* Giant Watermark Numeral */}
                      <span className="font-display text-5xl sm:text-6xl font-extrabold text-[#0A1120]/5 dark:text-white/5 group-hover:text-[#D4AF37]/15 transition-colors select-none absolute top-4 right-6 pointer-events-none">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <div>
                        {/* Icon Medallion + Title */}
                        <div className="flex items-start gap-4 mb-5 pr-14">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37]/15 to-[#C5A880]/5 border border-[#D4AF37]/30 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 group-hover:bg-[#D4AF37]/25 transition-all duration-300">
                            {getPolicyIcon(policy.title, policy.category)}
                          </div>
                          <div>
                            <span className="text-[11px] font-extrabold text-[#8E96A4] uppercase tracking-wider block mb-1">
                              Điều khoản số {String(index + 1).padStart(2, '0')}
                            </span>
                            <h3 className="font-display text-lg sm:text-xl font-bold text-[#0A1120] dark:text-white group-hover:text-[#D4AF37] transition-colors leading-snug">
                              {policy.title}
                            </h3>
                          </div>
                        </div>

                        {/* Content Body */}
                        <p className="text-gray-600 dark:text-gray-300 font-sans text-sm sm:text-[15px] leading-relaxed text-justify">
                          {policy.content}
                        </p>
                      </div>

                      {/* Footer Verification Tag */}
                      <div className="mt-7 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[11px] font-semibold text-[#8E96A4] uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={15} className="text-[#0F5132] dark:text-[#34D399]" />
                          <span>Chuản mực lưu trú Hotelify</span>
                        </div>
                        <span className="text-[#D4AF37] font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                          Chi tiết <ChevronRight size={13} />
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}

            {policies.length === 0 ? (
              <div className="py-20 text-center bg-white dark:bg-[#151B18] rounded-3xl border border-[#E8E4DB] dark:border-white/10 p-8 max-w-lg mx-auto shadow-sm">
                <Bookmark size={40} className="text-[#D4AF37] mx-auto mb-4 opacity-50" />
                <h3 className="font-display font-bold text-xl text-[#0A1120] dark:text-white mb-2">Chưa Có Dữ Liệu Chính Sách</h3>
                <p className="text-gray-500 text-sm">Hệ thống đang cập nhật các điều khoản lưu trú mới nhất từ ban quản lý khu nghỉ dưỡng.</p>
              </div>
            ) : null}
          </div>
        )}

        {/* 4. VIP CONCIERGE SUPPORT BANNER (BRIGHT WHITE & IVORY THEME) */}
        <div className="bg-[#FFFDF9] rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden border border-[#E8E4DB] shadow-lg mt-16 max-w-5xl mx-auto">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="w-14 h-14 rounded-full bg-white border border-[#C5A880] flex items-center justify-center mx-auto text-[#92703E] shadow-sm">
              <Award size={28} />
            </div>

            <h3 className="font-display italic text-2xl sm:text-4xl text-[#111A15] font-bold leading-tight">
              Quý Khách Có Yêu Cầu Đặc Biệt Hoặc Cần Tư Vấn Riêng?
            </h3>

            <p className="text-[#525966] text-sm sm:text-base leading-relaxed font-medium">
              Đội ngũ Quản gia (Butler) và Lễ tân 5 sao của Hotelify Hạ Long luôn túc trực 24/7 để hỗ trợ giải đáp mọi thắc mắc về thủ tục nhận phòng sớm, trả phòng muộn hay các chế độ chăm sóc VIP.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="tel:0868729129"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#111A15] hover:bg-[#C5A880] text-white font-extrabold text-sm tracking-wider uppercase shadow-md hover:scale-105 transition-all duration-300"
              >
                <Phone size={18} className="text-[#C5A880]" />
                <span>Hotline 24/7: 0868 729 129</span>
              </a>
              <a
                href="mailto:tinlatoi2003@gmail.com"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-white hover:bg-gray-50 text-[#111A15] font-bold text-sm tracking-wider uppercase border border-[#E8E4DB] shadow-xs transition-all duration-300"
              >
                <Mail size={18} className="text-[#92703E]" />
                <span>Gửi Email Hỗ Trợ</span>
              </a>
            </div>

            <div className="pt-4 flex items-center justify-center gap-6 text-xs font-bold text-[#92703E] uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Bảo mật thông tin</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Phản hồi trong 15 phút</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerPoliciesPage;
