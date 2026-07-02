import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getCustomerFeedbacks, sendCustomerFeedback, updateCustomerFeedback } from '../api/customerApi';
import './CustomerPages.css';

const ratingOptions = [
  { value: '5', label: 'Rất hài lòng' },
  { value: '4', label: 'Hài lòng' },
  { value: '3', label: 'Bình thường' },
  { value: '2', label: 'Chưa hài lòng' },
  { value: '1', label: 'Rất không hài lòng' }
];

const statusLabels = {
  submitted: 'Đã gửi',
  responded: 'Đã phản hồi',
  archived: 'Đã lưu trữ'
};

const initialForm = {
  roomNumber: '',
  rating: '5',
  feedbackText: ''
};

const getRatingLabel = (rating) =>
  ratingOptions.find((option) => option.value === String(rating))?.label || 'Chưa đánh giá';

const renderStars = (rating) => {
  const value = Math.max(0, Math.min(5, Number(rating || 0)));
  return `${'\u2605'.repeat(value)}${'\u2606'.repeat(5 - value)}`;
};

const formatDateTime = (value) => {
  if (!value) {
    return 'Không có dữ liệu';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
};

const CustomerFeedbackPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingFeedbackId, setEditingFeedbackId] = useState('');

  const existingFeedback = feedbacks[0];
  const isFeedbackLocked = Boolean(existingFeedback) && !editingFeedbackId;

  const handleAuthError = (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hotelify_token');
      localStorage.removeItem('hotelify_user');
      navigate('/login');
      return true;
    }

    return false;
  };

  const loadFeedbacks = async () => {
    try {
      const data = await getCustomerFeedbacks();
      setFeedbacks(data);
    } catch (error) {
      if (!handleAuthError(error)) {
        setErrorMessage('Không thể tải lịch sử góp ý. Vui lòng kiểm tra backend đã chạy chưa.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('hotelify_token')) {
      navigate('/login');
      return;
    }

    loadFeedbacks();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (formData.roomNumber && !/^[A-Za-z0-9-]{1,12}$/.test(formData.roomNumber)) {
      return 'Số phòng không hợp lệ.';
    }

    if (!Number.isFinite(Number(formData.rating)) || Number(formData.rating) < 1 || Number(formData.rating) > 5) {
      return 'Vui lòng chọn đánh giá từ 1 đến 5 sao.';
    }

    if (formData.feedbackText.trim().length < 3) {
      return 'Nội dung góp ý phải có ít nhất 3 ký tự.';
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (isFeedbackLocked) {
      setErrorMessage('Bạn đã gửi góp ý rồi. Vui lòng cập nhật góp ý hiện có nếu muốn bổ sung.');
      return;
    }

    const validationMessage = validateForm();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = editingFeedbackId
        ? await updateCustomerFeedback(editingFeedbackId, formData)
        : await sendCustomerFeedback(formData);

      setFeedbacks((currentFeedbacks) => {
        if (editingFeedbackId) {
          return currentFeedbacks.map((feedback) =>
            feedback.id === editingFeedbackId ? response.feedback : feedback
          );
        }

        return [response.feedback, ...currentFeedbacks];
      });
      setSuccessMessage(editingFeedbackId ? 'Cập nhật góp ý thành công.' : 'Gửi góp ý thành công.');
      setFormData(initialForm);
      setEditingFeedbackId('');
    } catch (error) {
      if (!handleAuthError(error)) {
        setErrorMessage(error.response?.data?.message || 'Không thể gửi góp ý. Vui lòng kiểm tra backend đã chạy chưa.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFeedback = (feedback) => {
    setErrorMessage('');
    setSuccessMessage('');
    setEditingFeedbackId(feedback.id);
    setFormData({
      roomNumber: feedback.roomNumber || '',
      rating: String(feedback.rating || '5'),
      feedbackText: feedback.feedbackText || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingFeedbackId('');
    setFormData(initialForm);
  };

  return (
    <section className="customer-page">
      <div className="customer-hero">
        <div>
          <span className="customer-chip">Góp ý khách hàng</span>
          <h1>Gửi góp ý</h1>
          <p>Đánh giá trải nghiệm khách sạn và theo dõi phản hồi của quản lý tại một nơi.</p>
        </div>
      </div>

      {errorMessage ? <div className="customer-alert error">{errorMessage}</div> : null}
      {successMessage ? <div className="customer-alert success">{successMessage}</div> : null}

      <div className="customer-feedback-board">
        <div className="customer-form-card">
          <h2>{editingFeedbackId ? 'Cập nhật góp ý' : 'Thông tin góp ý'}</h2>
          <p>
            {isFeedbackLocked
              ? 'Bạn đã gửi góp ý rồi. Hãy dùng nút Cập nhật góp ý trong phần Góp ý của tôi nếu muốn bổ sung thông tin.'
              : 'Vui lòng mô tả trải nghiệm rõ ràng để quản lý khách sạn có thể theo dõi và xử lý phù hợp.'}
          </p>

          <form className="customer-form" onSubmit={handleSubmit}>
            <label>
              Số phòng
              <input
                disabled={isFeedbackLocked}
                name="roomNumber"
                onChange={handleChange}
                placeholder="305"
                type="text"
                value={formData.roomNumber}
              />
            </label>

            <div className="customer-rating-field">
              <span>Đánh giá</span>
              <div className="customer-rating-options">
                {ratingOptions.map((option) => (
                  <button
                    className={`customer-rating-choice ${formData.rating === option.value ? 'is-selected' : ''}`}
                    disabled={isFeedbackLocked}
                    key={option.value}
                    type="button"
                    onClick={() => setFormData((currentData) => ({ ...currentData, rating: option.value }))}
                  >
                    <span className="customer-stars">{renderStars(option.value)}</span>
                    <strong>
                      {option.value} - {option.label}
                    </strong>
                  </button>
                ))}
              </div>
            </div>

            <label className="full">
              Nội dung góp ý
              <textarea
                disabled={isFeedbackLocked}
                name="feedbackText"
                onChange={handleChange}
                placeholder="Hãy cho chúng tôi biết điều gì đã xảy ra, bạn đã dùng dịch vụ nào hoặc khách sạn cần cải thiện gì."
                rows="8"
                value={formData.feedbackText}
              />
            </label>

            <div className="customer-actions full">
              <button className="customer-button" disabled={isSubmitting || isFeedbackLocked} type="submit">
                {isSubmitting ? 'Đang gửi...' : editingFeedbackId ? 'Lưu cập nhật góp ý' : 'Gửi góp ý'}
              </button>
              {editingFeedbackId ? (
                <button className="customer-button secondary" type="button" onClick={handleCancelEdit}>
                  Hủy cập nhật
                </button>
              ) : (
                <button className="customer-button secondary" disabled={isFeedbackLocked} type="button" onClick={() => setFormData(initialForm)}>
                  Xóa nội dung
                </button>
              )}
            </div>
          </form>
        </div>

        <aside className="customer-history-card">
          <div className="customer-section-heading">
            <div>
              <h2>Góp ý của tôi</h2>
              <p>Xem góp ý đã gửi, các phiên bản trước và phản hồi của quản lý.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="customer-empty-state">Đang tải lịch sử góp ý...</div>
          ) : feedbacks.length === 0 ? (
            <div className="customer-empty-state">Bạn chưa gửi góp ý nào.</div>
          ) : (
            <div className="customer-feedback-list">
              {feedbacks.map((feedback) => (
                <article className="customer-feedback-item" key={feedback.id}>
                  {feedback.history?.length > 0 ? (
                    <div className="customer-feedback-version-list">
                      <strong>Góp ý trước đó</strong>
                      {feedback.history.map((historyItem, index) => (
                        <div className="customer-feedback-version" key={`${historyItem.savedAt || historyItem.submittedAt}-${index}`}>
                          <div className="customer-feedback-head">
                            <div>
                              <span className="customer-stars">{renderStars(historyItem.rating)}</span>
                              <strong>
                                {historyItem.rating} - {getRatingLabel(historyItem.rating)}
                              </strong>
                            </div>
                            <span className={`customer-status ${historyItem.status}`}>{statusLabels[historyItem.status] || historyItem.status}</span>
                          </div>
                          <p>{historyItem.feedbackText}</p>
                          <small>
                            {historyItem.roomNumber ? `Phòng ${historyItem.roomNumber} - ` : ''}
                            {formatDateTime(historyItem.submittedAt)}
                          </small>
                          {historyItem.responseText ? (
                            <div className="customer-manager-response">
                              <strong>Phản hồi của quản lý cho góp ý này</strong>
                              <p>{historyItem.responseText}</p>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <strong className="customer-current-label">Góp ý hiện tại</strong>
                  <div className="customer-feedback-head">
                    <div>
                      <span className="customer-stars">{renderStars(feedback.rating)}</span>
                      <strong>
                        {feedback.rating} - {getRatingLabel(feedback.rating)}
                      </strong>
                    </div>
                    <span className={`customer-status ${feedback.status}`}>{statusLabels[feedback.status] || feedback.status}</span>
                  </div>
                  <p>{feedback.feedbackText}</p>
                  <small>
                    {feedback.roomNumber ? `Phòng ${feedback.roomNumber} - ` : ''}
                    {formatDateTime(feedback.submittedAt)}
                  </small>
                  <div className="customer-manager-response">
                    <strong>Phản hồi của quản lý</strong>
                    <p>{feedback.responseText || 'Chưa có phản hồi từ quản lý.'}</p>
                  </div>
                  <button className="customer-button small" type="button" onClick={() => handleEditFeedback(feedback)}>
                    Cập nhật góp ý
                  </button>
                </article>
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
};

export default CustomerFeedbackPage;



