import { useState, useCallback } from 'react';
import Navbar from '@/components/home/Navbar';
import HeroSection from '@/components/home/HeroSection';
import FeaturedRooms from '@/components/home/FeaturedRooms';
import CustomerFeedback from '@/components/home/CustomerFeedback';
import Footer from '@/components/home/Footer';
import BookingModal from '@/components/home/BookingModal';
import NotificationToast from '@/components/home/NotificationToast';

const HomePage = () => {
  // Search & filter state
  const [searchLocation, setSearchLocation] = useState('all');
  const [searchType, setSearchType] = useState('all');
  const [searchDate, setSearchDate] = useState('2026-06-25');
  const [activeFilter, setActiveFilter] = useState('all');

  // Modal state
  const [bookingModal, setBookingModal] = useState({ isOpen: false, room: null });

  // Toast notification state
  const [toast, setToast] = useState({ show: false, type: 'success', title: '', message: '' });

  const showToast = useCallback((title, message, type = 'success') => {
    setToast({ show: true, type, title, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 6000);
  }, []);

  const handleSearch = useCallback(() => {
    showToast('Search Complete', 'Results have been updated to match your search criteria.');
  }, [showToast]);

  const handleResetFilters = useCallback(() => {
    setSearchLocation('all');
    setSearchType('all');
    setActiveFilter('all');
    showToast('Filters Reset', 'All search filters have been restored to their defaults.');
  }, [showToast]);

  const handleShowPromo = useCallback(() => {
    showToast(
      'Promo Code Activated!',
      'Enter COZY20 at checkout to get 20% off your stay.'
    );
  }, [showToast]);

  const handleBookRoom = useCallback((room) => {
    setBookingModal({ isOpen: true, room });
  }, []);

  const handleConfirmBooking = useCallback(
    ({ name, phone, promo, roomName }) => {
      setBookingModal({ isOpen: false, room: null });

      setTimeout(() => {
        let message = `Thank you ${name} (${phone}), your booking request for "${roomName}" has been received. A representative will call you within 5 minutes to confirm.`;
        if (promo === 'COZY20') {
          message = `Promo code COZY20 applied successfully! Thank you ${name}, your booking request for "${roomName}" with 20% discount has been submitted.`;
        }
        showToast('Booking Confirmed!', message);
      }, 350);
    },
    [showToast]
  );

  const handleSubscribe = useCallback(
    (email) => {
      showToast('Subscription Successful!', `Exclusive Hotelify offers will be sent to: ${email}`);
    },
    [showToast]
  );

  return (
    <div className="min-h-screen flex flex-col antialiased">
      <Navbar onShowPromo={handleShowPromo} />

      <HeroSection
        searchLocation={searchLocation}
        setSearchLocation={setSearchLocation}
        searchType={searchType}
        setSearchType={setSearchType}
        searchDate={searchDate}
        setSearchDate={setSearchDate}
        onSearch={handleSearch}
      />

      <FeaturedRooms
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchLocation={searchLocation}
        searchType={searchType}
        onBook={handleBookRoom}
        onResetFilters={handleResetFilters}
      />

      <CustomerFeedback />

      <Footer onSubscribe={handleSubscribe} />

      <BookingModal
        isOpen={bookingModal.isOpen}
        room={bookingModal.room}
        onClose={() => setBookingModal({ isOpen: false, room: null })}
        onConfirm={handleConfirmBooking}
      />

      <NotificationToast
        show={toast.show}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default HomePage;
