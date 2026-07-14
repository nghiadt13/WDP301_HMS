import { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, Check } from 'lucide-react';

const StayGuestForm = ({ bookingRoom, booking, roomIndex, onComplete }) => {
  const customer = booking.customer;
  const hasExistingId = customer && customer.idCardNumber;

  // Decide branch: Branch A (read-only existing ID) if it exists and is the first room, otherwise Branch B (manual entry)
  const [branch, setBranch] = useState(hasExistingId && roomIndex === 0 ? 'A' : 'B');
  const [matchesPhysical, setMatchesPhysical] = useState(false);

  // Form states for Branch B
  const [formData, setFormData] = useState({
    fullName: roomIndex === 0 && customer ? customer.fullName : '',
    phoneNumber: roomIndex === 0 && customer ? customer.phoneNumber || '' : '',
    idCardNumber: '',
    passportNumber: '',
    documentType: 'ID_CARD' // ID_CARD or PASSPORT
  });

  // Call onComplete when form values change and are validated
  useEffect(() => {
    if (branch === 'A') {
      if (matchesPhysical && customer) {
        onComplete({
          fullName: customer.fullName,
          phoneNumber: customer.phoneNumber || '',
          idCardNumber: customer.idCardNumber,
          passportNumber: '',
          documentType: 'ID_CARD'
        });
      } else {
        onComplete(null); // not completed
      }
    } else {
      // Validate Branch B
      const { fullName, idCardNumber, passportNumber, phoneNumber, documentType } = formData;
      const isNameValid = fullName.trim().length > 0;
      const isIdValid = documentType === 'ID_CARD' ? idCardNumber.trim().length > 0 : passportNumber.trim().length > 0;

      if (isNameValid && isIdValid) {
        onComplete({
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          idCardNumber: documentType === 'ID_CARD' ? idCardNumber.trim() : '',
          passportNumber: documentType === 'PASSPORT' ? passportNumber.trim() : '',
          documentType
        });
      } else {
        onComplete(null); // not completed
      }
    }
  }, [branch, matchesPhysical, formData]);

  const handleInputChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      [field]: val
    }));
  };

  return (
    <div className="stay-guest-form" style={{ marginTop: '8px' }}>
      {branch === 'A' && hasExistingId ? (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: '700', color: '#166534' }}>Branch A: Sử dụng thông tin của khách hàng đăng ký</span>
            <button
              type="button"
              className="pagination-btn"
              style={{ fontSize: '11px', padding: '4px 8px' }}
              onClick={() => setBranch('B')}
            >
              Nhập thủ công (Branch B)
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '13px', marginBottom: '14px' }}>
            <div>Họ tên: <strong>{customer.fullName}</strong></div>
            <div>CCCD/Hộ chiếu: <strong>{customer.idCardNumber}</strong></div>
            <div>SĐT: <strong>{customer.phoneNumber || 'N/A'}</strong></div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={matchesPhysical}
              onChange={(e) => setMatchesPhysical(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            Khớp với giấy tờ vật lý thực tế trình diện
          </label>
        </div>
      ) : (
        <div style={{ background: '#f8fafc', border: '1px solid var(--line)', padding: '16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: '700', color: 'var(--muted)' }}>Branch B: Ghi nhận thông tin khách lưu trú mới</span>
            {hasExistingId && (
              <button
                type="button"
                className="pagination-btn"
                style={{ fontSize: '11px', padding: '4px 8px' }}
                onClick={() => setBranch('A')}
              >
                Dùng thông tin liên hệ (Branch A)
              </button>
            )}
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

          <div className="form-group-row">
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
                <input
                  id={`docNumber-${bookingRoom.id}`}
                  type="text"
                  placeholder="079123456789"
                  value={formData.idCardNumber}
                  onChange={(e) => handleInputChange('idCardNumber', e.target.value)}
                />
              ) : (
                <input
                  id={`docNumber-${bookingRoom.id}`}
                  type="text"
                  placeholder="B1234567"
                  value={formData.passportNumber}
                  onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StayGuestForm;
