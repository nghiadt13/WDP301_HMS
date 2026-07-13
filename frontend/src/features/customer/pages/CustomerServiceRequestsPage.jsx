import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { cancelCustomerServiceRequest, getCustomerServiceRequests } from '../api/customerApi';
import './CustomerPages.css';

const statusLabels = {
  requested: 'Đang chờ xử lý',
  canceled: 'Đã hủy',
  handled: 'Đã xử lý'
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

const CustomerServiceRequestsPage = () => {
  const navigate = useNavigate();
  const [serviceRequests, setServiceRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleAuthError = (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hotelify_token');
      localStorage.removeItem('hotelify_user');
      navigate('/login');
      return true;
    }

    return false;
  };

  const loadServiceRequests = async () => {
    try {
      const data = await getCustomerServiceRequests();
      setServiceRequests(data.filter((request) => request.status !== 'canceled'));
    } catch (error) {
      if (!handleAuthError(error)) {
        setErrorMessage('Không thể tải lịch sử yêu cầu dịch vụ. Vui lòng kiểm tra backend đã chạy chưa.');
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

    loadServiceRequests();
  }, [navigate]);

  const handleCancelRequest = async (requestId) => {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await cancelCustomerServiceRequest(requestId);
      setServiceRequests((currentRequests) => currentRequests.filter((request) => request.id !== requestId));
      setSuccessMessage('Hủy yêu cầu dịch vụ thành công.');
    } catch (error) {
      if (!handleAuthError(error)) {
        setErrorMessage(error.response?.data?.message || 'Không thể hủy yêu cầu dịch vụ.');
      }
    }
  };

  return (
    <section className="customer-page">
      <div className="customer-hero">
        <div>
          <span className="customer-chip">Dịch vụ khách hàng</span>
          <h1>Yêu cầu dịch vụ của tôi</h1>
          <p>Xem lịch sử yêu cầu dịch vụ khách sạn và hủy các yêu cầu đang chờ xử lý.</p>
        </div>
      </div>

      {errorMessage ? <div className="customer-alert error">{errorMessage}</div> : null}
      {successMessage ? <div className="customer-alert success">{successMessage}</div> : null}

      <div className="customer-requests-panel standalone">
        <div className="customer-section-heading">
          <div>
            <h2>Lịch sử yêu cầu</h2>
            <p>Các yêu cầu được hiển thị từ mới nhất đến cũ nhất.</p>
          </div>
          <button className="customer-button secondary" type="button" onClick={() => navigate('/customer/services')}>
            Quay lại dịch vụ
          </button>
        </div>

        {isLoading ? (
          <div className="customer-empty-state">Đang tải yêu cầu dịch vụ...</div>
        ) : (
          <div className="customer-request-list">
            {serviceRequests.length === 0 ? (
              <div className="customer-empty-state">Chưa có yêu cầu dịch vụ nào.</div>
            ) : (
              serviceRequests.map((request) => (
                <article className="customer-request-item" key={request.id}>
                  <div>
                    <span className={`customer-status ${request.status}`}>{statusLabels[request.status] || request.status}</span>
                    <h3>{request.serviceName}</h3>
                    <p>
                      Phòng {request.roomNumber} - {formatDateTime(request.requestedAt)}
                    </p>
                    {request.note ? <p className="customer-muted">{request.note}</p> : null}
                  </div>
                  {request.status === 'requested' ? (
                    <button
                      className="customer-button danger"
                      type="button"
                      onClick={() => handleCancelRequest(request.id)}
                    >
                      Hủy yêu cầu
                    </button>
                  ) : null}
                </article>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default CustomerServiceRequestsPage;


