import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  CreditCard,
  Pencil,
  Save,
  Search,
  UserRound,
  X
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

const renderStars = (rating) => '★'.repeat(Math.max(0, Math.min(5, Number(rating || 0))));

const createProfileForm = (profileUser) => ({
  address: profileUser?.address || '',
  avatar: profileUser?.avatar || '',
  email: profileUser?.email || '',
  full_name: profileUser?.full_name || '',
  phone_number: profileUser?.phone_number || ''
});

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
  const [pendingCancelBooking, setPendingCancelBooking] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(() => createProfileForm(user));
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      const response = await axiosClient.get('/profile/me');
      setUser(response.data.user);
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
    const bookings = profileData.bookingHistory;

    if (bookings.length === 0) {
      setSelectedBookingId('');
      return;
    }

    setSelectedBookingId((currentId) => {
      const hasCurrentBooking = bookings.some(
        (booking) => String(booking.id || booking.bookingCode) === String(currentId)
      );

      return hasCurrentBooking ? currentId : String(bookings[0].id || bookings[0].bookingCode);
    });
  }, [profileData.bookingHistory]);

  useEffect(() => {
    if (!isEditingProfile) {
      setProfileForm(createProfileForm(user));
    }
  }, [isEditingProfile, user]);

  const handleProfileFieldChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  };

  const handleProfileEditCancel = () => {
    setProfileForm(createProfileForm(user));
    setProfileError('');
    setIsEditingProfile(false);
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    setIsSavingProfile(true);
    setProfileError('');
    setProfileMessage('');

    try {
      const response = await axiosClient.patch('/profile/me', profileForm);
      setUser(response.data.user);
      localStorage.setItem('hotelify_user', JSON.stringify(response.data.user));
      window.dispatchEvent(new Event('hotelify-auth-change'));
      setProfileMessage(response.data.message || 'Profile updated successfully.');
      setIsEditingProfile(false);
    } catch (error) {
      setProfileError(error.response?.data?.message || 'Cannot update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

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
      setPendingCancelBooking(null);
    }
  };

  const profileRows = useMemo(
    () => [
      { label: 'Login Account', value: user?.login_account || 'Not updated' },
      { label: 'Phone Number', value: user?.phone_number || 'Not updated' },
      { label: 'Email Address', value: user?.email || 'Not updated' },
      { label: 'Address', value: user?.address || 'Not updated' },
      { label: 'Member Since', value: formatJoinDate(user?.createdAt) }
    ],
    [user]
  );

  const selectedBooking = useMemo(
    () =>
      profileData.bookingHistory.find(
        (booking) => String(booking.id || booking.bookingCode) === String(selectedBookingId)
      ) || null,
    [profileData.bookingHistory, selectedBookingId]
  );
  const currentStay = selectedBooking || profileData.currentStay;
  const stayGallery = currentStay?.gallery?.length ? currentStay.gallery : currentStay?.image ? [currentStay.image] : [];

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

        <div className="profile-upgrade-card">
          <img
            src="https://paddingtonbayviewhalong.com/vnt_upload/weblink/banner_01.jpg"
            alt="Hotel preview"
          />
          <h3>Manage Smarter, Serve Better</h3>
          <p>Automate check-ins, monitor occupancy, and track performance effortlessly.</p>
          <button type="button">Upgrade to Pro</button>
        </div>
      </aside>

      <div className="profile-main">
        <div className="profile-grid">
          <article className="profile-card profile-identity-card" id="guest-profile">
            <div className="profile-avatar-large">
              {user?.avatar ? <img src={user.avatar} alt={user.full_name} /> : <span>{getInitials(user?.full_name)}</span>}
            </div>
            <h1>{user?.full_name || 'Guest User'}</h1>
            <p>{user?.role?.name || 'Customer'} · {user?.status || 'active'}</p>

            {!isEditingProfile ? (
              <>
                <button
                  type="button"
                  className="profile-edit-button"
                  onClick={() => {
                    setProfileMessage('');
                    setProfileError('');
                    setIsEditingProfile(true);
                  }}
                >
                  <Pencil size={15} />
                  Update Profile
                </button>

                {profileMessage ? <p className="profile-update-message is-success">{profileMessage}</p> : null}

                <div className="profile-info-list">
                  {profileRows.map((row) => (
                    <div key={row.label}>
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <form className="profile-update-form" onSubmit={handleProfileUpdate}>
                <label>
                  <span>Full Name</span>
                  <input
                    name="full_name"
                    value={profileForm.full_name}
                    onChange={handleProfileFieldChange}
                    required
                  />
                </label>
                <label>
                  <span>Email Address</span>
                  <input
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileFieldChange}
                    required
                  />
                </label>
                <label>
                  <span>Phone Number</span>
                  <input
                    name="phone_number"
                    value={profileForm.phone_number}
                    onChange={handleProfileFieldChange}
                  />
                </label>
                <label>
                  <span>Address</span>
                  <input
                    name="address"
                    value={profileForm.address}
                    onChange={handleProfileFieldChange}
                  />
                </label>
                <label className="profile-update-form-wide">
                  <span>Avatar URL</span>
                  <input
                    name="avatar"
                    value={profileForm.avatar}
                    onChange={handleProfileFieldChange}
                    placeholder="https://..."
                  />
                </label>

                {profileError ? <p className="profile-update-message is-error">{profileError}</p> : null}

                <div className="profile-update-actions">
                  <button type="submit" disabled={isSavingProfile}>
                    <Save size={15} />
                    {isSavingProfile ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={handleProfileEditCancel} disabled={isSavingProfile}>
                    <X size={15} />
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </article>

          <article className="profile-card profile-stay-card">
            <header>
              <h2>Stay Info</h2>
              <button type="button">...</button>
            </header>
            {currentStay ? (
              <>
                <div className="profile-stay-gallery">
                  {stayGallery.slice(0, 5).map((image, index) => (
                    <img src={image} alt={index === 0 ? currentStay.roomType : ''} key={image} />
                  ))}
                </div>
                <h2>{currentStay.roomType}</h2>
                <div className="profile-stay-details">
                  <span><small>Check-In</small>{formatDate(currentStay.checkInDate)}</span>
                  <span><small>Check-Out</small>{formatDate(currentStay.checkOutDate)}</span>
                  <span><small>Current Booking Status</small><mark>{currentStay.displayStatus}</mark></span>
                  <span><small>Room Number</small>{currentStay.roomNumber || 'Not assigned'}</span>
                  <span><small>Number of Guests</small>{currentStay.guestCount} Guest(s)</span>
                  <span><small>Current Booking Code</small><mark>{currentStay.bookingCode}</mark></span>
                  <span><small>Duration</small>{formatDuration(currentStay.durationNights)}</span>
                  <span><small>Request</small>{currentStay.specialRequest || 'None'}</span>
                  <span><small>Payment Status</small>{currentStay.paymentStatus || 'Not updated'}</span>
                </div>
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
                profileData.bookingHistory.map((booking) => {
                  const bookingKey = String(booking.id || booking.bookingCode);
                  const isSelected = bookingKey === String(selectedBookingId);

                  return (
                  <div
                    className={`profile-booking-row ${isSelected ? 'is-selected' : ''}`}
                    key={bookingKey}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedBookingId(bookingKey)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedBookingId(bookingKey);
                      }
                    }}
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
                            setPendingCancelBooking(booking);
                          }}
                        >
                          {cancelingReservationId === String(booking.id) ? 'Đang hủy...' : 'Hủy'}
                        </button>
                      ) : null}
                    </span>
                  </div>
                  );
                })
              ) : (
                <div className="profile-table-empty">No booking history in database yet.</div>
              )}
            </div>
          </article>

          <article className="profile-card profile-reviews-card">
            <header>
              <h2>Reviews</h2>
              <button type="button">...</button>
            </header>
            {profileData.reviews.length > 0 ? (
              profileData.reviews.map((review) => (
                <div className="profile-review-item" key={review.id || `${review.title}-${review.submittedAt}`}>
                  <h3>{review.title}</h3>
                  <div>
                    <span>{renderStars(review.rating)}</span>
                    <small>{formatDate(review.submittedAt)}</small>
                  </div>
                  <p>{review.text}</p>
                </div>
              ))
            ) : (
              <div className="profile-empty-state">No reviews in database yet.</div>
            )}
          </article>
        </div>

        <footer className="profile-footer">
          <span>Copyright © 2026 Hotelify</span>
          <Link to="/">Privacy Policy</Link>
          <Link to="/">Term and conditions</Link>
          <Link to="/">Contact</Link>
        </footer>
      </div>

      {pendingCancelBooking ? (
        <div className="profile-cancel-modal-backdrop" role="presentation" onMouseDown={() => setPendingCancelBooking(null)}>
          <section
            className="profile-cancel-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-cancel-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <h2 id="profile-cancel-modal-title">Xác nhận hủy đặt phòng</h2>
              <button type="button" aria-label="Đóng" onClick={() => setPendingCancelBooking(null)}>
                <X size={18} />
              </button>
            </header>
            <p>
              Bạn chắc chắn muốn hủy booking <strong>{pendingCancelBooking.bookingCode}</strong>?
              Nếu còn trước giờ nhận phòng từ 48 giờ trở lên và booking đã thanh toán, hệ thống sẽ tự gửi yêu cầu hoàn tiền VNPAY.
              Nếu không đủ 48 giờ, bạn cần liên hệ trực tiếp <strong>0868729129</strong> để được hỗ trợ.
            </p>
            <div>
              <button type="button" onClick={() => setPendingCancelBooking(null)}>
                Giữ booking
              </button>
              <button
                type="button"
                className="is-danger"
                disabled={cancelingReservationId === String(pendingCancelBooking.id)}
                onClick={() => handleCancelBooking(pendingCancelBooking.id)}
              >
                {cancelingReservationId === String(pendingCancelBooking.id) ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
};

export default MyProfilePage;
