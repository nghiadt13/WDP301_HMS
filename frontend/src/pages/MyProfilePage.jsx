import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronDown,
  CreditCard,
  Gift,
  Search,
  ShieldCheck,
  UserRound
} from 'lucide-react';

import axiosClient from '../api/axiosClient';

const sidebarItems = [
  { label: 'Guest Profile', icon: UserRound, targetId: 'guest-profile' },
  { label: 'Booking History', icon: CreditCard, targetId: 'booking-history' }
];

const rewardIcons = {
  calendar: CalendarDays,
  gift: Gift,
  shield: ShieldCheck
};

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

const formatPoints = (points) => new Intl.NumberFormat('en-US').format(Number(points || 0));

const renderStars = (rating) => '★'.repeat(Math.max(0, Math.min(5, Number(rating || 0))));

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

  const membership = profileData.membership || {};
  const currentStay = profileData.currentStay;
  const stayGallery = currentStay?.gallery || [];

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

            <div className="profile-info-list">
              {profileRows.map((row) => (
                <div key={row.label}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="profile-member-card">
            <div>
              <h2>{membership.tier || 'Standard Member'}</h2>
              <span>{formatPoints(membership.points)} pts</span>
            </div>
            <ShieldCheck size={78} strokeWidth={1.5} />
            <div className="profile-progress">
              <span style={{ width: `${Math.min(100, Math.max(0, membership.progressPercent || 0))}%` }} />
            </div>
            <footer>
              <p>
                {membership.note ||
                  `Earn ${formatPoints(membership.pointsToNextTier)} points to reach ${membership.nextTier || 'the next tier'}`}
              </p>
              <button type="button">Learn How</button>
            </footer>
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

          <article className="profile-card profile-rewards-card">
            <header>
              <h2>Rewards</h2>
              <button type="button">...</button>
            </header>
            <div className="profile-rewards-list">
              {profileData.rewards.length > 0 ? (
                profileData.rewards.map((reward) => {
                  const Icon = rewardIcons[reward.icon] || Gift;

                  return (
                    <div key={reward.id || reward.title}>
                      <span><Icon size={20} /></span>
                      <strong>{reward.title}</strong>
                    </div>
                  );
                })
              ) : (
                <div className="profile-empty-state">No rewards in database yet.</div>
              )}
            </div>
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
                  <div className="profile-booking-row" key={booking.id || booking.bookingCode}>
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
                          onClick={() => handleCancelBooking(booking.id)}
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
    </section>
  );
};

export default MyProfilePage;
