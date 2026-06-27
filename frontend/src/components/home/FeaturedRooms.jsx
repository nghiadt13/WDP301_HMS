import { SearchX } from 'lucide-react';
import RoomCard from './RoomCard';

const roomsData = [
  {
    id: 1,
    name: 'The Ocean Grand Suite',
    type: 'suite',
    category: 'Premium Suite',
    location: 'Da Nang',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=600',
    rating: 4.9,
    reviews: 86,
    description: 'Panoramic ocean view of My Khe beach, natural marble bathroom and a spacious private balcony.',
    guests: '2 Guests',
    bedType: 'King Bed',
    size: '55 m²',
    amenity: 'Free Wifi',
    price: '$72/night',
    stock: 'available',
  },
  {
    id: 2,
    name: 'Urban Minimalist Loft',
    type: 'studio',
    category: 'Studio',
    location: 'Hanoi',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=600',
    rating: 4.8,
    reviews: 42,
    description: 'Modern minimalist studio in the heart of the capital. Natural light with high ceilings and premium walnut furniture.',
    guests: '1 Guest',
    bedType: 'Queen Bed',
    size: '32 m²',
    amenity: 'Coffee Maker',
    price: '$44/night',
    stock: 'available',
  },
  {
    id: 3,
    name: 'Tropical Premium Deluxe',
    type: 'deluxe',
    category: 'Deluxe',
    location: 'Phu Quoc',
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=600',
    rating: 4.7,
    reviews: 112,
    description: 'Immerse yourself in the pristine nature of Pearl Island. Deluxe Garden view with private outdoor hot tub and smart curtain system.',
    guests: '2-3 Guests',
    bedType: '2 Queen Beds',
    size: '45 m²',
    amenity: 'Jacuzzi',
    price: '$88/night',
    stock: 'low',
  },
  {
    id: 4,
    name: 'Heritage Executive Suite',
    type: 'suite',
    category: 'Premium Suite',
    location: 'Hanoi',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4db85b?auto=format&fit=crop&q=80&w=600',
    rating: 4.9,
    reviews: 65,
    description: 'A perfect blend of old-world capital charm and modern 5-star facilities. Fully integrated professional workspace.',
    guests: '2 Guests',
    bedType: 'King Bed',
    size: '60 m²',
    amenity: 'Work Desk',
    price: '$96/night',
    stock: 'available',
  },
  {
    id: 5,
    name: 'Ocean Breeze Studio',
    type: 'studio',
    category: 'Studio',
    location: 'Da Nang',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=600',
    rating: 4.8,
    reviews: 51,
    description: 'Open the large glass doors to the cool Da Nang sea breeze. Fully equipped mini kitchen for a carefree vacation.',
    guests: '2 Guests',
    bedType: 'Queen Bed',
    size: '38 m²',
    amenity: 'Mini Kitchen',
    price: '$50/night',
    stock: 'available',
  },
  {
    id: 6,
    name: 'Sunset Panorama Deluxe',
    type: 'deluxe',
    category: 'Deluxe',
    location: 'Phu Quoc',
    image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=600',
    rating: 4.8,
    reviews: 94,
    description: 'Watch the golden sunset in Phu Quoc right from your bed. Premium wireless sound system for all your senses.',
    guests: '2 Guests',
    bedType: 'King Bed',
    size: '40 m²',
    amenity: 'Audio Sound',
    price: '$78/night',
    stock: 'available',
  },
];

const filterTabs = [
  { key: 'all', label: 'All Rooms' },
  { key: 'suite', label: 'Suite' },
  { key: 'deluxe', label: 'Deluxe' },
  { key: 'studio', label: 'Studio' },
];

const FeaturedRooms = ({ activeFilter, onFilterChange, searchLocation, searchType, onBook, onResetFilters }) => {
  const filteredRooms = roomsData.filter((room) => {
    const matchesCategory = activeFilter === 'all' || room.type === activeFilter;
    const matchesLocation = searchLocation === 'all' || room.location === searchLocation;
    const matchesType = searchType === 'all' || room.type === searchType;
    return matchesCategory && matchesLocation && matchesType;
  });

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full" id="featured-rooms">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs text-brand-primary font-medium tracking-widest uppercase block mb-2">
          Exclusive at Hotelify
        </span>
        <h2 className="text-3xl font-medium text-brand-textHead">Discover Our Featured Rooms</h2>
        <p className="text-sm text-brand-textBody mt-2">
          Carefully curated by top architects with modern style and vibrant energy.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onFilterChange(tab.key)}
            className={`px-4 py-2 text-xs font-medium rounded-lg border border-brand-border transition-all ${
              activeFilter === tab.key
                ? 'bg-brand-primary text-white'
                : 'bg-brand-card text-brand-textBody hover:bg-brand-hoverTint hover:text-brand-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Room Grid */}
      {filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} onBook={onBook} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-brand-card rounded-xl border border-brand-border max-w-lg mx-auto">
          <div className="bg-brand-errorBg text-brand-errorText p-3 rounded-full inline-flex mb-4">
            <SearchX className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-brand-textHead mb-2">No rooms found</h3>
          <p className="text-sm text-brand-textBody">
            Try changing the location or room type in the filters to find other options.
          </p>
          <button
            onClick={onResetFilters}
            className="mt-4 inline-flex text-xs font-medium text-brand-primary border-b border-brand-primary pb-0.5 hover:opacity-85"
          >
            Reset filters
          </button>
        </div>
      )}
    </main>
  );
};

export default FeaturedRooms;
