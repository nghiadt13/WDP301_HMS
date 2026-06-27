import './ReceptionistDashboardPage.css';
import { bookings, kpis, menuItems, quickActions, roomStatus, serviceRequests } from '../data/receptionistDashboardData.js';

const iconPaths = {
  dashboard: 'M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z',
  calendar: 'M5 4h14v16H5V4Zm0 5h14M8 2v4m8-4v4',
  search: 'M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm5.3-2.2L21 21',
  booking: 'M6 3h12v18H6V3Zm3 5h6M9 12h6M9 16h4',
  bed: 'M4 11V6h5a4 4 0 0 1 4 4v1h7v7M4 18v-7h16v7M4 18v2m16-2v2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  wallet: 'M4 7h15v11H4V7Zm0 0V5h13m-1 8h3',
  check: 'M4 4h16v16H4V4Zm4 8 3 3 5-6',
  file: 'M6 3h8l4 4v14H6V3Zm8 0v5h5',
  plus: 'M12 5v14m-7-7h14',
  bell: 'M6 17h12l-1.5-2.5V10a4.5 4.5 0 0 0-9 0v4.5L6 17Zm4 0a2 2 0 0 0 4 0',
  message: 'M4 5h16v10H8l-4 4V5Z',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
};

const Icon = ({ name, size = 20, className = '' }) => (
  <svg className={`receptionist-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d={iconPaths[name]} />
  </svg>
);

const SidebarItem = ({ label, icon, active }) => (
  <button className={`receptionist-sidebar-item ${active ? 'is-active' : ''}`} type="button">
    <span><Icon name={icon} />{label}</span>
  </button>
);

const KpiCard = ({ title, value, subtitle, icon, tone }) => (
  <article className="receptionist-card receptionist-kpi-card">
    <span className={`receptionist-kpi-icon ${tone}`}><Icon name={icon} /></span>
    <div>
      <p>{title}</p>
      <strong>{value}</strong>
      <small>{subtitle}</small>
    </div>
  </article>
);

const ReceptionistDashboardPage = () => {
  return (
    <div className="receptionist-dashboard">
      <aside className="receptionist-sidebar">
        <div className="receptionist-brand">
          <span className="receptionist-brand-mark"><Icon name="dashboard" /></span>
          <span>Hotelify</span>
        </div>
        <p className="receptionist-section-label">2. Receptionist</p>
        <nav className="receptionist-nav" aria-label="Receptionist navigation">
          {menuItems.map(([label, icon], index) => (
            <SidebarItem key={label} label={`${index + 1}. ${label}`} icon={icon} active={index === 0} />
          ))}
        </nav>
      </aside>

      <main className="receptionist-workspace">
        <header className="receptionist-header">
          <div>
            <span>Saturday, 27 June 2026</span>
            <h1>Receptionist Dashboard</h1>
          </div>
          <div className="receptionist-header-actions">
            <label className="receptionist-search">
              <Icon name="search" size={18} />
              <input placeholder="Search booking, guest, room..." />
            </label>
            <button className="receptionist-circle-button" type="button"><Icon name="message" /></button>
            <button className="receptionist-circle-button" type="button"><Icon name="bell" /></button>
            <div className="receptionist-profile">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80" alt="Receptionist profile" />
              <div><strong>Reception Desk</strong><small>Morning Shift</small></div>
            </div>
          </div>
        </header>

        <section className="receptionist-content">
          <div className="receptionist-main-column">
            <section className="receptionist-grid receptionist-kpis">
              {kpis.map((item) => <KpiCard key={item[0]} title={item[0]} value={item[1]} subtitle={item[2]} icon={item[3]} tone={item[4]} />)}
            </section>

            <section className="receptionist-card receptionist-bookings-card">
              <div className="receptionist-card-heading">
                <div>
                  <h2>View Booking List</h2>
                  <p>Manage reservations, walk-in bookings, deposits, and check-in status.</p>
                </div>
                <button type="button"><Icon name="plus" size={16} />Create Walk-in Booking</button>
              </div>
              <div className="receptionist-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Booking</th>
                      <th>Guest</th>
                      <th>Room</th>
                      <th>Stay Dates</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(([code, guest, room, roomNo, dates, payment, status]) => (
                      <tr key={code}>
                        <td><strong>{code}</strong></td>
                        <td>{guest}</td>
                        <td><strong>{room}</strong><small>Room {roomNo}</small></td>
                        <td>{dates}</td>
                        <td>{payment}</td>
                        <td><span className={`receptionist-status ${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span></td>
                        <td><button className="receptionist-link-button" type="button">View Detail</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="receptionist-grid receptionist-actions-grid">
              {quickActions.map(([title, description, icon]) => (
                <article className="receptionist-card receptionist-action-card" key={title}>
                  <span><Icon name={icon} /></span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </section>
          </div>

          <aside className="receptionist-side-column">
            <section className="receptionist-card">
              <div className="receptionist-card-heading compact">
                <h2>Room Status Board</h2>
                <button type="button"><Icon name="dots" size={16} /></button>
              </div>
              <div className="receptionist-room-bars">
                {roomStatus.map(([label, count, type]) => (
                  <div key={label}>
                    <span><b>{count}</b>{label}</span>
                    <i><em className={type} style={{ width: `${Math.min(count, 80)}%` }} /></i>
                  </div>
                ))}
              </div>
            </section>

            <section className="receptionist-card">
              <div className="receptionist-card-heading compact">
                <h2>Service Requests</h2>
                <button type="button"><Icon name="plus" size={16} /></button>
              </div>
              <div className="receptionist-request-list">
                {serviceRequests.map(([title, room, owner]) => (
                  <article key={title}>
                    <strong>{title}</strong>
                    <span>{room} - Route to {owner}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="receptionist-card receptionist-shift-card">
              <h2>Today Focus</h2>
              <p>Prioritize arrivals, deposits, room assignment, and check-out inspection follow-up.</p>
              <button type="button">Open Work Queue</button>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
};

export default ReceptionistDashboardPage;
