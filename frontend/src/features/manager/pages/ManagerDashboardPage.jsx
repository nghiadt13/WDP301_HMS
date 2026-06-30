import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getCustomerFeedbacks, getMinibarItems, getStaffTasks } from '../api/managerApi.js';
import ManagerShell, { Icon } from '../components/ManagerShell.jsx';

const getErrorMessage = (error) => error?.response?.data?.message || error.message || 'Something went wrong';

const StatCard = ({ title, value, icon, tone, subtitle }) => (
  <article className="manager-card manager-stat-card">
    <div className={`manager-stat-icon ${tone}`}><Icon name={icon} /></div>
    <div>
      <p className="manager-muted">{title}</p>
      <strong>{value}</strong>
    </div>
    <p className="manager-muted">{subtitle}</p>
  </article>
);

const ManagerDashboardPage = () => {
  const [staffTasks, setStaffTasks] = useState([]);
  const [minibarItems, setMinibarItems] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [staffTaskData, minibarItemData, feedbackData] = await Promise.all([
          getStaffTasks(),
          getMinibarItems(),
          getCustomerFeedbacks()
        ]);

        setStaffTasks(staffTaskData);
        setMinibarItems(minibarItemData);
        setFeedbacks(feedbackData);
        setMessage('');
      } catch (error) {
        setMessage(`Cannot load manager data: ${getErrorMessage(error)}`);
      }
    };

    loadDashboard();
  }, []);

  const openStaffTasks = staffTasks.filter((task) => !['closed', 'cancelled'].includes(task.status));
  const activeMinibarItems = minibarItems.filter((item) => item.is_active !== false);
  const pendingFeedbacks = feedbacks.filter((feedback) => feedback.status === 'submitted');
  const averageRating = useMemo(() => {
    if (!feedbacks.length) {
      return '0.0';
    }

    return (feedbacks.reduce((sum, feedback) => sum + Number(feedback.rating || 0), 0) / feedbacks.length).toFixed(1);
  }, [feedbacks]);

  return (
    <ManagerShell title="Dashboard">
      <div className="manager-main-column">
        {message ? <div className="manager-message">{message}</div> : null}

        <section className="manager-grid manager-kpis">
          <article className="manager-card">
            <h2>Hi, Manager</h2>
            <p className="manager-muted">Manage hotel operations from dedicated screens.</p>
            <div className="manager-earnings">
              <span>Manager Scope</span>
              <strong>Operations</strong>
              <p><span>Tasks, minibar, feedback</span> <b><Icon name="up" size={11} /> Ready</b></p>
            </div>
          </article>
          <StatCard title="Open Staff Tasks" value={openStaffTasks.length} subtitle="Staff Task Management" icon="sparkle" tone="primary" />
          <StatCard title="Active Minibar Items" value={activeMinibarItems.length} subtitle="Minibar Management" icon="box" tone="soft" />
          <StatCard title="Pending Feedback" value={pendingFeedbacks.length} subtitle="Customer Feedback" icon="star" tone="pale" />
        </section>

        <section className="manager-card">
          <div className="manager-card-heading">
            <h2>Manager Screens</h2>
          </div>
          <div className="manager-screen-grid">
            <Link to="/manager/room-types"><Icon name="bed" /><strong>Room Types</strong><span>Template screen only. Backend is outside this scope.</span></Link>
            <Link to="/manager/staff-tasks"><Icon name="sparkle" /><strong>Staff Tasks</strong><span>Assign and monitor housekeeping or technical tasks.</span></Link>
            <Link to="/manager/minibar-items"><Icon name="box" /><strong>Minibar Items</strong><span>Maintain minibar item price, category, image, and stock status.</span></Link>
            <Link to="/manager/feedback"><Icon name="star" /><strong>Customer Feedback</strong><span>Review, respond to, and archive customer feedback.</span></Link>
          </div>
        </section>

        <section className="manager-card">
          <div className="manager-card-heading"><h2>Overall Rating</h2></div>
          <strong>{averageRating} / 5.0</strong>
          <p className="manager-muted">{feedbacks.length} feedback records</p>
        </section>
      </div>
    </ManagerShell>
  );
};

export default ManagerDashboardPage;
