import { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Trash2 } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';

const StayGuestForm = ({ bookingRoom, booking, roomIndex, initialGuest, onComplete }) => {
  const customer = booking.customer;
  const hasCustomer = !!customer;

  // Defaults isBookingCustomer to true for first room if customer exists
  const [isBookingCustomer, setIsBookingCustomer] = useState(() => {
    if (initialGuest) {
      return hasCustomer && 
             initialGuest.fullName.toLowerCase() === customer.fullName.toLowerCase() && 
             (initialGuest.phoneNumber || '') === (customer.phoneNumber || '');
    }
    return roomIndex === 0 && hasCustomer;
  });
  const [matchesPhysical, setMatchesPhysical] = useState(!!initialGuest);

  const [formData, setFormData] = useState({
    fullName: initialGuest ? initialGuest.fullName : (roomIndex === 0 && customer ? customer.fullName : ''),
    phoneNumber: initialGuest ? initialGuest.phoneNumber : (roomIndex === 0 && customer ? customer.phoneNumber || '' : ''),
    email: initialGuest ? initialGuest.email : (roomIndex === 0 && customer ? customer.email || '' : ''),
    idCardNumber: initialGuest ? initialGuest.idCardNumber : (roomIndex === 0 && customer ? customer.idCardNumber || '' : ''),
    passportNumber: initialGuest ? initialGuest.passportNumber : '',
    documentType: initialGuest ? initialGuest.documentType : 'ID_CARD',
  });

  // Extract images from idCardImage string (which is comma-separated "front,back")
  const getInitialImages = () => {
    if (!initialGuest?.idCardImage) return { front: '', back: '' };
    const parts = initialGuest.idCardImage.split(',');
    return {
      front: parts[0] || '',
      back: parts[1] || ''
    };
  };

  const initialImages = getInitialImages();
  const [frontImage, setFrontImage] = useState(initialImages.front);
  const [backImage, setBackImage] = useState(initialImages.back);
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  // Sync state with parent component
  useEffect(() => {
    const activeName = isBookingCustomer && customer ? customer.fullName : formData.fullName;
    const activePhone = isBookingCustomer && customer ? customer.phoneNumber : formData.phoneNumber;
    const activeEmail = isBookingCustomer && customer ? customer.email : formData.email;

    const isNameValid = activeName && activeName.trim().length > 0;
    
    let isIdValid = false;
    if (formData.documentType === 'ID_CARD') {
      isIdValid = /^\d{12}$/.test(formData.idCardNumber.trim());
    } else {
      isIdValid = formData.passportNumber.trim().length > 0;
    }

    if (isNameValid && isIdValid && matchesPhysical) {
      // Concatenate front and back images as comma separated string
      const idCardImageCombined = [frontImage, backImage].filter(Boolean).join(',');

      onComplete({
        fullName: activeName.trim(),
        phoneNumber: activePhone ? activePhone.trim() : '',
        email: activeEmail ? activeEmail.trim() : '',
        idCardNumber: formData.documentType === 'ID_CARD' ? formData.idCardNumber.trim() : '',
        passportNumber: formData.documentType === 'PASSPORT' ? formData.passportNumber.trim() : '',
        idCardImage: idCardImageCombined,
        documentType: formData.documentType
      });
    } else {
      onComplete(null); // not completed/valid
    }
  }, [isBookingCustomer, matchesPhysical, formData, frontImage, backImage]);

  const handleInputChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleCccdChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // numbers only
    if (value.length <= 12) {
      handleInputChange('idCardNumber', value);
    }
  };

  const handleFileUpload = async (e, side) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
      setUploadError('Chỉ được tải lên file ảnh (jpg, png, webp,...)');
      return;
    }
    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Kích thước ảnh tối đa là 5MB');
      return;
    }

    setUploadError('');
    if (side === 'front') setIsUploadingFront(true);
    else setIsUploadingBack(true);

    try {
      const uploadData = new FormData();
      uploadData.append('image', file);

      const response = await axiosClient.post('/upload/rooms', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.success) {
        const imageUrl = response.data.data.url;
        if (side === 'front') setFrontImage(imageUrl);
        else setBackImage(imageUrl);
      } else {
        setUploadError(response.data?.message || 'Không thể upload ảnh');
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || err.message || 'Lỗi khi tải ảnh lên server');
    } finally {
      if (side === 'front') setIsUploadingFront(false);
      else setIsUploadingBack(false);
    }
  };

  const triggerUpload = (side) => {
    if (side === 'front') frontInputRef.current?.click();
    else backInputRef.current?.click();
  };

  const removeImage = (e, side) => {
    e.stopPropagation(); // prevent file input click trigger
    if (side === 'front') setFrontImage('');
    else setBackImage('');
  };

  // Helper to construct image URL dynamically
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return '';
    const base = axiosClient.defaults.baseURL || '';
    const origin = base.replace(/\/api$/, '').replace(/\/$/, '');
    return `${origin}${imagePath}`;
  };

  return (
    <div className="stay-guest-form" style={{ marginTop: '8px' }}>
      {isBookingCustomer && customer ? (
        <div className="guest-account-info">
          <div className="guest-account-info-title">Thông tin từ tài khoản đặt phòng</div>
          <div className="guest-details-grid">
            <div className="guest-detail-item">
              <div className="guest-detail-label">Họ tên:</div>
              <div className="guest-detail-value">{customer.fullName}</div>
            </div>
            <div className="guest-detail-item">
              <div className="guest-detail-label">SĐT:</div>
              <div className="guest-detail-value">{customer.phoneNumber || 'N/A'}</div>
            </div>
            <div className="guest-detail-item">
              <div className="guest-detail-label">Email:</div>
              <div className="guest-detail-value">{customer.email || 'N/A'}</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
          <div style={{ fontWeight: '700', color: 'var(--muted)', fontSize: '13px', textTransform: 'uppercase', marginBottom: '12px' }}>
            Thông tin khách lưu trú mới
          </div>
          <div className="form-group-row">
            <div className="form-field">
              <label htmlFor={`fullName-${bookingRoom.id}`}>Họ tên khách (*):</label>
              <input
                id={`fullName-${bookingRoom.id}`}
                type="text"
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor={`phoneNumber-${bookingRoom.id}`}>Số điện thoại:</label>
              <input
                id={`phoneNumber-${bookingRoom.id}`}
                type="text"
                placeholder="0901234567"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              />
            </div>
          </div>
          <div className="form-group-row" style={{ marginTop: '12px' }}>
            <div className="form-field" style={{ gridColumn: 'span 2' }}>
              <label htmlFor={`email-${bookingRoom.id}`}>Email:</label>
              <input
                id={`email-${bookingRoom.id}`}
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Hidden Inputs for File Upload */}
      <input
        type="file"
        ref={frontInputRef}
        onChange={(e) => handleFileUpload(e, 'front')}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={backInputRef}
        onChange={(e) => handleFileUpload(e, 'back')}
        accept="image/*"
        style={{ display: 'none' }}
      />

      <hr className="form-divider" />

      {/* Upload ID Section */}
      <div className="upload-section-title">Ảnh giấy tờ tùy thân</div>
      {uploadError && (
        <div className="validation-error-text" style={{ marginBottom: '10px' }}>
          {uploadError}
        </div>
      )}
      <div className="upload-cards-grid">
        {/* Front Side Upload */}
        <div className="upload-card" onClick={() => triggerUpload('front')}>
          {isUploadingFront ? (
            <div className="upload-loading">
              <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="4" strokeDasharray="30 30" fill="none"/>
              </svg>
              <span>Đang tải lên...</span>
            </div>
          ) : frontImage ? (
            <>
              <img src={getFullImageUrl(frontImage)} alt="Mặt trước" className="upload-preview" />
              <div className="upload-overlay">
                <Camera size={16} />
                <span>Thay thế</span>
                <button 
                  type="button" 
                  style={{ background: 'none', border: 'none', color: 'white', padding: '4px', cursor: 'pointer' }} 
                  onClick={(e) => removeImage(e, 'front')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="upload-card-content">
              <Upload size={20} />
              <span>Chụp/Upload mặt trước</span>
            </div>
          )}
        </div>

        {/* Back Side Upload */}
        <div className="upload-card" onClick={() => triggerUpload('back')}>
          {isUploadingBack ? (
            <div className="upload-loading">
              <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="4" strokeDasharray="30 30" fill="none"/>
              </svg>
              <span>Đang tải lên...</span>
            </div>
          ) : backImage ? (
            <>
              <img src={getFullImageUrl(backImage)} alt="Mặt sau" className="upload-preview" />
              <div className="upload-overlay">
                <Camera size={16} />
                <span>Thay thế</span>
                <button 
                  type="button" 
                  style={{ background: 'none', border: 'none', color: 'white', padding: '4px', cursor: 'pointer' }} 
                  onClick={(e) => removeImage(e, 'back')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="upload-card-content">
              <Upload size={20} />
              <span>Chụp/Upload mặt sau</span>
            </div>
          )}
        </div>
      </div>

      {/* Document inputs */}
      <div className="form-group-row" style={{ marginTop: '16px' }}>
        <div className="form-field">
          <label htmlFor={`docType-${bookingRoom.id}`}>Loại giấy tờ:</label>
          <select
            id={`docType-${bookingRoom.id}`}
            value={formData.documentType}
            onChange={(e) => handleInputChange('documentType', e.target.value)}
          >
            <option value="ID_CARD">Căn cước công dân (CCCD)</option>
            <option value="PASSPORT">Hộ chiếu (Passport)</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor={`docNumber-${bookingRoom.id}`}>
            {formData.documentType === 'ID_CARD' ? 'Số CCCD (*):' : 'Số Hộ chiếu (*):'}
          </label>
          {formData.documentType === 'ID_CARD' ? (
            <>
              <input
                id={`docNumber-${bookingRoom.id}`}
                type="text"
                placeholder="Nhập đủ 12 số"
                value={formData.idCardNumber}
                onChange={handleCccdChange}
              />
              {formData.idCardNumber.length > 0 && formData.idCardNumber.length < 12 && (
                <div className="validation-error-text" style={{ fontSize: '11px', fontStyle: 'italic' }}>
                  Số CCCD phải bao gồm đúng 12 chữ số
                </div>
              )}
            </>
          ) : (
            <input
              id={`docNumber-${bookingRoom.id}`}
              type="text"
              placeholder="Nhập số hộ chiếu"
              value={formData.passportNumber}
              onChange={(e) => handleInputChange('passportNumber', e.target.value)}
            />
          )}
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: '#334155' }}>
          <input
            type="checkbox"
            checked={matchesPhysical}
            onChange={(e) => setMatchesPhysical(e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          Khớp với giấy tờ vật lý thực tế trình diện
        </label>
      </div>

      {/* Switch / Add Guest Option */}
      {hasCustomer && roomIndex === 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '12px' }}>
          {isBookingCustomer ? (
            <button
              type="button"
              className="toggle-customer-btn"
              onClick={() => {
                setIsBookingCustomer(false);
                // Clear customer info to prompt manual input
                setFormData(prev => ({
                  ...prev,
                  fullName: '',
                  phoneNumber: '',
                  email: '',
                  idCardNumber: '',
                }));
              }}
            >
              + Nhập thông tin khách khác (nếu người ở không phải người đặt)
            </button>
          ) : (
            <button
              type="button"
              className="toggle-customer-btn"
              onClick={() => {
                setIsBookingCustomer(true);
                // Reset form values to customer values
                setFormData(prev => ({
                  ...prev,
                  fullName: customer.fullName,
                  phoneNumber: customer.phoneNumber || '',
                  email: customer.email || '',
                  idCardNumber: customer.idCardNumber || '',
                }));
              }}
            >
              Dùng thông tin từ tài khoản đặt phòng
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StayGuestForm;
