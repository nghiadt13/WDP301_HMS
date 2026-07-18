import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getCustomerFeedbackRooms,
  getCustomerFeedbacks,
  sendCustomerFeedback
} from '../api/customerApi';
import './CustomerPages.css';

const ratingOptions = [
  { value: '5', label: 'Xuất sắc', note: 'Trải nghiệm vượt mong đợi' },
  { value: '4', label: 'Tốt', note: 'Hài lòng với dịch vụ' },
  { value: '3', label: 'Ổn', note: 'Có thể cải thiện thêm' },
  { value: '2', label: 'Chưa tốt', note: 'Cần được hỗ trợ' },
  { value: '1', label: 'Rất tệ', note: 'Trải nghiệm không hài lòng' }
];

const statusLabels = {
  submitted: 'Đã gửi',
  responded: 'Đã phản hồi',
  archived: 'Đã lưu trữ'
};

const initialForm = {
  reservationId: '',
  rating: '5',
  feedbackText: ''
};

const getRatingLabel = (rating) =>
  ratingOptions.find((option) => option.value === String(rating))?.label || 'Chưa đánh giá';

const renderStars = (rating) => {
  const value = Math.max(0, Math.min(5, Number(rating || 0)));
  return `${'★'.repeat(value)}${'☆'.repeat(5 - value)}`;
};

const formatDateTime = (value) => {
  if (!value) return 'Không có dữ liệu';

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
};

const formatDate = (value) => {
  if (!value) return 'Chưa có ngày';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value));
};

const CustomerFeedbackPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackRooms, setFeedbackRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const existingFeedback = feedbacks[0];
  const isFeedbackLocked = Boolean(existingFeedback);
  const selectedRoom = feedbackRooms.find((room) => room.reservationId === formData.reservationId);
  const averageRating = feedbacks.length
    ? (feedbacks.reduce((total, feedback) => total + Number(feedback.rating || 0), 0) / feedbacks.length).toFixed(1)
    : '0.0';
  const hasManagerResponse = feedbacks.some((feedback) => feedback.responseText);
  const canSubmitFeedback = feedbackRooms.length > 0;

  const handleAuthError = (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hotelify_token');
      localStorage.removeItem('hotelify_user');
      navigate('/login');
      return true;
    }

    return false;
  };

  const loadFeedbackData = async () => {
    try {
      const [feedbackData, roomData] = await Promise.all([
        getCustomerFeedbacks(),
        getCustomerFeedbackRooms()
      ]);
      setFeedbacks(feedbackData);
      setFeedbackRooms(roomData);
      setFormData((currentData) => ({
        ...currentData,
        reservationId: currentData.reservationId || roomData[0]?.reservationId || ''
      }));
    } catch (error) {
      if (!handleAuthError(error)) {
        setErrorMessage('Không thể tải dữ liệu góp ý. Vui lòng kiểm tra backend đã chạy chưa.');
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

    loadFeedbackData();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.reservationId) {
      return 'Vui lòng chọn phòng/booking muốn đánh giá.';
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
      setErrorMessage('Bạn đã gửi góp ý rồi. Mỗi tài khoản chỉ được gửi một góp ý.');
      return;
    }

    const validationMessage = validateForm();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        reservationId: formData.reservationId,
        rating: formData.rating,
        feedbackText: formData.feedbackText
      };
      const response = await sendCustomerFeedback(payload);

      setFeedbacks((currentFeedbacks) => [response.feedback, ...currentFeedbacks]);
      setSuccessMessage('Gửi góp ý thành công.');
      setFormData({ ...initialForm, reservationId: feedbackRooms[0]?.reservationId || '' });
    } catch (error) {
      if (!handleAuthError(error)) {
        setErrorMessage(error.response?.data?.message || 'Không thể gửi góp ý. Vui lòng kiểm tra backend đã chạy chưa.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="customer-page customer-feedback-page">
      <div className="customer-hero customer-feedback-hero">
        <div>
          <span className="customer-chip">Góp ý khách hàng</span>
          <h1>Đánh giá kỳ lưu trú</h1>
          <p>Sau khi lễ tân hoàn tất check-out, bạn có thể đánh giá đúng phòng vừa lưu trú và theo dõi phản hồi từ quản lý khách sạn.</p>
        </div>
        <div className="customer-feedback-hero-score">
          <span>{renderStars(existingFeedback?.rating || 0)}</span>
          <strong>{existingFeedback ? `${existingFeedback.rating}/5` : 'Chưa đánh giá'}</strong>
          <small>{existingFeedback ? getRatingLabel(existingFeedback.rating) : 'Hãy gửi góp ý đầu tiên của bạn'}</small>
        </div>
      </div>

      {errorMessage ? <div className="customer-alert error">{errorMessage}</div> : null}
      {successMessage ? <div className="customer-alert success">{successMessage}</div> : null}

      <div className="customer-feedback-stats">
        <div className="feedback-stat-card rating">
          <span>Điểm đánh giá của tôi</span>
          <strong>{averageRating}</strong>
          <small>{existingFeedback ? getRatingLabel(existingFeedback.rating) : 'Chưa có điểm'}</small>
        </div>
        <div className="feedback-stat-card response">
          <span>Phản hồi quản lý</span>
          <strong>{hasManagerResponse ? 'Có' : 'Chưa'}</strong>
          <small>Theo dõi câu trả lời sau khi gửi góp ý</small>
        </div>
      </div>

      <div className="customer-feedback-board enhanced">
        <div className="customer-form-card feedback-compose-card">
          <div className="feedback-card-heading">
            <div>
              <span className="customer-chip">Góp ý mới</span>
              <h2>Bạn muốn đánh giá phòng nào?</h2>
              <p>
                {isFeedbackLocked
                  ? 'Bạn đã gửi góp ý rồi. Mỗi tài khoản chỉ được gửi một góp ý.'
                  : 'Chọn đúng booking đã check-out để quản lý khách sạn xử lý góp ý chính xác hơn.'}
              </p>
            </div>
          </div>

          {!canSubmitFeedback ? (
            <div className="customer-empty-state">
              Tài khoản của bạn chưa có booking đã check-out để gửi góp ý.
            </div>
          ) : null}

          <form className="customer-form feedback-form" onSubmit={handleSubmit}>
            <label className="full">
              Phòng / booking đã check-out
              <select
                disabled={isFeedbackLocked || !canSubmitFeedback}
                name="reservationId"
                onChange={handleChange}
                value={formData.reservationId}
              >
                <option value="">Chọn phòng/booking đã check-out</option>
                {feedbackRooms.map((room) => (
                  <option key={room.reservationId} value={room.reservationId}>
                    {room.roomName} {room.bookingCode ? `- ${room.bookingCode}` : ''}
                  </option>
                ))}
              </select>
            </label>

            {selectedRoom ? (
              <div className="feedback-selected-room full">
                <div>
                  <strong>{selectedRoom.roomName}</strong>
                  <span>{selectedRoom.bookingCode || 'Booking của bạn'}</span>
                </div>
                <div>
                  <small>Nhận phòng</small>
                  <strong>{formatDate(selectedRoom.checkInDate)}</strong>
                </div>
                <div>
                  <small>Trả phòng</small>
                  <strong>{formatDate(selectedRoom.checkOutDate)}</strong>
                </div>
                <span className="customer-status submitted">{selectedRoom.bookingStatus || 'Booking'}</span>
              </div>
            ) : null}

            <div className="customer-rating-field">
              <span>Đánh giá trải nghiệm</span>
              <div className="customer-rating-options premium">
                {ratingOptions.map((option) => (
                  <button
                    className={`customer-rating-choice ${formData.rating === option.value ? 'is-selected' : ''}`}
                    disabled={isFeedbackLocked || !canSubmitFeedback}
                    key={option.value}
                    type="button"
                    onClick={() => setFormData((currentData) => ({ ...currentData, rating: option.value }))}
                  >
                    <span className="customer-stars">{renderStars(option.value)}</span>
                    <strong>{option.value} - {option.label}</strong>
                    <small>{option.note}</small>
                  </button>
                ))}
              </div>
            </div>

            <label className="full">
              Nội dung góp ý
              <textarea
                disabled={isFeedbackLocked || !canSubmitFeedback}
                name="feedbackText"
                onChange={handleChange}
                placeholder="Ví dụ: Phòng sạch, nhân viên hỗ trợ nhanh. Tôi muốn khách sạn cải thiện thêm tốc độ phục vụ bữa sáng."
                rows="7"
                value={formData.feedbackText}
              />
            </label>

            <div className="customer-actions full">
              <button className="customer-button" disabled={isSubmitting || isFeedbackLocked || !canSubmitFeedback} type="submit">
                {isSubmitting ? 'Đang gửi...' : 'Gửi góp ý'}
              </button>
              <button className="customer-button secondary" disabled={isFeedbackLocked || !canSubmitFeedback} type="button" onClick={() => setFormData({ ...initialForm, reservationId: feedbackRooms[0]?.reservationId || '' })}>
                Xóa nội dung
              </button>
            </div>
          </form>
        </div>

        <aside className="customer-history-card feedback-timeline-card">
          <div className="customer-section-heading">
            <div>
              <h2>Góp ý của tôi</h2>
              <p>Góp ý của bạn và phản hồi từ quản lý.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="customer-empty-state">Đang tải lịch sử góp ý...</div>
          ) : feedbacks.length === 0 ? (
            <div className="customer-empty-state">Bạn chưa gửi góp ý nào.</div>
          ) : (
            <div className="customer-feedback-list professional">
              {feedbacks.map((feedback) => (
                <article className="customer-feedback-item professional" key={feedback.id}>
                  <div className="customer-feedback-head">
                    <div>
                      <span className="customer-stars large">{renderStars(feedback.rating)}</span>
                      <strong>{feedback.rating} - {getRatingLabel(feedback.rating)}</strong>
                      <small>{feedback.roomNumber ? `Phòng ${feedback.roomNumber}` : 'Booking của bạn'} - {formatDateTime(feedback.submittedAt)}</small>
                    </div>
                    <span className={`customer-status ${feedback.status}`}>{statusLabels[feedback.status] || feedback.status}</span>
                  </div>

                  <p>{feedback.feedbackText}</p>

                  <div className="customer-manager-response highlighted">
                    <strong>Phản hồi của quản lý</strong>
                    <p>{feedback.responseText || 'Quản lý chưa phản hồi góp ý này.'}</p>
                  </div>

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
