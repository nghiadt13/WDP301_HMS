import { MapPin, Star, Users, Bed, Maximize2, Wifi, Coffee, Droplet, Briefcase, Utensils, Music } from 'lucide-react';

const amenityIcons = {
  'Free Wifi': Wifi,
  'Coffee Maker': Coffee,
  Jacuzzi: Droplet,
  'Work Desk': Briefcase,
  'Mini Kitchen': Utensils,
  'Audio Sound': Music,
};

const RoomCard = ({ room, onBook }) => {
  const isLowStock = room.stock === 'low';

  return (
    <div className="room-card bg-brand-card border border-brand-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={room.image}
          alt={room.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://placehold.co/600x400/FFFFFF/2563EB?text=${encodeURIComponent(room.name)}`;
          }}
        />
        {isLowStock ? (
          <span className="absolute top-4 left-4 bg-brand-errorBg text-brand-errorText text-xs font-medium px-2.5 py-1 rounded-lg border border-red-200">
            Last room available
          </span>
        ) : (
          <span className="absolute top-4 left-4 bg-brand-successBg text-brand-successText text-xs font-medium px-2.5 py-1 rounded-lg border border-emerald-200">
            Available
          </span>
        )}
        <span className="absolute top-4 right-4 bg-white/95 text-brand-textHead text-xs font-medium px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-brand-primary" /> {room.location}
        </span>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-brand-primary uppercase tracking-wider">{room.category}</span>
          <div className="flex items-center gap-1 text-xs text-brand-textHead">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{room.rating}</span> ({room.reviews} reviews)
          </div>
        </div>
        <h3 className="text-lg font-medium text-brand-textHead mb-2">{room.name}</h3>
        <p className="text-xs text-brand-textBody line-clamp-2 mb-4">{room.description}</p>

        <div className="flex flex-wrap items-center gap-3 mb-6 border-t border-brand-border pt-4">
          <span className="text-xs text-brand-textBody flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {room.guests}
          </span>
          <span className="text-xs text-brand-textBody flex items-center gap-1">
            <Bed className="w-3.5 h-3.5" /> {room.bedType}
          </span>
          <span className="text-xs text-brand-textBody flex items-center gap-1">
            <Maximize2 className="w-3.5 h-3.5" /> {room.size}
          </span>
          {room.amenity && (
            <span className="text-xs text-brand-textBody flex items-center gap-1">
              {(() => {
                const IconComponent = amenityIcons[room.amenity] || Wifi;
                return <IconComponent className="w-3.5 h-3.5" />;
              })()}
              {room.amenity}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-xs text-brand-textBody block">Price per night</span>
            <span className="text-lg font-medium text-brand-textHead">{room.price}</span>
          </div>
          <button
            onClick={() => onBook(room)}
            className="bg-brand-secondary hover:bg-brand-secondaryHover text-brand-textHead text-xs font-medium px-5 py-3 rounded-lg transition-colors border border-lime-400/35 shadow-sm"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
