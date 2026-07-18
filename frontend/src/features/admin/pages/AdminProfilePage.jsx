import { useState, useEffect } from 'react';
import { Shield, Mail, Key, Clock, MonitorSmartphone, MapPin, CheckCircle2, ChevronRight, Fingerprint, Activity, X, LogOut, CalendarDays, ShieldCheck } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';
import toast from 'react-hot-toast';
import '../styles/AdminStyles.css';

const AdminProfilePage = () => {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passData, setPassData] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUserAndSessions = async () => {
      try {
        const stored = localStorage.getItem('hotelify_user');
        if (stored) setUser(JSON.parse(stored));
        
        const res = await axiosClient.get('/auth/sessions');
        if (res.data?.data) {
          setSessions(res.data.data);
          if (res.data.current_session_id) {
            setCurrentSessionId(res.data.current_session_id);
          }
        }
      } catch (e) {}
    };
    fetchUserAndSessions();
  }, []);

  const parseUserAgent = (ua) => {
    if (!ua) return 'Unknown Device';
    let browser = 'Browser';
    let os = 'Unknown OS';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edge')) browser = 'Edge';
    if (ua.includes('Win')) os = 'Windows PC';
    else if (ua.includes('Mac')) os = 'Mac / iOS';
    else if (ua.includes('Android')) os = 'Android Device';
    else if (ua.includes('Linux')) os = 'Linux PC';
    return `${os} - ${browser}`;
  };

  const getTimeAgo = (dateStr) => {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const getInitials = (name) => {
    if (!name) return 'SA';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passData.new_password.length < 8) return toast.error('New password must be at least 8 characters long.');
    if (passData.new_password !== passData.confirm_password) return toast.error('Passwords do not match.');
    
    try {
      setIsSubmitting(true);
      const res = await axiosClient.patch('/auth/change-password', passData);
      toast.success(res.data?.message || 'Password updated successfully!');
      setShowPasswordModal(false);
      setPassData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch(e) {}
    localStorage.removeItem('hotelify_token');
    localStorage.removeItem('hotelify_user');
    window.location.href = '/login';
  };

  const handleRevoke = async (id) => {
    try {
      await axiosClient.post(`/auth/sessions/${id}/revoke`);
      setSessions(sessions.filter(s => s._id !== id));
      toast.success('Device logged out successfully');
    } catch(err) {
      toast.error('Failed to log out device');
    }
  };

  return (
    <div className="admin-content" style={{ backgroundColor: '#f4f7fe', boxSizing: 'border-box', overflow: 'visible', maxHeight: 'none' }}>
      <div className="admin-main-column" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '60px' }}>
        
        {/* Cover & Header Section */}
        <div style={{ 
          background: '#fff', borderRadius: '24px', overflow: 'hidden', 
          boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.08)', marginBottom: '32px', border: '1px solid #e2e8f0' 
        }}>
          {/* Cover */}
          <div style={{ 
            height: '220px', 
            background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', 
            position: 'relative',
            overflow: 'hidden'
          }}>
             {/* Decorative abstract elements */}
             <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(30px)' }}></div>
             <div style={{ position: 'absolute', bottom: '-50px', left: '10%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', filter: 'blur(20px)' }}></div>
             <img src="https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop" alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3, mixBlendMode: 'overlay' }} />
          </div>
          
          {/* Info Area */}
          <div style={{ padding: '0 40px 40px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {/* Avatar */}
              <div style={{ 
                marginTop: '-70px',
                width: '140px', height: '140px', borderRadius: '50%', background: '#fff', padding: '6px', 
                boxShadow: '0 12px 24px -8px rgba(0, 0, 0, 0.15)', zIndex: 2
              }}>
                <div style={{ 
                  width: '100%', height: '100%', borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #0f172a, #1e293b)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: '#fff', fontSize: '42px', fontWeight: '800', letterSpacing: '-1px'
                }}>
                  {getInitials(user?.full_name || 'System Admin')}
                </div>
              </div>
              
              {/* Right Action / Badge */}
              <div style={{ marginTop: '20px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', color: '#16a34a', padding: '8px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: '700', border: '1px solid #bbf7d0', boxShadow: '0 2px 4px rgba(22,163,74,0.05)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></div>
                  Active Account
                </span>
              </div>
            </div>

            {/* Text details */}
            <div style={{ marginTop: '16px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
                {user?.full_name || 'System Administrator'}
              </h1>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', color: '#64748b', fontSize: '15px', fontWeight: '500' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={18} color="#3b82f6" /> {user?.role?.name || 'System Administrator Level'}
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={18} color="#94a3b8" /> {user?.email || 'admin@hotelify.com'}
                </span>
              </div>
            </div>

          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '32px', alignItems: 'start' }}>
          
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Account Info Card */}
            <article style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                  <Fingerprint size={20} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Identity Details</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: '700', letterSpacing: '0.5px' }}>LOGIN ACCOUNT</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>
                    <Shield size={18} color="#94a3b8" /> {user?.login_account || 'admin'}
                  </div>
                </div>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: '700', letterSpacing: '0.5px' }}>EMAIL ADDRESS</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', color: '#1e293b', fontSize: '15px', wordBreak: 'break-all' }}>
                    <Mail size={18} color="#94a3b8" /> {user?.email || 'admin@hotelify.com'}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  style={{ 
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  padding: '16px', background: 'linear-gradient(to right, #0f172a, #1e293b)', color: '#fff', borderRadius: '16px',
                  fontWeight: '600', fontSize: '15px', border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px -10px rgba(15, 23, 42, 0.5)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 25px -10px rgba(15, 23, 42, 0.6)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 10px 20px -10px rgba(15, 23, 42, 0.5)'; }}
                >
                  <Key size={18} /> Update Password
                </button>

                <button 
                  onClick={handleLogout}
                  style={{ 
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  padding: '16px', background: '#fff', color: '#ef4444', borderRadius: '16px',
                  fontWeight: '600', fontSize: '15px', border: '1px solid #fecaca', cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#fef2f2'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#fff'; }}
                >
                  <LogOut size={18} /> Log Out
                </button>
              </div>
            </article>

            {/* Account Stats Card */}
            <article style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '24px' }}>Account Overview</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '20px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: '20px', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.1)' }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#166534', letterSpacing: '-0.5px' }}>Good</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#15803d', marginTop: '2px' }}>Security Status</div>
                  </div>
                </div>

                <div style={{ padding: '20px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '20px', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.1)' }}>
                    <MonitorSmartphone size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e40af', letterSpacing: '-0.5px' }}>{sessions.length}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1d4ed8', marginTop: '2px' }}>Active Devices</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <CalendarDays size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>Member Since</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', fontWeight: '500' }}>
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown Date'}
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <article style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                    <Activity size={20} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Active Sessions Log</h3>
                </div>
                <button style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View All <ChevronRight size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sessions.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                    No recent active sessions found.
                  </div>
                ) : sessions.map((s, i) => {
                  const isCurrent = currentSessionId ? s.session_id === currentSessionId : i === 0;
                  const deviceName = parseUserAgent(s.details);
                  return (
                    <div key={s._id || i} style={{ 
                      display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', 
                      background: isCurrent ? '#f8fafc' : '#fff', 
                      borderRadius: '20px', 
                      border: `1px solid ${isCurrent ? '#3b82f6' : '#e2e8f0'}`,
                      boxShadow: isCurrent ? '0 0 0 1px #3b82f6' : 'none',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseOver={e => { if(!isCurrent) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 20px -10px rgba(0,0,0,0.05)'; } }}
                    onMouseOut={e => { if(!isCurrent) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; } }}
                    >
                      <div style={{ 
                        width: '56px', height: '56px', borderRadius: '16px', 
                        background: isCurrent ? '#eff6ff' : '#f8fafc', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isCurrent ? '#3b82f6' : '#64748b'
                      }}>
                        <MonitorSmartphone size={26} strokeWidth={1.5} />
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <strong style={{ color: '#0f172a', fontSize: '16px', fontWeight: '700' }}>{deviceName}</strong>
                          {isCurrent && (
                            <span style={{ 
                              background: '#3b82f6', color: '#fff', fontSize: '12px', 
                              padding: '4px 12px', borderRadius: '12px', fontWeight: '700',
                              boxShadow: '0 4px 10px -2px rgba(59, 130, 246, 0.5)'
                            }}>
                              Current Session
                            </span>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '20px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={15} /> Unknown Location
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Shield size={15} /> IP: {s.ip_address}
                          </span>
                          {!isCurrent && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', color: '#94a3b8' }}>
                              <Clock size={15} /> {getTimeAgo(s.createdAt)}
                            </span>
                          )}
                        </div>
                        
                        {!isCurrent && (
                          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleRevoke(s._id); }}
                              style={{ 
                                padding: '6px 12px', background: '#fff', border: '1px solid #fecaca', 
                                borderRadius: '8px', color: '#ef4444', fontSize: '13px', fontWeight: '600',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={e => e.currentTarget.style.background = '#fef2f2'}
                              onMouseOut={e => e.currentTarget.style.background = '#fff'}
                            >
                              <LogOut size={14} /> Log Out Device
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>

        </div>
      </div>

      {showPasswordModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <form onSubmit={handlePasswordSubmit} style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '440px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={20} color="#3b82f6" /> Update Password
              </h2>
              <button type="button" onClick={() => setShowPasswordModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Current Password</label>
                <input type="password" required value={passData.current_password} onChange={e => setPassData({...passData, current_password: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>New Password</label>
                <input type="password" required minLength={8} value={passData.new_password} onChange={e => setPassData({...passData, new_password: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Confirm New Password</label>
                <input type="password" required minLength={8} value={passData.confirm_password} onChange={e => setPassData({...passData, confirm_password: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px' }} />
              </div>
            </div>
            <div style={{ padding: '24px 32px', background: '#f8fafc', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowPasswordModal(false)} style={{ padding: '10px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={isSubmitting} style={{ padding: '10px 24px', background: '#3b82f6', border: 'none', borderRadius: '12px', fontWeight: '600', color: '#fff', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminProfilePage;
