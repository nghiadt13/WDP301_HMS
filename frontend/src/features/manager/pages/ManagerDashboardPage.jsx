import './ManagerDashboardPage.css';

const iconPaths = {
  dashboard: 'M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z',
  message: 'M4 5h16v11H7l-3 3V5Z',
  calendar: 'M5 4h14v16H5V4Zm0 5h14M8 2v4m8-4v4',
  megaphone: 'M4 13h4l9 4V7l-9 4H4v2Zm4 0v5',
  bed: 'M4 11V5h5a4 4 0 0 1 4 4v2h7v7M4 18v-7h16v7M4 18v2m16-2v2',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 12l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z',
  box: 'M4 7l8-4 8 4v10l-8 4-8-4V7Zm8 4 8-4M12 11 4 7m8 4v10',
  wallet: 'M4 7h15v11H4V7Zm0 0V5h13m-1 8h3',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.1L12 17.2 6.4 20.1 7.5 14 3 9.6l6.2-.9L12 3Z',
  login: 'M10 17l5-5-5-5m5 5H3m13-8h5v16h-5',
  search: 'M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm5.3-2.2L21 21',
  bell: 'M6 17h12l-1.5-2.5V10a4.5 4.5 0 0 0-9 0v4.5L6 17Zm4 0a2 2 0 0 0 4 0',
  chat: 'M4 5h16v10H8l-4 4V5Z',
  chevron: 'm7 10 5 5 5-5',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
  checkSquare: 'M4 4h16v16H4V4Zm4 8 3 3 5-6',
  plus: 'M12 5v14m-7-7h14',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  file: 'M6 3h8l4 4v14H6V3Zm8 0v5h5',
  up: 'M7 17 17 7m0 0H9m8 0v8',
  down: 'M7 7l10 10m0 0H9m8 0V9',
};

