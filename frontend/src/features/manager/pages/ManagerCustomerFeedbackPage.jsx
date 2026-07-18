import { useEffect, useMemo, useState } from 'react';
import { Search, Star, MessageSquare } from 'lucide-react';
import { managerApi } from '../services/manager-api.js';
import './manager-operations.css';

const statusLabels = { submitted: 'Chưa phản hồi', Submitted: 'Chưa phản hồi', responded: 'Đã phản hồi', Responded: 'Đã phản hồi' };
const statusTone = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'responded') return 'is-good';
  return 'is-info';
};
const getErrorMessage = (error) => error?.response?.data?.message || error.message || 'Đã có lỗi xảy ra';
const formatDate = (value) => (value ? new Intl.DateTimeFormat('vi-VN').format(new Date(value)) : '-');
const normalizeStatus = (status) => String(status || '').toLowerCase();
const getCustomerKey = (feedback) => feedback.customer_email || feedback.customer_id || feedback.customer_name || feedback._id;
const renderStars = (rating) => {
  const value = Math.max(0, Math.min(5, Number(rating || 0)));
  return `${'★'.repeat(value)}${'☆'.repeat(5 - value)}`;
};

const getResponses = (feedback) => {
  if (feedback?.manager_responses?.length) return feedback.manager_responses;
  if (feedback?.managerResponses?.length) return feedback.managerResponses;
  if (feedback?.response_text) return [{ responseText: feedback.response_text, responderName: 'Quản lý', respondedAt: feedback.responded_at }];
  return [];
};

const ManagerCustomerFeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [responseText, setResponseText] = useState('');
  const [message, setMessage] = useState('');

  const selectedFeedback = feedbacks.find((feedback) => feedback._id === selectedId);
  const responses = getResponses(selectedFeedback);

  const loadFeedbacks = async (nextId = selectedId) => {
    const data = await managerApi.getCustomerFeedbacks();
    setFeedbacks(data);
    if (nextId) {
      const nextFeedback = data.find((feedback) => feedback._id === nextId);
      if (nextFeedback) setSelectedId(nextFeedback._id);
    }
  };

  useEffect(() => {
    loadFeedbacks('').catch((error) => setMessage(getErrorMessage(error)));
  }, []);

  const filteredFeedbacks = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return feedbacks.filter((feedback) => {
      const matchesKeyword = !keyword || [feedback.customer_name, feedback.customer_email, feedback.feedback_text, feedback.room_number]
        .some((value) => String(value || '').toLowerCase().includes(keyword));
      const matchesRating = !ratingFilter || Number(feedback.rating) === Number(ratingFilter);
      const matchesStatus = !statusFilter || normalizeStatus(feedback.status) === statusFilter;
      return matchesKeyword && matchesRating && matchesStatus;
    });
  }, [feedbacks, ratingFilter, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const totalReviews = feedbacks.length;
    const totalGuests = new Set(feedbacks.map(getCustomerKey).filter(Boolean)).size;
    const averageRating = totalReviews ? feedbacks.reduce((sum, feedback) => sum + Number(feedback.rating || 0), 0) / totalReviews : 0;
    return { totalReviews, totalGuests, averageRating };
  }, [feedbacks]);

  const ratingRows = useMemo(() => [5, 4, 3, 2, 1].map((rating) => {
    const count = feedbacks.filter((feedback) => Number(feedback.rating) === rating).length;
    const percent = stats.totalReviews ? Math.round((count / stats.totalReviews) * 100) : 0;
    return { rating, count, percent };
  }), [feedbacks, stats.totalReviews]);

  const handleSelect = (feedback) => {
    setSelectedId(feedback._id);
    setResponseText('');
    setMessage('');
  };

  const handleRespond = async (event) => {
    event.preventDefault();
    if (!selectedFeedback) {
      setMessage('Vui lòng chọn một góp ý trước khi phản hồi.');
      return;
    }
    try {
      const feedback = await managerApi.respondCustomerFeedback(selectedFeedback._id, responseText);
      setMessage('Gửi phản hồi cho khách hàng thành công.');
      setResponseText('');
      await loadFeedbacks(feedback._id);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  return (
    <div className="manager-ops-page manager-figma-page reviews-page">
      {message && <div className="manager-ops-message">{message}</div>}

      <section className="reviews-dashboard-grid">
        <article className="figma-card review-stat-card">
          <div className="figma-card-heading"><h2>Thống kê đánh giá</h2><span>...</span></div>
          <div className="review-stat-row"><span>Tổng khách góp ý</span><strong>{stats.totalGuests}</strong></div>
          <div className="review-stat-row"><span>Tổng đánh giá</span><strong>{stats.totalReviews}</strong></div>
        </article>

        <article className="figma-card rating-card">
          <div className="figma-card-heading"><h2>Điểm đánh giá</h2><span>...</span></div>
          <div className="rating-ring" style={{ '--score': `${Math.min((stats.averageRating / 5) * 100, 100)}%` }}>
            <div><span>Điểm trung bình</span><strong>{stats.averageRating.toFixed(1)}</strong><small>/5.0</small></div>
          </div>
          <div className="rating-breakdown">
            {ratingRows.map((row) => (
              <div key={row.rating}><span>{row.rating} sao</span><strong>{renderStars(row.rating)}</strong><small>{row.count} lượt</small></div>
            ))}
          </div>
        </article>
      </section>

      <section className="figma-card feedback-workspace">
        <div className="inventory-toolbar feedback-toolbar">
          <label className="figma-search-box">
            <Search size={17} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm khách hàng, phòng, nội dung góp ý..." />
          </label>
          <select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)}>
            <option value="">Tất cả sao</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="submitted">Chưa phản hồi</option>
            <option value="responded">Đã phản hồi</option>
          </select>
        </div>

        <div className="feedback-split-grid">
          <article className="feedback-list-panel">
            <div className="figma-card-heading"><h2>Danh sách góp ý</h2><span>{filteredFeedbacks.length} bản ghi</span></div>
            <div className="feedback-card-list">
              {filteredFeedbacks.length ? filteredFeedbacks.map((feedback) => (
                <button className={`feedback-review-card ${selectedId === feedback._id ? 'is-selected' : ''}`} key={feedback._id} type="button" onClick={() => handleSelect(feedback)}>
                  <span className="feedback-avatar">{String(feedback.customer_name || 'K').charAt(0).toUpperCase()}</span>
                  <span className="feedback-review-content">
                    <strong>{feedback.customer_name || 'Khách hàng'}</strong>
                    <small>Phòng {feedback.room_number || '-'} · {formatDate(feedback.submitted_at || feedback.createdAt)}</small>
                    <span className="manager-ops-stars">{renderStars(feedback.rating)} <b>{feedback.rating}/5</b></span>
                    <em>{feedback.feedback_text}</em>
                  </span>
                  <span className={`manager-ops-status ${statusTone(feedback.status)}`}>{statusLabels[feedback.status] || feedback.status}</span>
                </button>
              )) : <div className="manager-ops-empty">Không tìm thấy góp ý phù hợp.</div>}
            </div>
          </article>

          <article className="feedback-response-panel">
            <div className="figma-card-heading"><h2>Phản hồi quản lý</h2><MessageSquare size={18} /></div>
            {selectedFeedback ? (
              <form className="manager-ops-form feedback-response-form" onSubmit={handleRespond}>
                <div className="manager-ops-summary manager-ops-wide">
                  <strong>{selectedFeedback.customer_name || 'Khách hàng'} - Phòng {selectedFeedback.room_number || '-'}</strong>
                  <p><span className="manager-ops-stars">{renderStars(selectedFeedback.rating)}</span> {selectedFeedback.rating}/5</p>
                  <p>{selectedFeedback.feedback_text}</p>
                  <small>Ngày gửi: {formatDate(selectedFeedback.submitted_at || selectedFeedback.createdAt)}</small>
                </div>
                <div className="manager-ops-summary manager-ops-wide">
                  <strong>Các phản hồi đã gửi</strong>
                  {responses.length ? responses.map((response, index) => (
                    <p key={`${response.respondedAt || index}-${index}`}>{response.responseText}<small> - {response.responderName || 'Quản lý'} {response.respondedAt ? `(${formatDate(response.respondedAt)})` : ''}</small></p>
                  )) : <p>Chưa có phản hồi nào.</p>}
                </div>
                <label className="manager-ops-wide">Thêm phản hồi mới<textarea onChange={(event) => setResponseText(event.target.value)} placeholder="Nhập phản hồi cho khách hàng..." required rows="6" value={responseText} /></label>
                <div className="manager-ops-actions">
                  <button className="manager-ops-button" type="submit"><Star size={15} /> {responses.length ? 'Thêm phản hồi' : 'Gửi phản hồi'}</button>
                </div>
              </form>
            ) : <div className="manager-ops-detail-empty">Chọn một góp ý để xem chi tiết và phản hồi.</div>}
          </article>
        </div>
      </section>
    </div>
  );
};

export default ManagerCustomerFeedbackPage;
