import { useState } from 'react';
import { Search, Plus, Edit, X, Shield, Settings, Check } from 'lucide-react';
import { useRoles, useCreateRole, useUpdateRole } from '../hooks/use-admin';
import '../styles/AdminStyles.css';

const AdminRolesPage = () => {
  const { data: rolesData, isLoading } = useRoles();
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    permission_sets: []
  });

  const roles = rolesData?.items || [];
  const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  const availablePermissions = [
    { id: 'admin:all', label: 'Full Admin Access' },
    { id: 'manager:rooms', label: 'Manage Rooms' },
    { id: 'manager:staff', label: 'Manage Staff' },
    { id: 'receptionist:booking', label: 'Manage Bookings' },
    { id: 'receptionist:checkin', label: 'Check-in/Check-out' }
  ];

  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || '',
        is_active: role.is_active,
        permission_sets: role.permission_sets || []
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        is_active: true,
        permission_sets: []
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingRole(null);
  };

  const handlePermissionToggle = (permId) => {
    setFormData(prev => ({
      ...prev,
      permission_sets: prev.permission_sets.includes(permId)
        ? prev.permission_sets.filter(p => p !== permId)
        : [...prev.permission_sets, permId]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingRole) {
      updateMutation.mutate({ id: editingRole._id, data: formData }, {
        onSuccess: handleCloseModal
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: handleCloseModal
      });
    }
  };

  return (
    <div className="admin-content">
      <div className="admin-main-column" style={{ minWidth: '100%' }}>
        <section className="admin-card admin-booking-card">
          <div className="admin-booking-heading">
            <h2>Role & Permissions</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label className="admin-table-search">
                <Search size={16} />
                <input 
                  placeholder="Search roles..." 
                  type="search" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <button 
                type="button" 
                onClick={() => handleOpenModal()}
                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                <Plus size={16} /> Create Role
              </button>
            </div>
          </div>
          
          <div className="admin-table-wrap">
            {isLoading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading roles...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Role Name</th>
                    <th>Description</th>
                    <th>Permissions</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((role) => (
                    <tr key={role._id}>
                      <td>
                        <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Shield size={14} style={{ color: '#2563eb' }} />
                          {role.name}
                        </strong>
                      </td>
                      <td>{role.description || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {role.permission_sets.map(perm => (
                            <span key={perm} style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid #e2e8f0' }}>
                              {perm}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`admin-status ${role.is_active ? 'checked-in' : 'pending'}`}>
                          {role.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleOpenModal(role)} className="admin-icon-button" title="Edit Role"><Edit size={16}/></button>
                          <button className="admin-icon-button" title="Settings"><Settings size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRoles.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No roles found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {modalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
              <button type="button" onClick={handleCloseModal} className="admin-modal-close"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="admin-modal-body">
              <div className="admin-field">
                <label>Role Name *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="admin-field">
                <label>Description</label>
                <input 
                  type="text" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              
              <div className="admin-field">
                <label>Status</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      checked={formData.is_active} 
                      onChange={() => setFormData({...formData, is_active: true})}
                    /> Active
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      checked={!formData.is_active} 
                      onChange={() => setFormData({...formData, is_active: false})}
                    /> Inactive
                  </label>
                </div>
              </div>

              <div className="admin-field">
                <label>Permissions</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                  {availablePermissions.map(perm => {
                    const isChecked = formData.permission_sets.includes(perm.id);
                    return (
                      <div 
                        key={perm.id}
                        onClick={() => handlePermissionToggle(perm.id)}
                        style={{ 
                          padding: '10px 12px', 
                          border: `1px solid ${isChecked ? '#3b82f6' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          background: isChecked ? '#eff6ff' : '#fff'
                        }}
                      >
                        <div style={{ 
                          width: '18px', height: '18px', 
                          borderRadius: '4px', 
                          border: `1px solid ${isChecked ? '#3b82f6' : '#cbd5e1'}`,
                          background: isChecked ? '#3b82f6' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {isChecked && <Check size={12} color="#fff" />}
                        </div>
                        <span style={{ fontSize: '13px', color: isChecked ? '#1e3a8a' : '#475569' }}>
                          {perm.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="admin-modal-actions">
                <button type="button" onClick={handleCloseModal} className="admin-btn-secondary">Cancel</button>
                <button type="submit" className="admin-btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingRole ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRolesPage;
