import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  CreditCard,
  Search,
  UserRound
} from 'lucide-react';

import axiosClient from '../api/axiosClient';

const sidebarItems = [
  { label: 'Guest Profile', icon: UserRound, targetId: 'guest-profile' },
  { label: 'Booking History', icon: CreditCard, targetId: 'booking-history' }
];

const getInitials = (name) =>
  String(name || 'Guest User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const formatJoinDate = (value) => {
  if (!value) {
    return 'Not updated';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric'
  }).format(new Date(value));
};

const formatDate = (value) => {
  if (!value) {
    return 'Not updated';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).format(new Date(value));
};

const formatTime = (value) => {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
};

const formatStayRange = (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate) {
    return 'Not updated';
  }

  return `${formatDate(checkInDate)} - ${formatDate(checkOutDate)}`;
};

const formatDuration = (nights) => {
  const value = Number(nights || 0);
  return `${value} ${value === 1 ? 'Night' : 'Nights'}`;
};

const MyProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('hotelify_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [profileData, setProfileData] = useState({
    currentStay: null,
    bookingHistory: [],
    reviews: [],
    rewards: [],
    membership: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [bookingActionMessage, setBookingActionMessage] = useState('');
  const [cancelingReservationId, setCancelingReservationId] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [hotelPolicies, setHotelPolicies] = useState([]);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [pendingCancelBooking, setPendingCancelBooking] = useState(null);
  const [acceptedCancelPolicy, setAcceptedCancelPolicy] = useState(false);
  const [profileForm, setProfileForm] = useState({
    address: '',
    avatar: '',
    full_name: '',
    phone_number: ''
  });

  const loadProfile = useCallback(async () => {
    try {
      const response = await axiosClient.get('/profile/me');
      setUser(response.data.user);
      setProfileForm({
        address: response.data.user?.address || '',
        avatar: response.data.user?.avatar || '',
        full_name: response.data.user?.full_name || '',
        phone_number: response.data.user?.phone_number || ''
      });
      setProfileData({
        currentStay: response.data.currentStay || null,
        bookingHistory: response.data.bookingHistory || [],
        reviews: response.data.reviews || [],
        rewards: response.data.rewards || [],
        membership: response.data.membership || null
      });
      localStorage.setItem('hotelify_user', JSON.stringify(response.data.user));
      window.dispatchEvent(new Event('hotelify-auth-change'));
    } catch {
      localStorage.removeItem('hotelify_token');
      localStorage.removeItem('hotelify_user');
      window.dispatchEvent(new Event('hotelify-auth-change'));
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('hotelify_token');

    if (!token) {
      navigate('/login');
      return;
    }

    loadProfile();
  }, [loadProfile, navigate]);

  useEffect(() => {
    const loadHotelPolicies = async () => {
      try {
        const response = await axiosClient.get('/payments/hotel-policies');
        setHotelPolicies(response.data?.policies || []);
      } catch {
        setHotelPolicies([]);
      }
    };

    loadHotelPolicies();
  }, []);

  const handleCancelBooking = async (reservationId) => {
    setBookingActionMessage('');
    setCancelingReservationId(String(reservationId));

    try {
      const response = await axiosClient.patch(`/reservations/${reservationId}/cancel`);
      setBookingActionMessage(response.data.message || 'Đã hủy đặt phòng.');
      await loadProfile();
    } catch (error) {
      setBookingActionMessage(error.response?.data?.message || 'Không thể hủy đặt phòng.');
    } finally {
      setCancelingReservationId('');
    }
  };

  const openCancelConfirmation = (booking) => {
    setPendingCancelBooking(booking);
    setAcceptedCancelPolicy(false);
    setBookingActionMessage('');
    setIsCancelModalOpen(true);
  };

  const closeCancelConfirmation = () => {
    if (cancelingReservationId) {
      return;
    }

    setIsCancelModalOpen(false);
    setPendingCancelBooking(null);
    setAcceptedCancelPolicy(false);
  };

  const handleConfirmCancelBooking = async () => {
    if (!pendingCancelBooking?.id || !acceptedCancelPolicy) {
      return;
    }

    await handleCancelBooking(pendingCancelBooking.id);
    setIsCancelModalOpen(false);
    setPendingCancelBooking(null);
    setAcceptedCancelPolicy(false);
  };

  const handleProfileFieldChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleProfileEdit = () => {
    setProfileForm({
      address: user?.address || '',
      avatar: user?.avatar || '',
      full_name: user?.full_name || '',
      phone_number: user?.phone_number || ''
    });
    setProfileMessage('');
    setIsEditingProfile(true);
  };

  const handleProfileCancel = () => {
    setProfileForm({
      address: user?.address || '',
      avatar: user?.avatar || '',
      full_name: user?.full_name || '',
      phone_number: user?.phone_number || ''
    });
    setProfileMessage('');
    setIsEditingProfile(false);
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage('');

    try {
      const response = await axiosClient.patch('/profile/me', profileForm);
      setUser(response.data.user);
      localStorage.setItem('hotelify_user', JSON.stringify(response.data.user));
      window.dispatchEvent(new Event('hotelify-auth-change'));
      setProfileMessage(response.data.message || 'Profile updated successfully.');
      setIsEditingProfile(false);
    } catch (error) {
      setProfileMessage(error.response?.data?.message || 'Cannot update profile right now.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const profileRows = useMemo(
    () => [
      { editable: false, label: 'Login Account', value: user?.login_account || 'Not updated' },
      { editable: true, label: 'Phone Number', name: 'phone_number', value: user?.phone_number || 'Not updated' },
      { editable: false, label: 'Email Address', value: user?.email || 'Not updated' },
      { editable: true, label: 'Address', name: 'address', value: user?.address || 'Not updated' },
      { editable: false, label: 'Member Since', value: formatJoinDate(user?.createdAt) }
    ],
    [user]
  );

  const currentStay = profileData.currentStay;
  const selectedBooking = profileData.bookingHistory.find(
    (booking) => String(booking.id || booking.bookingCode) === selectedBookingId
  );
  const selectedStay = selectedBooking || currentStay;
  const stayGallery = selectedBooking
    ? [selectedBooking.image].filter(Boolean)
    : selectedStay?.gallery || [];
  const selectedStayStatus = String(selectedStay?.bookingStatus || selectedStay?.displayStatus || '').toLowerCase();
  const selectedPaymentStatus = String(selectedStay?.paymentStatus || '').toLowerCase();
  const canContinuePayment =
    Boolean(selectedStay?.id) &&
    !selectedStayStatus.includes('cancel') &&
    !selectedStayStatus.includes('completed') &&
    !selectedStayStatus.includes('checkedout') &&
    selectedPaymentStatus !== 'paid';
  const cancellationPolicies = hotelPolicies.filter((policy) => {
    const searchable = `${policy.category || ''} ${policy.title || ''} ${policy.content || ''}`.toLowerCase();
    return (
      searchable.includes('cancel') ||
      searchable.includes('refund') ||
      searchable.includes('hủy') ||
      searchable.includes('huy') ||
      searchable.includes('hoàn') ||
      searchable.includes('hoan')
    );
  });
  const visibleCancellationPolicies = cancellationPolicies.length > 0 ? cancellationPolicies : hotelPolicies;

  if (isLoading) {
    return (
      <section className="profile-loading">
        <span>Loading profile...</span>
      </section>
    );
  }

  return (
    <section className="profile-page" aria-label="My profile">
      <aside className="profile-sidebar">
        <nav className="profile-sidebar-nav" aria-label="Profile navigation">
          {sidebarItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                className={item.targetId === 'guest-profile' ? 'is-active' : ''}
                type="button"
                key={item.label}
                onClick={() => document.getElementById(item.targetId)?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="profile-main">
        <div className="profile-grid">
          <article className="profile-card profile-identity-card" id="guest-profile">
            <div className="profile-avatar-large">
              {(isEditingProfile ? profileForm.avatar : user?.avatar) ? (
                <img src={isEditingProfile ? profileForm.avatar : user.avatar} alt={isEditingProfile ? profileForm.full_name : user.full_name} />
              ) : (
                <span>{getInitials(isEditingProfile ? profileForm.full_name : user?.full_name)}</span>
              )}
            </div>
            {isEditingProfile ? (
              <input
                className="profile-name-input"
                name="full_name"
                onChange={handleProfileFieldChange}
                value={profileForm.full_name}
              />
            ) : (
              <h1>{user?.full_name || 'Guest User'}</h1>
            )}
            <p>{user?.role?.name || 'Customer'} · {user?.status || 'active'}</p>

            <form className="profile-info-list" onSubmit={handleProfileSave}>
              {profileRows.map((row) => (
                <div key={row.label}>
                  <span>{row.label}</span>
                  {isEditingProfile && row.editable ? (
                    <input
                      name={row.name}
                      onChange={handleProfileFieldChange}
                      value={profileForm[row.name]}
                    />
                  ) : (
                    <strong>{row.value}</strong>
                  )}
                </div>
              ))}
              {isEditingProfile ? (
                <div>
                  <span>Avatar URL</span>
                  <input
                    name="avatar"
                    onChange={handleProfileFieldChange}
                    value={profileForm.avatar}
                  />
                </div>
              ) : null}
              {profileMessage ? <p className="profile-edit-message">{profileMessage}</p> : null}
              <div className="profile-edit-actions">
                {isEditingProfile ? (
                  <>
                    <button disabled={isSavingProfile} type="submit">
                      {isSavingProfile ? 'Saving...' : 'Save'}
                    </button>
                    <button disabled={isSavingProfile} onClick={handleProfileCancel} type="button">
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={handleProfileEdit} type="button">
                    Edit Profile
                  </button>
                )}
              </div>
            </form>
          </article>

          <article className="profile-card profile-stay-card">
            <header>
              <h2>Stay Info</h2>
              <button type="button">...</button>
            </header>
            {selectedStay ? (
              <>
                <div className="profile-stay-gallery">
                  {stayGallery.slice(0, 5).map((image, index) => (
                    <img src={image} alt={index === 0 ? selectedStay.roomType : ''} key={image} />
                  ))}
                </div>
                <h2>{selectedStay.roomType}</h2>
                <div className="profile-stay-details">
                  <span><small>Check-In</small>{formatDate(selectedStay.checkInDate)}</span>
                  <span><small>Check-Out</small>{formatDate(selectedStay.checkOutDate)}</span>
                  <span><small>Booking Status</small><mark>{selectedStay.displayStatus}</mark></span>
                  <span><small>Room Number</small>{selectedStay.roomNumber || 'Not assigned'}</span>
                  <span><small>Number of Guests</small>{selectedStay.guestCount || selectedStay.guestTotal || 'N/A'} Guest(s)</span>
                  <span><small>Booking Code</small><mark>{selectedStay.bookingCode}</mark></span>
                  <span><small>Duration</small>{formatDuration(selectedStay.durationNights)}</span>
                  <span><small>Booking Date</small>{formatDate(selectedStay.bookingDate)}</span>
                  <span><small>Payment Status</small>{selectedStay.paymentStatus || 'Not updated'}</span>
                  <span><small>Request</small>{selectedStay.specialRequest || 'None'}</span>
                </div>
                {(selectedStay.canCancel || canContinuePayment) ? (
                  <div className="profile-stay-actions">
                    {canContinuePayment ? (
                      <button type="button" onClick={() => navigate(`/payment/${selectedStay.id}`)}>
                        Continue Payment
                      </button>
                    ) : null}
                    {selectedStay.canCancel ? (
                      <button
                        className="is-danger"
                        disabled={cancelingReservationId === String(selectedStay.id)}
                        onClick={() => openCancelConfirmation(selectedStay)}
                        type="button"
                      >
                        {cancelingReservationId === String(selectedStay.id) ? 'Canceling...' : 'Cancel Booking'}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="profile-empty-state">No stay information in database yet.</div>
            )}
          </article>

          <article className="profile-card profile-booking-card" id="booking-history">
            <header>
              <h2>Booking History</h2>
              <label>
                <Search size={16} />
                <input type="search" placeholder="Search guest, status, etc" />
              </label>
              <button type="button">All Status <ChevronDown size={14} /></button>
            </header>

            <div className="profile-booking-table">
              {bookingActionMessage ? <div className="profile-booking-message">{bookingActionMessage}</div> : null}
              <div className="profile-booking-head">
                <span>Image</span>
                <span>Booking ID</span>
                <span>Booking Date</span>
                <span>Room Type</span>
                <span>Room</span>
                <span>Check-In/Out</span>
                <span>Duration</span>
                <span>Status</span>
              </div>
              {profileData.bookingHistory.length > 0 ? (
                profileData.bookingHistory.map((booking) => (
                  <div
                    className={`profile-booking-row${selectedBookingId === String(booking.id || booking.bookingCode) ? ' is-selected' : ''}`}
                    key={booking.id || booking.bookingCode}
                    onClick={() => setSelectedBookingId(String(booking.id || booking.bookingCode))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedBookingId(String(booking.id || booking.bookingCode));
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    {booking.image ? (
                      <img src={booking.image} alt={booking.roomType} />
                    ) : (
                      <div className="profile-image-placeholder" aria-hidden="true" />
                    )}
                    <strong>{booking.bookingCode}</strong>
                    <span>{formatDate(booking.bookingDate)}<small>{formatTime(booking.bookingDate)}</small></span>
                    <span>{booking.roomType}</span>
                    <span>{booking.roomNumber || 'N/A'}</span>
                    <span>{formatStayRange(booking.checkInDate, booking.checkOutDate)}</span>
                    <span>{formatDuration(booking.durationNights)}</span>
                    <span className="profile-booking-status-cell">
                      <mark className={booking.displayStatus === 'Canceled' ? 'is-canceled' : ''}>{booking.displayStatus}</mark>
                      {booking.canCancel ? (
                        <button
                          type="button"
                          className="profile-cancel-booking"
                          disabled={cancelingReservationId === String(booking.id)}
                          onClick={(event) => {
                            event.stopPropagation();
                            openCancelConfirmation(booking);
                          }}
                        >
                          {cancelingReservationId === String(booking.id) ? 'Đang hủy...' : 'Hủy'}
                        </button>
                      ) : null}
                    </span>
                  </div>
                ))
              ) : (
                <div className="profile-table-empty">No booking history in database yet.</div>
              )}
            </div>
          </article>

        </div>
      </div>
      {isCancelModalOpen ? (
        <div className="hotel-policy-modal-backdrop" role="presentation" onMouseDown={closeCancelConfirmation}>
          <section
            className="hotel-policy-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-policy-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>Điều khoản hoàn hủy</span>
                <h2 id="cancel-policy-modal-title">Xác nhận hủy booking</h2>
              </div>
              <button type="button" aria-label="Đóng xác nhận hủy" onClick={closeCancelConfirmation}>
                X
              </button>
            </header>

            <div className="hotel-policy-modal-content">
              {pendingCancelBooking ? (
                <div className="cancel-booking-summary">
                  <strong>{pendingCancelBooking.bookingCode}</strong>
                  <span>{pendingCancelBooking.roomType}</span>
                  <span>{formatStayRange(pendingCancelBooking.checkInDate, pendingCancelBooking.checkOutDate)}</span>
                </div>
              ) : null}

              {visibleCancellationPolicies.length > 0 ? (
                visibleCancellationPolicies.map((policy) => (
                  <article key={policy.id || policy.title} className="hotel-policy-item">
                    <span>{policy.category || 'Policy'}</span>
                    <h3>{policy.title}</h3>
                    <p>{policy.content}</p>
                  </article>
                ))
              ) : (
                <p className="hotel-policy-empty">
                  Chưa có điều khoản hoàn hủy được cấu hình. Vui lòng liên hệ khách sạn trước khi xác nhận hủy.
                </p>
              )}

              <label className="cancel-policy-confirm">
                <input
                  checked={acceptedCancelPolicy}
                  onChange={(event) => setAcceptedCancelPolicy(event.target.checked)}
                  type="checkbox"
                />
                <span>Tôi đã đọc, hiểu và đồng ý với điều khoản hoàn hủy của booking này.</span>
              </label>
            </div>

            <footer>
              <button type="button" onClick={closeCancelConfirmation}>
                Đóng
              </button>
              <button
                className="hotel-policy-accept is-danger"
                disabled={!acceptedCancelPolicy || cancelingReservationId === String(pendingCancelBooking?.id)}
                onClick={handleConfirmCancelBooking}
                type="button"
              >
                {cancelingReservationId === String(pendingCancelBooking?.id) ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
};

export default MyProfilePage;
