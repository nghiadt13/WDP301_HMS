import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getCustomerRooms,
  getCustomerServiceRequests,
  getHotelServices,
  requestHotelService
} from '../api/customerApi';
import './CustomerPages.css';

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  });


const initialRequestForm = {
  reservationId: '',
  note: ''
};

const getServiceVisualKey = (service) => {
  const rawKey = String(service.imageKey || service.category || service.name || '').toLowerCase();

  if (rawKey.includes('dining') || rawKey.includes('room service')) {
    return 'dining';
  }

  if (rawKey.includes('housekeeping')) {
    return 'housekeeping';
  }

  if (rawKey.includes('laundry')) {
    return 'laundry';
  }

  if (rawKey.includes('technical') || rawKey.includes('maintenance')) {
    return 'maintenance';
  }

  if (rawKey.includes('transport') || rawKey.includes('airport')) {
    return 'transport';
  }

  if (rawKey.includes('spa') || rawKey.includes('wellness') || rawKey.includes('massage') || rawKey.includes('foot soak')) {
    return 'spa';
  }

  return 'amenities';
};

const ServiceVisual = ({ service, variant = 'card' }) => {
  const [hasImageError, setHasImageError] = useState(false);
  const visualKey = getServiceVisualKey(service);

  if (service.imageUrl && !hasImageError) {
    return (
      <img
        className={`customer-service-image ${variant}`}
        src={service.imageUrl}
        alt={service.name}
        onError={() => setHasImageError(true)}
      />
    );
  }

  return (
    <div className={`customer-service-visual ${visualKey} ${variant}`} aria-hidden="true">
      <strong>{service.category}</strong>
    </div>
  );
};

