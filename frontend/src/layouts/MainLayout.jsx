import { Link, Outlet, useLocation } from 'react-router-dom';

import AppHeader from '../components/AppHeader.jsx';

const MainLayout = () => {
  const location = useLocation();
  const hiddenPrefixes = ['/login', '/register', '/forgot-password', '/reset-password', '/manager', '/receptionist', '/admin'];
  const shouldShowHeader = !hiddenPrefixes.some((prefix) => location.pathname.startsWith(prefix));
  const footerHiddenPrefixes = ['/login', '/register', '/manager', '/receptionist', '/admin', '/customer'];
  const shouldShowFooter = !footerHiddenPrefixes.some((prefix) => location.pathname.startsWith(prefix));

  return (
    <main className="app-shell min-h-screen">
      {shouldShowHeader ? <AppHeader /> : null}
      <Outlet />
      {shouldShowFooter ? (
        <footer className="app-footer">
          <div className="app-footer-cta">
            <span className="app-footer-kicker">Heard enough? -&gt;</span>
            <a className="app-footer-cta-link" href="tel:0868729129">
              Contact us
            </a>
            <a className="app-footer-cta-arrow" href="tel:0868729129" aria-label="Contact Hotelify">
              -&gt;
            </a>
          </div>

          <div className="app-footer-main">
            <div className="app-footer-brand">
              <strong>Hotelify</strong>
              <span>Stay refined by the bay</span>
            </div>

            <div className="app-footer-column">
              <h3>Bãi Cháy, Hạ Long</h3>
              <a href="tel:0868729129">0868729129</a>
              <span>Bãi Cháy, Hạ Long, Quảng Ninh</span>
              <a className="app-footer-map" href="https://maps.google.com/?q=Bai+Chay+Ha+Long" target="_blank" rel="noreferrer">
                See on map -&gt;
              </a>
            </div>

            <div className="app-footer-column">
              <h3>Hotel policies</h3>
              <Link to="/customer/policies">Privacy policy</Link>
              <Link to="/customer/policies">Terms and conditions</Link>
              <Link to="/customer/policies">Cancellation policy</Link>
            </div>

            <div className="app-footer-column app-footer-connect">
              <h3>Want a better stay?</h3>
              <Link className="app-footer-newsletter" to="/rooms">
                Book your room -&gt;
              </Link>
              <span>Follow us</span>
              <div className="app-footer-social" aria-label="Social media">
                <a href="https://facebook.com" aria-label="Facebook">f</a>
                <a href="https://instagram.com" aria-label="Instagram">IG</a>
                <a href="https://zalo.me/0868729129" aria-label="Zalo">Zalo</a>
                <a href="https://youtube.com" aria-label="YouTube">YT</a>
              </div>
            </div>

            <span className="app-footer-copy">Copyright 2026 Hotelify</span>
          </div>
        </footer>
      ) : null}
    </main>
  );
};

export default MainLayout;