const Icon = ({ name, size = 20, className = '' }) => (
  <svg className={`manager-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d={iconPaths[name]} />
  </svg>
);

const SidebarItem = ({ icon, label, active, badge, hasSub }) => (
  <button className={`manager-sidebar-item ${active ? 'is-active' : ''}`} type="button">
    <span className="manager-sidebar-label"><Icon name={icon} /><span>{label}</span></span>
    <span className="manager-sidebar-meta">
      {badge ? <span className="manager-badge">{badge}</span> : null}
      {hasSub ? <Icon name="chevron" size={16} /> : null}
    </span>
  </button>
);

const StatCard = ({ title, value, icon, iconTone, trendType, trendValue, subtitle }) => (
  <article className="manager-card manager-stat-card">
    <div className={`manager-stat-icon ${iconTone}`}><Icon name={icon} /></div>
    <div><p className="manager-muted">{title}</p><strong>{value}</strong></div>
    <p className="manager-trend-row">
      <span className={`manager-trend ${trendType}`}><Icon name={trendType === 'up' ? 'up' : 'down'} size={12} />{trendValue}</span>
      <span>{subtitle}</span>
    </p>
  </article>
);


// Mock data
const bookings = [
  ['#BKG-1024', 'Emily Carter', 'Deluxe Suite', '210', '3 Nights', 'Mar 10 - Mar 13, 2035', 'Checked-In', 'checked-in'],
  ['#BKG-1025', 'Daniel Wong', 'Superior Room', '315', '2 Nights', 'Mar 11 - Mar 13, 2035', 'Pending', 'pending'],
  ['#BKG-1026', 'Sophia Rivera', 'Executive Suite', '108', '4 Nights', 'Mar 09 - Mar 13, 2035', 'Reserved', 'reserved'],
  ['#BKG-1027', 'Liam Johnson', 'Deluxe Suite', '412', '1 Night', 'Mar 12 - Mar 13, 2035', 'Checked-Out', 'checked-out'],
  ['#BKG-1028', 'Hannah Lee', 'Standard Room', '205', '5 Nights', 'Mar 10 - Mar 15, 2035', 'Checked-In', 'checked-in'],
];

const tasks = [
  ['Confirm Group Booking for VIP Guests', 'March 12, 2035'],
  ['Update Room Maintenance Schedule', 'March 13, 2035'],
  ['Review Monthly Revenue Report', 'March 14, 2035'],
  ['Coordinate Staff Shift Assignments', 'March 15, 2035'],
];

const activities = [
  ['Front Desk Admin', 'user', 'Checked in Emily Carter to Room 210 (Deluxe Suite).', '09:45 AM', 'lime'],
  ['Housekeeping Team', 'sparkle', 'Marked Room 305 as Clean & Ready.', '09:20 AM', 'blue'],
  ['Manager approved', 'checkSquare', 'Approved VIP arrival preferences for the evening shift.', '08:50 AM', 'lime'],
  ['Reservation Staff', 'calendar', 'Confirmed corporate booking for TechVision Ltd., 5 rooms reserved.', '08:30 AM', 'blue'],
  ['System Update - Revenue report', 'file', 'March 2035 revenue report generated and saved.', '08:00 AM', 'lime'],
  ['Housekeeping Team', 'sparkle', 'Marked Room 216 as Clean & Ready.', '07:20 AM', 'blue'],
];

const ratingItems = [
  ['Cleanliness', 4.8],
  ['Comfort', 4.6],
  ['Service / Staff', 4.9],
  ['Facilities', 4.5],
  ['Value', 4.6],
  ['Location', 4.7],
];

const managerMenu = [
  { icon: 'dashboard', label: 'Dashboard', active: true },
  { icon: 'bed', label: 'Manage Room' },
  { icon: 'bed', label: 'Manage Room Type' },
  { icon: 'checkSquare', label: 'Staff Task' },
  { icon: 'box', label: 'Minibar' },
  { icon: 'calendar', label: 'Reservation Overview' },
  { icon: 'wallet', label: 'Revenue Summary' },
  { icon: 'file', label: 'Occupancy Report' },
  { icon: 'star', label: 'Customer Feedback' },
];

const adminMenu = [
  { icon: 'user', label: 'Manage Internal Account', active: true },
  { icon: 'login', label: 'Reset Staff Password' },
  { icon: 'sparkle', label: 'Manage Role' },
  { icon: 'user', label: 'Profile' },
];

const ManagerDashboardPage = ({ role = 'MANAGER' }) => {
  const currentMenu = role === 'ADMIN' ? adminMenu : managerMenu;

  return (
    <div className="manager-dashboard">
      <aside className="manager-sidebar">
        <div className="manager-brand"><span className="manager-brand-mark"><Icon name="dashboard" /></span><span>Hotelify</span></div>
        <nav className="manager-nav" aria-label="Manager navigation">
          {currentMenu.map((item, index) => (
            <SidebarItem 
              key={index} 
              icon={item.icon} 
              label={item.label} 
              active={item.active} 
            />
          ))}
        </nav>
        <div className="manager-promo">
          <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=420&q=80" alt="Hotel lobby" />
          <h2>Manage Smarter, Serve Better</h2>
          <p>Automate check-ins, monitor occupancy, and track performance.</p>
          <button type="button">Upgrade to Pro</button>
        </div>
      </aside>

      <section className="manager-workspace">
        <header className="manager-header">
          <h1>{role === 'ADMIN' ? 'Manage Internal Account' : 'Dashboard'}</h1>
          <div className="manager-header-actions">
            <label className="manager-search"><Icon name="search" size={18} /><input placeholder="Search placeholder" type="search" /></label>
            <button className="manager-circle-button" type="button" aria-label="Open messages"><Icon name="chat" /></button>
            <button className="manager-circle-button" type="button" aria-label="Open notifications"><Icon name="bell" /></button>
            <div className="manager-profile">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" alt="Polina Streward" />
              <span><strong>Polina Streward</strong><small>{role === 'ADMIN' ? 'Admin' : 'Manager'}</small></span>
            </div>
          </div>
        </header>

        <main className="manager-content">
          {role === 'ADMIN' ? (
            <div className="manager-main-column" style={{ width: '100%' }}>
              <section className="manager-card manager-booking-card">
                <div className="manager-booking-heading"><h2>Internal Accounts</h2><div><label className="manager-table-search"><Icon name="search" size={16} /><input placeholder="Search account" type="search" /></label><button type="button" style={{ marginLeft: '8px' }}>Add Account</button></div></div>
                <div className="manager-table-wrap"><table><thead><tr><th>Account ID & Name</th><th>Role</th><th>Email</th><th>Status</th></tr></thead><tbody><tr><td><strong>#ACC-001</strong><small>Polina Streward</small></td><td>Admin</td><td>polina@hotelify.com</td><td><span className="manager-status lime">Active</span></td></tr><tr><td><strong>#ACC-002</strong><small>John Manager</small></td><td>Manager</td><td>john@hotelify.com</td><td><span className="manager-status lime">Active</span></td></tr><tr><td><strong>#ACC-003</strong><small>Jane Receptionist</small></td><td>Receptionist</td><td>jane@hotelify.com</td><td><span className="manager-status gray">Inactive</span></td></tr></tbody></table></div>
              </section>
            </div>
          ) : (
            <>
              <div className="manager-main-column">
            <section className="manager-grid manager-kpis">
              <article className="manager-card manager-greeting">
                <div><h2>Hi, Polina</h2><p>Saturday, 25 November 2028</p></div>
                <div className="manager-earnings"><span>Total Earnings</span><strong>$58,240</strong><p><span>from last week</span><b><Icon name="up" size={11} />+15.6%</b></p></div>
              </article>
              <StatCard title="New Reservations" value="128" trendType="up" trendValue="+12.4%" subtitle="from last week" icon="checkSquare" iconTone="soft" />
              <StatCard title="Guests Checked In" value="94" trendType="up" trendValue="+8.7%" subtitle="week-over-week" icon="login" iconTone="primary" />
              <StatCard title="Guests Checked Out" value="76" trendType="down" trendValue="-3.2%" subtitle="from previous week" icon="login" iconTone="pale" />
            </section>

            <section className="manager-grid manager-charts">
              <article className="manager-card manager-chart-card">
                <div className="manager-card-heading"><h2>Revenue</h2><button type="button">Last 6 Months <Icon name="chevron" size={14} /></button></div>
                <div className="manager-line-chart">
                  <div className="manager-y-axis"><span>$400K</span><span>$300K</span><span>$200K</span><span>$100K</span><span>$0</span></div>
                  <div className="manager-chart-canvas">
                    <svg viewBox="0 0 350 150" preserveAspectRatio="none">
                      <defs><linearGradient id="managerRevenueGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0" /></linearGradient></defs>
                      <g className="manager-grid-lines"><line x1="0" y1="0" x2="350" y2="0" /><line x1="0" y1="37.5" x2="350" y2="37.5" /><line x1="0" y1="75" x2="350" y2="75" /><line x1="0" y1="112.5" x2="350" y2="112.5" /><line x1="0" y1="150" x2="350" y2="150" /></g>
                      <path d="M0,75 C30,75 50,110 80,110 C120,110 140,20 180,20 C220,20 240,100 280,100 C320,100 330,50 350,50 L350,150 L0,150 Z" fill="url(#managerRevenueGradient)" />
                      <path d="M0,75 C30,75 50,110 80,110 C120,110 140,20 180,20 C220,20 240,100 280,100 C320,100 330,50 350,50" fill="none" stroke="#3b82f6" strokeWidth="3" />
                      <circle cx="140" cy="40" r="5" fill="#fff" stroke="#3b82f6" strokeWidth="3" /><line x1="140" y1="40" x2="140" y2="150" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 4" />
                    </svg>
                    <div className="manager-chart-tooltip"><span>Total Revenue</span><strong>$315,060</strong></div>
                    <div className="manager-x-axis"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span></div>
                  </div>
                </div>
              </article>

              <article className="manager-card manager-chart-card">
                <div className="manager-card-heading"><h2>Occupancy Trend</h2><button type="button">Last 7 Days <Icon name="chevron" size={14} /></button></div>
                <div className="manager-legend"><span><i className="blue" /> Occupied</span><span><i className="gray" /> Available</span></div>
                <div className="manager-bar-chart">
                  {[70, 45, 60, 80, 70, 90, 55].map((value, index) => (
                    <div className="manager-bar" key={value + index}>{index === 4 ? <div className="manager-bar-tooltip">15 July 2028<br /><strong>72 Rooms</strong></div> : null}<span style={{ height: `${value}%` }} /><small>{12 + index} Jun</small></div>
                  ))}
                </div>
              </article>
            </section>

            <section className="manager-grid manager-insights">
              <article className="manager-card">
                <div className="manager-card-heading"><h2>Booking Source</h2><button className="manager-icon-button" type="button" aria-label="Booking source options"><Icon name="dots" /></button></div>
                <div className="manager-source-layout">
                  <div className="manager-donut"><svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="55" /><circle className="donut-blue" cx="70" cy="70" r="55" /><circle className="donut-lime" cx="70" cy="70" r="55" /><circle className="donut-gray" cx="70" cy="70" r="55" /></svg><span><Icon name="bed" size={24} /></span></div>
                  <div className="manager-source-list">{[['Direct Website', 42, 'blue'], ['Online Travel Agencies', 33, 'lime'], ['Walk-in Guests', 15, 'gray'], ['Corporate Partnerships', 10, 'dark']].map(([label, value, tone]) => <div className="manager-progress" key={label}><p><span>{label}</span><strong>{value}%</strong></p><i><b className={tone} style={{ width: `${value}%` }} /></i></div>)}</div>
                </div>
              </article>

              <article className="manager-card">
                <div className="manager-card-heading"><h2>Overall Rating</h2><button className="manager-icon-button" type="button" aria-label="Rating options"><Icon name="dots" /></button></div>
                <div className="manager-rating-layout">
                  <div className="manager-gauge"><svg viewBox="0 0 180 100"><path d="M 20 90 A 70 70 0 0 1 160 90" /><path className="gauge-value" d="M 20 90 A 70 70 0 0 1 160 90" /><circle cx="90" cy="85" r="8" /><path className="gauge-needle" d="M 90 85 L 145 80" /></svg><span>Total Review</span><strong>4.7 / 5.0</strong><small>1,248 Guests</small></div>
                  <div className="manager-rating-list">{ratingItems.map(([label, score]) => <div className="manager-rating-item" key={label}><span>{label}</span><i><b style={{ width: `${(score / 5) * 100}%` }} /></i><strong>{score}<Icon name="star" size={11} /></strong></div>)}</div>
                </div>
              </article>
            </section>

            <section className="manager-card manager-booking-card">
              <div className="manager-booking-heading"><h2>Booking List</h2><div><label className="manager-table-search"><Icon name="search" size={16} /><input placeholder="Search guest, status, etc" type="search" /></label><button type="button">All Status <Icon name="chevron" size={14} /></button></div></div>
              <div className="manager-table-wrap"><table><thead><tr><th>Booking ID & Guest Name</th><th>Room Type</th><th>Room No.</th><th>Duration</th><th>Check-In & Check-Out</th><th>Status</th></tr></thead><tbody>{bookings.map(([id, name, type, room, duration, date, status, statusClass]) => <tr key={id}><td><strong>{id}</strong><small>{name}</small></td><td><span className="manager-room-dot" />{type}</td><td>{room}</td><td>{duration}</td><td>{date}</td><td><span className={`manager-status ${statusClass}`}>{status}</span></td></tr>)}</tbody></table></div>
            </section>

            <footer className="manager-footer"><span>Copyright © 2026 Hotelify</span><a href="/">Privacy Policy</a><a href="/">Terms and conditions</a><a href="/">Contact</a></footer>
          </div>

          <aside className="manager-side-column">
            <article className="manager-card"><div className="manager-card-heading"><h2>Room Availability</h2><button className="manager-icon-button" type="button" aria-label="Room availability options"><Icon name="dots" /></button></div><div className="manager-total-rooms"><span>Total All Rooms</span><strong>120</strong></div><div className="manager-room-blocks">{Array.from({ length: 68 }, (_, index) => <span className="occupied" key={`occ-${index}`} />)}{Array.from({ length: 22 }, (_, index) => <span className="reserved" key={`res-${index}`} />)}{Array.from({ length: 25 }, (_, index) => <span className="available" key={`avl-${index}`} />)}{Array.from({ length: 5 }, (_, index) => <span className="not-ready" key={`nr-${index}`} />)}</div><div className="manager-room-legend"><span><i className="occupied" /><strong>68</strong> Occupied</span><span><i className="available" /><strong>25</strong> Available</span><span><i className="reserved" /><strong>22</strong> Reserved</span><span><i className="not-ready" /><strong>5</strong> Not Ready</span></div></article>
            <article className="manager-card"><div className="manager-card-heading"><h2>Tasks</h2><button className="manager-add-button" type="button" aria-label="Add task"><Icon name="plus" size={16} /></button></div><div className="manager-task-list">{tasks.map(([title, date]) => <label key={title} className="manager-task"><input type="checkbox" /><span><strong>{title}</strong><small>{date}</small></span></label>)}</div></article>
            <article className="manager-card"><div className="manager-card-heading"><h2>Recent Activities</h2><button className="manager-icon-button" type="button" aria-label="Recent activity options"><Icon name="dots" /></button></div><div className="manager-timeline">{activities.map(([user, icon, text, time, tone]) => <div className="manager-activity" key={`${user}-${time}`}><span className={`manager-activity-icon ${tone}`}><Icon name={icon} size={14} /></span><strong>{user}</strong><p>{text}</p><small>{time}</small></div>)}</div></article>
          </aside>
            </>
          )}
        </main>
      </section>
    </div>
  );
};

export default ManagerDashboardPage;
