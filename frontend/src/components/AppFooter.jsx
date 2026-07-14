import { Building2, Globe2, Mail, MapPin, Phone } from 'lucide-react';

const socialLinks = [
  { label: 'Facebook', icon: 'facebook', href: '#' },
  { label: 'YouTube', icon: 'youtube', href: '#' },
  { label: 'Website', icon: 'website', href: '#' },
  { label: 'Instagram', icon: 'instagram', href: '#' },
  { label: 'TikTok', icon: 'tiktok', href: '#' }
];

const SocialIcon = ({ type }) => {
  if (type === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.2 8.5V6.9c0-.8.2-1.3 1.3-1.3h1.6V2.8c-.8-.1-1.6-.2-2.4-.2-2.4 0-4.1 1.5-4.1 4.1v1.8H7.9v3.1h2.7v8h3.6v-8h2.7l.4-3.1h-3.1Z" />
      </svg>
    );
  }

  if (type === 'youtube') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5a3 3 0 0 0-2.1 2.1A31.4 31.4 0 0 0 1.9 12c0 1.6.2 3.2.5 4.8a3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1c.3-1.6.5-3.2.5-4.8s-.2-3.2-.5-4.8ZM10 15.5v-7l6 3.5-6 3.5Z" />
      </svg>
    );
  }

  if (type === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.2 2.8h9.6a4.4 4.4 0 0 1 4.4 4.4v9.6a4.4 4.4 0 0 1-4.4 4.4H7.2a4.4 4.4 0 0 1-4.4-4.4V7.2a4.4 4.4 0 0 1 4.4-4.4Zm0 2.1a2.3 2.3 0 0 0-2.3 2.3v9.6a2.3 2.3 0 0 0 2.3 2.3h9.6a2.3 2.3 0 0 0 2.3-2.3V7.2a2.3 2.3 0 0 0-2.3-2.3H7.2Zm4.8 3a4.1 4.1 0 1 1 0 8.2 4.1 4.1 0 0 1 0-8.2Zm0 2.1a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm4.4-2.5a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
      </svg>
    );
  }

  if (type === 'tiktok') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15.2 2.7c.4 2.5 1.9 4.1 4.3 4.3v3.3c-1.4 0-2.9-.4-4.2-1.2v5.9c0 3.1-2.2 5.8-5.6 5.8A5.5 5.5 0 0 1 4.1 15c0-3.4 2.9-6 6.3-5.4v3.5c-1.5-.5-2.8.5-2.8 1.9 0 1.2.9 2.2 2.2 2.2 1.4 0 2.1-.9 2.1-2.5v-12h3.3Z" />
      </svg>
    );
  }

  return <Globe2 size={20} strokeWidth={2.1} aria-hidden="true" />;
};

const AppFooter = () => {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <section className="app-footer-brand" aria-label="Hotelify footer">
          <span className="app-footer-logo" aria-hidden="true">
            <Building2 size={28} strokeWidth={2.2} />
          </span>
          <div>
            <h2>Hotelify</h2>
            <p>Khong gian nghi duong tai Bai Chay, Ha Long voi trai nghiem dat phong nhanh va tien loi.</p>
          </div>
        </section>

        <section className="app-footer-contact" aria-label="Thong tin lien he">
          <h3>Lien he</h3>
          <a href="mailto:tinlatoi2003@gmail.com">
            <Mail size={18} />
            <span>tinlatoi2003@gmail.com</span>
          </a>
          <a href="tel:0868729129">
            <Phone size={18} />
            <span>0868729129</span>
          </a>
          <span>
            <MapPin size={18} />
            <span>Bai Chay, Ha Long</span>
          </span>
        </section>

        <section className="app-footer-social" aria-label="Mang xa hoi">
          <h3>Theo doi Hotelify</h3>
          <div>
            {socialLinks.map((social) => (
              <a href={social.href} aria-label={social.label} key={social.label}>
                <SocialIcon type={social.icon} />
              </a>
            ))}
          </div>
        </section>
      </div>

      <div className="app-footer-bottom">
        <span>Copyright © 2026 Hotelify</span>
        <span>Hotel Management System</span>
      </div>
    </footer>
  );
};

export default AppFooter;
