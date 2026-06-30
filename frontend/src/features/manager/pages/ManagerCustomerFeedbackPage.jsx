import { useEffect, useState } from 'react';

import {
  archiveCustomerFeedback,
  getCustomerFeedbacks,
  respondCustomerFeedback
} from '../api/managerApi.js';
import ManagerShell from '../components/ManagerShell.jsx';

const getErrorMessage = (error) => error?.response?.data?.message || error.message || 'Something went wrong';
const formatDate = (value) => (value ? new Intl.DateTimeFormat('en').format(new Date(value)) : '-');

const ManagerCustomerFeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState('');
  const [responseText, setResponseText] = useState('');
  const [message, setMessage] = useState('');

  const selectedFeedback = feedbacks.find((feedback) => feedback._id === selectedFeedbackId);

  const loadFeedbacks = async (nextSelectedId = selectedFeedbackId) => {
    const data = await getCustomerFeedbacks();
    setFeedbacks(data);

    if (nextSelectedId) {
      const nextFeedback = data.find((feedback) => feedback._id === nextSelectedId);

      if (nextFeedback) {
        setSelectedFeedbackId(nextFeedback._id);
        setResponseText(nextFeedback.response_text || '');
      }
    }
  };

  useEffect(() => {
    loadFeedbacks('').catch((error) => setMessage(getErrorMessage(error)));
  }, []);

  const handleSelect = (feedback) => {
    setSelectedFeedbackId(feedback._id);
    setResponseText(feedback.response_text || '');
    setMessage('');
  };

  const handleRespond = async (event) => {
    event.preventDefault();

    if (!selectedFeedback) {
      setMessage('Please select a feedback before responding.');
      return;
    }

    try {
      const respondedFeedback = await respondCustomerFeedback(selectedFeedback._id, responseText);
      setMessage('Customer feedback responded successfully.');
      await loadFeedbacks(respondedFeedback._id);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const handleArchive = async () => {
    if (!selectedFeedback) return;

    try {
      const archivedFeedback = await archiveCustomerFeedback(selectedFeedback._id);
      setMessage('Customer feedback archived successfully.');
      await loadFeedbacks(archivedFeedback._id);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  return (
    <ManagerShell title="Customer Feedback Management">
      <div className="manager-main-column">
        {message ? <div className="manager-message">{message}</div> : null}

        <section className="manager-grid manager-two-column">
          <article className="manager-card">
            <div className="manager-card-heading">
              <div>
                <h2>Feedback List</h2>
                <p className="manager-muted">Click a feedback to view details and write a manager response.</p>
              </div>
              <span className="manager-muted">{feedbacks.length} records</span>
            </div>
            <div className="manager-table-wrap">
              <table>
                <thead><tr><th>Customer</th><th>Rating</th><th>Feedback</th><th>Status</th></tr></thead>
                <tbody>
                  {feedbacks.length ? feedbacks.map((feedback) => (
                    <tr className={`manager-clickable-row ${selectedFeedbackId === feedback._id ? 'is-selected' : ''}`} key={feedback._id} onClick={() => handleSelect(feedback)}>
                      <td><strong>{feedback.customer_name || 'Customer'}</strong><small>{feedback.customer_email || `Room ${feedback.room_number || '-'}`}</small></td>
                      <td>{feedback.rating}/5</td>
                      <td><strong>{feedback.feedback_text}</strong><small>{formatDate(feedback.submitted_at || feedback.createdAt)}</small></td>
                      <td><span className={`manager-status ${feedback.status}`}>{feedback.status}</span></td>
                    </tr>
                  )) : <tr><td className="manager-empty-cell" colSpan="4">No customer feedback yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </article>

          <article className="manager-card">
            <div className="manager-card-heading">
              <div>
                <h2>Manager Response</h2>
                <p className="manager-muted">{selectedFeedback ? 'Review the selected feedback and send an official response.' : 'Select one feedback from the list first.'}</p>
              </div>
            </div>

            {selectedFeedback ? (
              <form className="manager-form-grid" onSubmit={handleRespond}>
                <div className="manager-feedback-summary manager-form-wide">
                  <span>{selectedFeedback.customer_name || 'Customer'} - Room {selectedFeedback.room_number || '-'}</span>
                  <strong>{selectedFeedback.rating}/5</strong>
                  <p>{selectedFeedback.feedback_text}</p>
                  <small>Submitted: {formatDate(selectedFeedback.submitted_at || selectedFeedback.createdAt)}</small>
                </div>
                <label className="manager-form-wide">
                  Manager Response
                  <textarea onChange={(event) => setResponseText(event.target.value)} required rows="7" value={responseText} />
                </label>
                <div className="manager-form-actions">
                  <button className="manager-primary-button" type="submit">Send Response</button>
                  <button className="manager-row-action danger" onClick={handleArchive} type="button">Archive</button>
                </div>
              </form>
            ) : (
              <div className="manager-detail-empty">Manager response form will appear here after you select a feedback.</div>
            )}
          </article>
        </section>
      </div>
    </ManagerShell>
  );
};

export default ManagerCustomerFeedbackPage;
