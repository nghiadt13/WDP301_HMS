import { Hotel, Search, Menu, Scan } from 'lucide-react';
import { useState } from 'react';

const navLinks = [
  { label: 'HOME', href: '#' },
  { label: 'ABOUT', href: '#' },
  { label: 'ROOMS', href: '#featured-rooms' },
  { label: 'PAGES', href: '#' },
  { label: 'CONTACT', href: '#support' },
];

const Navbar = ({ onShowPromo }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-brand-card/90 backdrop-blur-md border-b border-brand-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-brand-primary p-2 rounded-lg text-white">
              <Hotel className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-medium tracking-widest text-brand-textHead uppercase">
                Hotelify
              </span>
              <span className="text-[9px] text-brand-textBody uppercase tracking-widest -mt-1">
                Hotel & Stay
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="group relative text-xs tracking-widest font-medium text-brand-textBody hover:text-brand-textHead transition-colors"
              >
                {link.label}
                <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-brand-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Right side icons */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                const el = document.getElementById('search-location');
                if (el) el.focus();
              }}
              className="text-brand-textHead hover:text-brand-primary transition-colors p-1"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-brand-textHead hover:text-brand-primary transition-colors p-1"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div
              onClick={onShowPromo}
              className="w-10 h-10 rounded-full bg-white shadow-sm border border-brand-border flex items-center justify-center text-brand-primary hover:bg-brand-hoverTint transition-all cursor-pointer transform active:scale-95"
              title="Scan promo"
            >
              <Scan className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden border-t border-brand-border bg-brand-card px-4 py-4 space-y-3 ${
          mobileOpen ? 'block' : 'hidden'
        }`}
      >
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="block text-xs tracking-widest font-medium text-brand-textBody py-2"
          >
            {link.label}
          </a>
        ))}
      </div>
    </header>
  );
};

export default Navbar;
