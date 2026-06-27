import { useState } from 'react';
import { Hotel, ArrowRight, Phone, Mail } from 'lucide-react';

const Footer = ({ onSubscribe }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      onSubscribe(email);
      setEmail('');
    }
  };

  return (
    <footer className="bg-brand-card border-t border-brand-border pt-16 pb-8 text-xs" id="support">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-brand-border">
          {/* Brand Column */}
          <div className="md:col-span-5 flex flex-col space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-brand-primary p-2 rounded-lg text-white">
                <Hotel className="w-5 h-5" />
              </div>
              <span className="text-lg font-medium text-brand-textHead">Hotelify</span>
            </div>
            <p className="text-brand-textBody leading-relaxed max-w-sm">
              Hotelify is a chain of minimalist hotels and living spaces, delivering the perfect blend of refined design and modern hospitality.
            </p>
            {/* Newsletter Signup */}
            <div className="pt-2">
              <h4 className="text-xs font-medium text-brand-textHead mb-2 uppercase tracking-wider">
                Subscribe for exclusive offers
              </h4>
              <form onSubmit={handleSubmit} className="flex max-w-sm">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address..."
                  required
                  className="flex-1 px-3 py-2 border border-brand-border rounded-l-lg text-xs bg-brand-bg text-brand-textHead focus:outline-none focus:border-brand-primary"
                />
                <button
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-primaryHover text-white px-4 rounded-r-lg font-medium transition-colors flex items-center justify-center"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Quick Links Column 1 */}
          <div className="md:col-span-2 md:col-start-7 space-y-3">
            <h4 className="font-medium text-brand-textHead uppercase tracking-wider text-[10px] text-brand-primary">
              Services
            </h4>
            <ul className="space-y-2">
              <li><a href="#featured-rooms" className="text-brand-textBody hover:text-brand-textHead transition-colors">Premium Suite</a></li>
              <li><a href="#featured-rooms" className="text-brand-textBody hover:text-brand-textHead transition-colors">Family Deluxe</a></li>
              <li><a href="#featured-rooms" className="text-brand-textBody hover:text-brand-textHead transition-colors">Work Studio</a></li>
              <li><a href="#featured-rooms" className="text-brand-textBody hover:text-brand-textHead transition-colors">Long Stay Deals</a></li>
            </ul>
          </div>

          {/* Quick Links Column 2 */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-medium text-brand-textHead uppercase tracking-wider text-[10px] text-brand-primary">
              About Hotelify
            </h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-brand-textBody hover:text-brand-textHead transition-colors">Our Story</a></li>
              <li><a href="#" className="text-brand-textBody hover:text-brand-textHead transition-colors">Careers</a></li>
              <li><a href="#" className="text-brand-textBody hover:text-brand-textHead transition-colors">Hotel Network</a></li>
              <li><a href="#" className="text-brand-textBody hover:text-brand-textHead transition-colors">Press Contact</a></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-medium text-brand-textHead uppercase tracking-wider text-[10px] text-brand-primary">
              Head Office & Support
            </h4>
            <ul className="space-y-2 text-brand-textBody">
              <li className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-brand-primary" /> 1900 6825
              </li>
              <li className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-primary" /> hello@hotelify.vn
              </li>
              <li className="leading-relaxed">96 Ba Trieu Street, Hoan Kiem, Hanoi</li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 gap-4">
          <p className="text-brand-textBody">
            &copy; 2026 Hotelify International Co., Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-brand-textBody hover:text-brand-textHead transition-colors">Privacy Policy</a>
            <a href="#" className="text-brand-textBody hover:text-brand-textHead transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