const CustomerServicesPage = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [requestForm, setRequestForm] = useState(initialRequestForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const loadCustomerServices = async () => {
    try {
      const [serviceData, requestData, roomData] = await Promise.all([
        getHotelServices(),
        getCustomerServiceRequests(),
        getCustomerRooms()
      ]);
      setServices(serviceData);
      setServiceRequests(requestData.filter((request) => request.status !== 'canceled'));
      setRooms(roomData);
    } catch (error) {
      if (!handleAuthError(error)) {
        setErrorMessage('Không thể tải danh sách dịch vụ. Vui lòng kiểm tra backend đã chạy chưa.');
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

    loadCustomerServices();
  }, [navigate]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId),
    [selectedServiceId, services]
  );

  const pendingRequestCount = serviceRequests.filter((request) => request.status === 'requested').length;

  const handleRequestChange = (event) => {
    const { name, value } = event.target;
    setRequestForm((currentData) => ({
      ...currentData,
      [name]: value
    }));
  };

  const closeServiceModal = () => {
    setSelectedServiceId('');
    setRequestForm(initialRequestForm);
  };

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedService) {
      setErrorMessage('Vui lòng chọn một dịch vụ.');
      return;
    }

    if (!requestForm.reservationId) {
      setErrorMessage('Vui lòng chọn phòng từ booking đã thanh toán trước khi gửi yêu cầu dịch vụ.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await requestHotelService(selectedService.id, requestForm);
      setServiceRequests((currentRequests) => [response.request, ...currentRequests]);
      setSuccessMessage('Gửi yêu cầu dịch vụ thành công. Yêu cầu đã được chuyển đến lễ tân.');
      closeServiceModal();
    } catch (error) {
      if (!handleAuthError(error)) {
        setErrorMessage(error.response?.data?.message || 'Không thể gửi yêu cầu dịch vụ.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="customer-page">
      <div className="customer-hero">
        <div>
          <span className="customer-chip">Dịch vụ khách hàng</span>
          <h1>Xem dịch vụ khách sạn</h1>
          <p>Xem các dịch vụ khách sạn, gửi yêu cầu cho booking đã thanh toán và hủy các yêu cầu đang chờ xử lý.</p>
        </div>
      </div>

      {errorMessage ? <div className="customer-alert error">{errorMessage}</div> : null}
      {successMessage ? <div className="customer-alert success">{successMessage}</div> : null}

      {isLoading ? (
        <div className="customer-card">
          <div className="customer-card-body">Đang tải dịch vụ...</div>
        </div>
      ) : (
        <>
          <div className="customer-service-summary">
            <div className="customer-summary-card services">
              <strong>{services.length}</strong>
              <span>Dịch vụ hiện có</span>
            </div>
            <div className="customer-summary-card pending">
              <strong>{pendingRequestCount}</strong>
              <span>Yêu cầu đang chờ</span>
            </div>
            <button
              className="customer-summary-action"
              type="button"
              onClick={() => navigate('/customer/service-requests')}
            >
              <strong>Yêu cầu dịch vụ của tôi</strong>
              <span>Xem lịch sử yêu cầu</span>
              {serviceRequests.length > 0 ? (
                <span className="customer-request-badge" aria-label={`${serviceRequests.length} yêu cầu dịch vụ`}>
                  {serviceRequests.length}
                </span>
              ) : null}
            </button>
          </div>

          <div className="customer-section-heading">
            <div>
              <h2>Dịch vụ khách sạn</h2>
              <p>Chọn một dịch vụ để xem chi tiết và gửi yêu cầu.</p>
            </div>
          </div>

          <div className="customer-grid">
            {services.map((service) => (
              <article className="customer-card" key={service.id}>
                <ServiceVisual service={service} />
                <div className="customer-card-body">
                  <div className="customer-card-title">
                    <span className="customer-chip">{service.category}</span>
                    <h2>{service.name}</h2>
                  </div>
                  <p>{service.description}</p>
                  <div className="customer-meta">
                    <span>{service.availableTime || 'Có theo yêu cầu'}</span>
                    <span>{service.price > 0 ? formatCurrency(service.price) : 'Liên hệ lễ tân'}</span>
                  </div>
                  <button className="customer-button" type="button" onClick={() => setSelectedServiceId(service.id)}>
                    Xem chi tiết / Yêu cầu
                  </button>
                </div>
              </article>
            ))}
          </div>

          {selectedService ? (
            <div className="customer-modal-backdrop" role="presentation" onClick={closeServiceModal}>
              <section className="customer-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
                <ServiceVisual service={selectedService} variant="modal" />
                <div className="customer-modal-content">
                  <div className="customer-modal-scroll">
                    <span className="customer-chip">{selectedService.category}</span>
                    <h2>{selectedService.name}</h2>
                    <p>{selectedService.description}</p>
                    <dl className="customer-service-facts compact">
                      <div>
                        <dt>Thời gian phục vụ</dt>
                        <dd>{selectedService.availableTime || 'Theo yêu cầu'}</dd>
                      </div>
                      <div>
                        <dt>Giá dự kiến</dt>
                        <dd>{selectedService.price > 0 ? formatCurrency(selectedService.price) : 'Liên hệ lễ tân'}</dd>
                      </div>
                      <div>
                        <dt>Xử lý yêu cầu</dt>
                        <dd>Nhân viên khách sạn sẽ tiếp nhận và xử lý yêu cầu của bạn.</dd>
                      </div>
                    </dl>

                    <form className="customer-request-form" id="customer-service-request-form" onSubmit={handleRequestSubmit}>
                      <label>
                        Số phòng
                        <select name="reservationId" onChange={handleRequestChange} value={requestForm.reservationId}>
                          <option value="">Chọn phòng</option>
                          {rooms.map((room) => (
                            <option key={room.reservationId || room.id} value={room.reservationId || room.id}>
                              {room.name || room.rawName} {room.bookingCode ? `- ${room.bookingCode}` : ''}
                            </option>
                          ))}
                        </select>
                        {rooms.length === 0 ? (
                          <small className="customer-field-hint">Bạn cần có booking đã thanh toán trước khi gửi yêu cầu dịch vụ.</small>
                        ) : null}
                      </label>
                      <label>
                        Ghi chú yêu cầu
                        <textarea
                          name="note"
                          onChange={handleRequestChange}
                          placeholder="Ví dụ: Vui lòng phục vụ lúc 19:00."
                          rows="3"
                          value={requestForm.note}
                        />
                      </label>
                    </form>
                  </div>

                  <div className="customer-modal-actions">
                    <button className="customer-button" disabled={isSubmitting || rooms.length === 0} form="customer-service-request-form" type="submit">
                      {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                    </button>
                    <button className="customer-button secondary" type="button" onClick={closeServiceModal}>
                      Đóng
                    </button>
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
};

export default CustomerServicesPage;





