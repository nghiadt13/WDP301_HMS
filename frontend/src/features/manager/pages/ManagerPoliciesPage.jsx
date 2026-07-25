import { useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import { managerApi } from '../services/manager-api.js';
import './manager-operations.css';

const POLICY_CATEGORY_OPTIONS = ['Lưu trú', 'Thanh toán', 'Đặt phòng', 'Chăm sóc khách hàng'];

const createEmptyForm = (displayOrder = 1) => ({
  title: '',
  category: 'Lưu trú',
  content: '',
  display_order: displayOrder,
  is_active: true,
});

const emptyForm = createEmptyForm();

const getErrorMessage = (error) => error?.response?.data?.message || error.message || 'Đã có lỗi xảy ra';

const toForm = (policy) => ({
  title: policy.title || '',
  category: policy.category || 'Lưu trú',
  content: policy.content || '',
  display_order: policy.display_order ?? policy.displayOrder ?? 999,
  is_active: policy.is_active !== false,
});

const getDefaultDisplayOrder = (policies) => {
  return policies.reduce((maxOrder, policy) => Math.max(maxOrder, Number(policy.display_order ?? policy.displayOrder ?? 0)), 0) + 1;
};

const ManagerPoliciesPage = () => {
  const [policies, setPolicies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadPolicies = async () => {
    const data = await managerApi.getPolicies();
    setPolicies(data);
  };

  useEffect(() => {
    loadPolicies().catch((error) => setMessage(getErrorMessage(error)));
  }, []);

  const filteredPolicies = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const matchedPolicies = keyword
      ? policies.filter((policy) =>
          [policy.title, policy.category, policy.content].some((value) => String(value || '').toLowerCase().includes(keyword))
        )
      : policies;

    return [...matchedPolicies].sort((first, second) => {
      const firstOrder = Number(first.display_order ?? first.displayOrder ?? 999);
      const secondOrder = Number(second.display_order ?? second.displayOrder ?? 999);
      if (firstOrder !== secondOrder) return firstOrder - secondOrder;
      return new Date(first.createdAt || 0) - new Date(second.createdAt || 0);
    });
  }, [policies, searchTerm]);

  const openCreateModal = () => {
    setEditingId('');
    setForm(createEmptyForm(getDefaultDisplayOrder(policies)));
    setIsModalOpen(true);
    setMessage('');
  };

  const openEditModal = (policy) => {
    setEditingId(policy._id);
    setForm(toForm(policy));
    setIsModalOpen(true);
    setMessage('');
  };

  const closeModal = () => {
    setEditingId('');
    setForm(emptyForm);
    setIsModalOpen(false);
  };

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...form, display_order: Number(form.display_order || 999) };
      if (editingId) {
        await managerApi.updatePolicy(editingId, payload);
      } else {
        await managerApi.createPolicy(payload);
      }
      setMessage(editingId ? 'Cập nhật chính sách thành công.' : 'Thêm chính sách thành công.');
      await loadPolicies();
      closeModal();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const handleDelete = async (policyId) => {
    try {
      await managerApi.deletePolicy(policyId);
      setMessage('Xóa chính sách thành công.');
      await loadPolicies();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  return (
    <div className="manager-ops-page manager-figma-page policy-page">
      {message ? <div className="manager-ops-message">{message}</div> : null}

      <section className="figma-card policy-hero-card">
        <div>
          <span className="figma-eyebrow">Manage Policy</span>
          <h2>Quản lý chính sách khách sạn</h2>
          <p>Manager tạo và cập nhật các chính sách hiển thị cho khách hàng trước khi đặt phòng.</p>
        </div>
        <button className="manager-ops-button" type="button" onClick={openCreateModal}>
          <Plus size={16} /> Thêm chính sách
        </button>
      </section>

      <section className="figma-card inventory-table-card">
        <div className="inventory-toolbar">
          <label className="figma-search-box">
            <Search size={17} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm chính sách..." />
          </label>
        </div>

        <div className="policy-list">
          {filteredPolicies.map((policy) => (
            <article className="policy-card" key={policy._id}>
              <div>
                <div className="policy-meta">
                  <span className="manager-ops-status is-info">{policy.category}</span>
                  <span className={`manager-ops-status ${policy.is_active === false ? 'is-danger' : 'is-success'}`}>
                    {policy.is_active === false ? 'Đang ẩn' : 'Đang hiển thị'}
                  </span>
                </div>
                <h3>{policy.title}</h3>
                <p>{policy.content}</p>
              </div>
              <div className="policy-actions">
                <button className="icon-action-button" type="button" onClick={() => openEditModal(policy)} aria-label="Sửa chính sách">
                  <Edit3 size={16} />
                </button>
                <button className="icon-action-button" type="button" onClick={() => handleDelete(policy._id)} aria-label="Xóa chính sách">
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
          {filteredPolicies.length === 0 ? <div className="manager-ops-empty">Chưa có chính sách phù hợp.</div> : null}
        </div>
      </section>

      {isModalOpen ? (
        <div className="manager-modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <section className="manager-modal-card" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="manager-modal-heading">
              <div>
                <span className="figma-eyebrow">Chính sách khách sạn</span>
                <h2>{editingId ? 'Cập nhật chính sách' : 'Thêm chính sách mới'}</h2>
              </div>
              <button className="icon-action-button" type="button" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <form className="manager-ops-form" onSubmit={handleSubmit}>
              <label>Tiêu đề<input name="title" onChange={handleChange} required value={form.title} /></label>
              <label>
                Nhóm chính sách
                <select name="category" onChange={handleChange} required value={form.category}>
                  {POLICY_CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="policy-checkbox"><input checked={form.is_active} name="is_active" onChange={handleChange} type="checkbox" /> Hiển thị cho khách hàng</label>
              <label className="manager-ops-wide">Nội dung<textarea name="content" onChange={handleChange} required rows="5" value={form.content} /></label>
              <div className="manager-ops-actions">
                <button className="manager-ops-button" type="submit">{editingId ? 'Lưu thay đổi' : 'Tạo chính sách'}</button>
                <button className="manager-ops-secondary" type="button" onClick={closeModal}>Đóng</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default ManagerPoliciesPage;
