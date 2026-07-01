import { useEffect, useState } from 'react';
import { managerApi } from '../services/manager-api.js';
import './manager-operations.css';

const statusLabels = { submitted: 'Đã gửi', Submitted: 'Đã gửi', responded: 'Đã phản hồi', Responded: 'Đã phản hồi', archived: 'Đã lưu trữ', Archived: 'Đã lưu trữ' };
const getErrorMessage = (error) => error?.response?.data?.message || error.message || 'Đã có lỗi xảy ra';
const formatDate = (value) => (value ? new Intl.DateTimeFormat('vi-VN').format(new Date(value)) : '-');
const renderStars = (rating) => `${'★'.repeat(Number(rating || 0))}${'☆'.repeat(5 - Number(rating || 0))}`;
const statusTone = (status) => String(status).toLowerCase() === 'responded' ? 'is-good' : String(status).toLowerCase() === 'archived' ? 'is-muted' : 'is-info';

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
  const [responseText, setResponseText] = useState('');
  const [message, setMessage] = useState('');
  const selectedFeedback = feedbacks.find((feedback) => feedback._id === selectedId);
  const responses = getResponses(selectedFeedback);

  const loadFeedbacks = async (nextId = selectedId) => {
    const params = {};
    if (ratingFilter) params.rating = ratingFilter;
    if (statusFilter) params.status = statusFilter;
    const data = await managerApi.getCustomerFeedbacks(params);
    setFeedbacks(data);
    if (nextId) {
      const nextFeedback = data.find((feedback) => feedback._id === nextId);
      if (nextFeedback) setSelectedId(nextFeedback._id);
    }
  };

  useEffect(() => { loadFeedbacks('').catch((error) => setMessage(getErrorMessage(error))); }, [ratingFilter, statusFilter]);
  const handleSelect = (feedback) => { setSelectedId(feedback._id); setResponseText(''); setMessage(''); };
  const handleRespond = async (event) => {
    event.preventDefault();
    if (!selectedFeedback) { setMessage('Vui lòng chọn một góp ý trước khi phản hồi.'); return; }
    try {
      const feedback = await managerApi.respondCustomerFeedback(selectedFeedback._id, responseText);
      setMessage('Gửi phản hồi cho khách hàng thành công.');
      setResponseText('');
      await loadFeedbacks(feedback._id);
    } catch (error) { setMessage(getErrorMessage(error)); }
  };
  const handleArchive = async () => {
    if (!selectedFeedback) return;
    try { const feedback = await managerApi.archiveCustomerFeedback(selectedFeedback._id); setMessage('Lưu trữ góp ý thành công.'); await loadFeedbacks(feedback._id); } catch (error) { setMessage(getErrorMessage(error)); }
  };

  return (
    <div className="manager-ops-page">
      {message && <div className="manager-ops-message">{message}</div>}
      <section className="manager-ops-grid">
        <article className="manager-ops-card">
          <div className="manager-ops-heading"><div><h2>Danh sách góp ý</h2><p>Lọc theo số sao, xem nội dung và phản hồi khách hàng.</p></div><span className="manager-ops-muted">{feedbacks.length} bản ghi</span></div>
          <div className="manager-ops-filter-row"><select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)}><option value="">Tất cả đánh giá</option><option value="5">5 sao</option><option value="4">4 sao</option><option value="3">3 sao</option><option value="2">2 sao</option><option value="1">1 sao</option></select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Tất cả trạng thái</option><option value="submitted">Đã gửi</option><option value="responded">Đã phản hồi</option><option value="archived">Đã lưu trữ</option></select></div>
          <div className="manager-ops-table-wrap"><table className="manager-ops-table"><thead><tr><th>Khách hàng</th><th>Đánh giá</th><th>Góp ý</th><th>Trạng thái</th></tr></thead><tbody>{feedbacks.length ? feedbacks.map((feedback) => <tr className={`manager-ops-row ${selectedId === feedback._id ? 'is-selected' : ''}`} key={feedback._id} onClick={() => handleSelect(feedback)}><td><strong>{feedback.customer_name || 'Khách hàng'}</strong><small>{feedback.customer_email || `Phòng ${feedback.room_number || '-'}`}</small></td><td><span className="manager-ops-stars">{renderStars(feedback.rating)}</span><small>{feedback.rating}/5</small></td><td><strong>{feedback.feedback_text}</strong><small>{formatDate(feedback.submitted_at || feedback.createdAt)}</small></td><td><span className={`manager-ops-status ${statusTone(feedback.status)}`}>{statusLabels[feedback.status] || feedback.status}</span></td></tr>) : <tr><td className="manager-ops-empty" colSpan="4">Chưa có góp ý nào.</td></tr>}</tbody></table></div>
        </article>
        <article className="manager-ops-card">
          <div className="manager-ops-heading"><div><h2>Phản hồi của quản lý</h2><p>Phản hồi đã gửi sẽ được giữ lại; nếu cần thì thêm phản hồi bổ sung.</p></div></div>
          {selectedFeedback ? <form className="manager-ops-form" onSubmit={handleRespond}><div className="manager-ops-summary manager-ops-wide"><strong>{selectedFeedback.customer_name || 'Khách hàng'} - Phòng {selectedFeedback.room_number || '-'}</strong><p><span className="manager-ops-stars">{renderStars(selectedFeedback.rating)}</span> {selectedFeedback.rating}/5</p><p>{selectedFeedback.feedback_text}</p><small>Ngày gửi: {formatDate(selectedFeedback.submitted_at || selectedFeedback.createdAt)}</small></div><div className="manager-ops-summary manager-ops-wide"><strong>Các phản hồi đã gửi</strong>{responses.length ? responses.map((response, index) => <p key={`${response.respondedAt || index}-${index}`}>{response.responseText}<small> - {response.responderName || 'Quản lý'} {response.respondedAt ? `(${formatDate(response.respondedAt)})` : ''}</small></p>) : <p>Chưa có phản hồi nào.</p>}</div><label className="manager-ops-wide">Thêm phản hồi mới<textarea onChange={(event) => setResponseText(event.target.value)} placeholder="Nhập phản hồi cho khách hàng..." required rows="7" value={responseText} /></label><div className="manager-ops-actions"><button className="manager-ops-button" type="submit">{responses.length ? 'Thêm phản hồi' : 'Gửi phản hồi'}</button><button className="manager-ops-danger" onClick={handleArchive} type="button">Lưu trữ</button></div></form> : <div className="manager-ops-detail-empty">Chọn một góp ý để xem chi tiết.</div>}
        </article>
      </section>
    </div>
  );
};

export default ManagerCustomerFeedbackPage;
