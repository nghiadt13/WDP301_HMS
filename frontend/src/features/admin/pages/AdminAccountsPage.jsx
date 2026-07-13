import { useState } from 'react';
import { Search, Plus, Edit, ShieldOff, Key, User, Mail, Shield, ShieldCheck, X } from 'lucide-react';
import { useAccounts, useCreateAccount, useUpdateAccount, useResetPassword, useRoles } from '../hooks/use-admin';
import '../styles/AdminStyles.css';

const AdminAccountsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const { data: accountsData, isLoading } = useAccounts({ page, limit: 10, keyword: search });
  const { data: rolesData } = useRoles();
  
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const resetMutation = useResetPassword();

  const [modalType, setModalType] = useState(null); // 'create', 'edit', 'reset'
  const [selectedAccount, setSelectedAccount] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    login_account: '',
    full_name: '',
    phone_number: '',
    role_id: '',
    status: 'active',
    password: ''
  });

  const [resetData, setResetData] = useState({
    new_password: ''
  });

  const accounts = accountsData?.items || [];
  const roles = rolesData?.items || [];

  const handleOpenModal = (type, account = null) => {
    setModalType(type);
    setSelectedAccount(account);
    if (type === 'create') {
      setFormData({
        email: '', login_account: '', full_name: '', phone_number: '', role_id: '', status: 'active', password: ''
      });
    } else if (type === 'edit') {
      setFormData({
        email: account.email,
        login_account: account.login_account,
        full_name: account.full_name,
        phone_number: account.phone_number || '',
        role_id: account.role_id?._id || '',
        status: account.status,
        password: ''
      });
    } else if (type === 'reset') {
      setResetData({ new_password: '' });
    }
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedAccount(null);
  };

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    if (modalType === 'edit') {
      const dataToSubmit = { ...formData };
      delete dataToSubmit.password; // Don't send password on edit
      updateMutation.mutate({ id: selectedAccount._id, data: dataToSubmit }, {
        onSuccess: handleCloseModal, onError: (e) => alert(e.response?.data?.message || e.message)
      });
    } else if (modalType === 'create') {
      createMutation.mutate(formData, {
        onSuccess: handleCloseModal
      });
    }
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    resetMutation.mutate({ id: selectedAccount._id, new_password: resetData.new_password }, {
      onSuccess: () => {
        alert('Password reset successfully!');
        handleCloseModal();
      }
    });
  };

  const handleToggleStatus = (account) => {
    const newStatus = account.status === 'active' ? 'inactive' : 'active';
    updateMutation.mutate({ id: account._id, data: { status: newStatus } });
  };

  return (
    <div className="admin-content">
      <div className="admin-main-column" style={{ minWidth: '100%' }}>
        <section className="admin-card admin-booking-card">
          <div className="admin-booking-heading">
            <h2>Internal Account List</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label className="admin-table-search">
                <Search size={16} />
                <input 
                  placeholder="Search name, email, login..." 
                  type="search" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <button 
                type="button" 
                onClick={() => handleOpenModal('create')}
                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                <Plus size={16} /> Add Account
              </button>
            </div>
          </div>
          
          <div className="admin-table-wrap">
            {isLoading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading accounts...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Account Info</th>
                    <th>Login Account</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc) => (
                    <tr key={acc._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={16} color="#64748b" />
                          </div>
                          <div>
                            <strong style={{ display: 'block', marginBottom: '2px' }}>{acc.full_name}</strong>
                            <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={12} /> {acc.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td><strong>{acc.login_account}</strong></td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', width: 'fit-content' }}>
                          <Shield size={14} color={acc.role_id?.name?.includes('Admin') ? '#ef4444' : '#3b82f6'} />
                          {acc.role_id?.name || 'No Role'}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-status ${acc.status === 'active' ? 'checked-in' : 'pending'}`}>
                          {acc.status.charAt(0).toUpperCase() + acc.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleOpenModal('edit', acc)} className="admin-icon-button" title="Edit Account"><Edit size={16}/></button>
                          <button onClick={() => handleOpenModal('reset', acc)} className="admin-icon-button" title="Reset Password"><Key size={16}/></button>
                          <button onClick={() => handleToggleStatus(acc)} className="admin-icon-button" title={acc.status === 'active' ? 'Deactivate' : 'Activate'}>
                            {acc.status === 'active' ? <ShieldOff size={16} color="#ef4444" /> : <ShieldCheck size={16} color="#10b981" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {accounts.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No accounts found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {/* CREATE/EDIT MODAL */}
      {(modalType === 'create' || modalType === 'edit') && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{modalType === 'create' ? 'Create New Account' : 'Edit Account'}</h3>
              <button type="button" onClick={handleCloseModal} className="admin-modal-close"><X size={20} /></button>
            </div>
            <form onSubmit={handleAccountSubmit} className="admin-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="admin-field">
                  <label>Full Name *</label>
                  <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
                </div>
                <div className="admin-field">
                  <label>Phone Number</label>
                  <input type="text" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
                </div>
                <div className="admin-field">
                  <label>Email *</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div className="admin-field">
                  <label>Login Account *</label>
                  <input type="text" value={formData.login_account} onChange={e => setFormData({...formData, login_account: e.target.value})} required />
                </div>
                
                <div className="admin-field">
                  <label>Role *</label>
                  <select value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})} required>
                    <option value="">-- Select Role --</option>
                    {roles.map(r => (
                      <option key={r._id} value={r._id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-field">
                  <label>Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              {modalType === 'create' && (
                <div className="admin-field" style={{ marginTop: '16px' }}>
                  <label>Password (Leave blank for default: admin@123)</label>
                  <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              )}

              <div className="admin-modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" onClick={handleCloseModal} className="admin-btn-secondary">Cancel</button>
                <button type="submit" className="admin-btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {modalType === 'create' ? 'Create Account' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {modalType === 'reset' && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '400px' }}>
            <div className="admin-modal-header">
              <h3>Reset Password</h3>
              <button type="button" onClick={handleCloseModal} className="admin-modal-close"><X size={20} /></button>
            </div>
            <form onSubmit={handleResetSubmit} className="admin-modal-body">
              <p style={{ marginBottom: '16px', fontSize: '14px', color: '#64748b' }}>
                Resetting password for <strong>{selectedAccount?.full_name}</strong> ({selectedAccount?.login_account}).
              </p>
              <div className="admin-field">
                <label>New Password * (Min 8 characters)</label>
                <input 
                  type="password" 
                  value={resetData.new_password} 
                  onChange={e => setResetData({ new_password: e.target.value })} 
                  required 
                  minLength={8}
                />
              </div>
              <div className="admin-modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" onClick={handleCloseModal} className="admin-btn-secondary">Cancel</button>
                <button type="submit" className="admin-btn-primary" style={{ background: '#ef4444' }} disabled={resetMutation.isPending}>
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAccountsPage;
