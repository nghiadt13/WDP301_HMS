import { MapPin, Layout, Calendar, Search } from 'lucide-react';

const HeroSection = ({ searchLocation, setSearchLocation, searchType, setSearchType, searchDate, setSearchDate, onSearch }) => {
  return (
    <>
      {/* Simple full-width background image */}
      <section className="relative h-[450px] md:h-[580px] w-full overflow-hidden border-b border-brand-border">
        <img
          src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1920"
          alt="Hotelify Premium Resort Showcase"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/5 pointer-events-none" />
      </section>

      {/* Search & Filter Form - overlapping the hero */}
      <section className="relative -mt-16 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-12">
        <div className="w-full bg-brand-card border border-brand-border rounded-xl shadow-lg p-6 sm:p-8 max-w-5xl mx-auto transform hover:translate-y-[-2px] transition-transform duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Location Select */}
            <div className="flex flex-col space-y-2">
              <label className="text-xs text-brand-textBody font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-primary" /> Destination
              </label>
              <select
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-textHead focus:outline-none focus:border-brand-primary transition-colors font-medium"
              >
                <option value="all">All locations</option>
                <option value="Hà Nội">Hanoi, Vietnam</option>
                <option value="Đà Nẵng">Da Nang, Vietnam</option>
                <option value="Phú Quốc">Phu Quoc, Vietnam</option>
              </select>
            </div>

            {/* Room Category Select */}
            <div className="flex flex-col space-y-2">
              <label className="text-xs text-brand-textBody font-medium flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-brand-primary" /> Room Type
              </label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-textHead focus:outline-none focus:border-brand-primary transition-colors font-medium"
              >
                <option value="all">All room types</option>
                <option value="suite">Premium Suite</option>
                <option value="deluxe">Deluxe</option>
                <option value="studio">Studio</option>
              </select>
            </div>

            {/* Date Selection */}
            <div className="flex flex-col space-y-2">
              <label className="text-xs text-brand-textBody font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-primary" /> Check-in / Check-out
              </label>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-textHead focus:outline-none focus:border-brand-primary transition-colors font-medium"
              />
            </div>

            {/* Action Button */}
            <div className="flex items-end">
              <button
                onClick={onSearch}
                className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/10"
              >
                <Search className="w-4 h-4" /> Search Now
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;
