import { useState } from 'react';
import { X, Sparkles, Info } from 'lucide-react';

const BookingModal = ({ isOpen, onClose, room, onConfirm }) => {
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestPromo, setGuestPromo] = useState('');

  if (!isOpen || !room) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      name: guestName,
      phone: guestPhone,
      promo: guestPromo.trim().toUpperCase(),
      roomName: room.name,
      roomPrice: room.price,
      roomType: room.type,
    });
    setGuestName('');
    setGuestPhone('');
    setGuestPromo('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-sm">
      <div className="bg-brand-card w-full max-w-md rounded-xl border border-brand-border shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <div>
            <span className="text-[10px] text-brand-primary bg-brand-hoverTint px-2 py-0.5 rounded-md font-medium uppercase tracking-wide">
              {room.type}
            </span>
            <h3 className="text-base font-medium text-brand-textHead mt-1">{room.name}</h3>
          </div>
          <button onClick={onClose} className="text-brand-textBody hover:text-brand-textHead">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* User Information */}
          <div className="space-y-1">
            <label className="text-[10px] text-brand-textBody font-medium uppercase tracking-wider block">
              Guest Full Name
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              required
              placeholder="e.g. John Smith"
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-textHead focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-brand-textBody font-medium uppercase tracking-wider block">
                Phone Number
              </label>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                required
                placeholder="0901234567"
                className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-textHead focus:outline-none focus:border-brand-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-brand-textBody font-medium uppercase tracking-wider block">
                Promo Code (optional)
              </label>
              <input
                type="text"
                value={guestPromo}
                onChange={(e) => setGuestPromo(e.target.value)}
                placeholder="COZY20"
                className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-textHead focus:outline-none focus:border-brand-primary uppercase font-medium"
              />
            </div>
          </div>

          {/* Custom selection details */}
          <div className="grid grid-cols-2 gap-4 bg-brand-bg p-3.5 rounded-lg border border-brand-border">
            <div>
              <span className="text-[10px] text-brand-textBody block">Price / night</span>
              <span className="text-sm font-medium text-brand-textHead">{room.price}</span>
            </div>
            <div>
              <span className="text-[10px] text-brand-textBody block flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-primary" /> Included
              </span>
              <span className="text-xs text-brand-successText font-medium bg-brand-successBg px-1.5 py-0.5 rounded">
                Free Breakfast
              </span>
            </div>
          </div>

          {/* Booking rules */}
          <div className="bg-brand-hoverTint p-3 rounded-lg border border-blue-100 flex items-start gap-2">
            <Info className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-brand-textBody leading-relaxed">
              You may cancel for a full refund up to 24 hours before check-in per Hotelify policy.
            </p>
          </div>

          {/* Book action */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 border border-brand-border hover:bg-brand-bg text-brand-textHead text-xs font-medium py-3 rounded-lg transition-colors"
            >
              Go Back
            </button>
            <button
              type="submit"
              className="w-2/3 bg-brand-secondary hover:bg-brand-secondaryHover text-brand-textHead text-xs font-medium py-3 rounded-lg transition-colors border border-lime-400/35 shadow-sm text-center"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
