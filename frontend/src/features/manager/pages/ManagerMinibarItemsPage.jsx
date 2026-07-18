import { useEffect, useMemo, useState } from 'react';
import { Search, Pencil, PackageCheck, PackageX, Plus, X } from 'lucide-react';
import { managerApi } from '../services/manager-api.js';
import './manager-operations.css';

const categories = ['Đồ uống', 'Đồ ăn nhẹ', 'Đồ cá nhân', 'Khác'];
const emptyForm = { name: '', category: categories[0], price: 0, quantity: 0, stock_status: 'in_stock', image_url: '', description: '' };
const stockLabels = { in_stock: 'Còn hàng', low_stock: 'Sắp hết', out_of_stock: 'Hết hàng' };
const stockTone = { in_stock: 'is-good', low_stock: 'is-warning', out_of_stock: 'is-danger' };

const getErrorMessage = (error) => error?.response?.data?.message || error.message || 'Đã có lỗi xảy ra';
const formatCurrency = (value) => Number(value || 0).toLocaleString('vi-VN');
const toForm = (item) => ({
  name: item.name || '',
  category: item.category || categories[0],
  price: item.price || 0,
  quantity: item.quantity ?? 0,
  stock_status: item.stock_status || 'in_stock',
  image_url: item.image_url || '',
  description: item.description || '',
});

const getQuantityPercent = (quantity = 0) => {
  const value = Number(quantity || 0);
  if (value <= 0) return 0;
  return Math.min(100, Math.max(10, value));
};

const ManagerMinibarItemsPage = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState('');
  const [mode, setMode] = useState('idle');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  const selectedItem = items.find((item) => item._id === selectedId);
  const isEditing = mode === 'edit' && selectedItem;
  const isCreating = mode === 'create';
  const isModalOpen = isCreating || isEditing;

  const loadItems = async (nextId = selectedId) => {
    const data = await managerApi.getMinibarItems();
    setItems(data);
    if (nextId) {
      const nextItem = data.find((item) => item._id === nextId);
      if (nextItem) {
        setSelectedId(nextItem._id);
        setForm(toForm(nextItem));
        setMode('edit');
      }
    }
  };

  useEffect(() => {
    loadItems('').catch((error) => setMessage(getErrorMessage(error)));
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const matchesKeyword = !keyword || [item.name, item.category, item.description]
        .some((value) => String(value || '').toLowerCase().includes(keyword));
      const matchesStock = !stockFilter || item.stock_status === stockFilter;
      return matchesKeyword && matchesStock;
    });
  }, [items, searchTerm, stockFilter]);

  const categoryStats = useMemo(() => {
    const total = items.length || 1;
    return categories.map((category) => {
      const count = items.filter((item) => item.category === category).length;
      return { category, count, percent: Math.round((count / total) * 100) };
    });
  }, [items]);

  const activeCount = items.filter((item) => item.is_active).length;
  const lowOrOutCount = items.filter((item) => item.stock_status !== 'in_stock' || Number(item.quantity || 0) <= 5).length;
  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const openEditModal = (item) => {
    setSelectedId(item._id);
    setForm(toForm(item));
    setMode('edit');
    setMessage('');
  };

  const openCreateModal = () => {
    setSelectedId('');
    setForm(emptyForm);
    setMode('create');
    setMessage('');
  };

  const closeModal = () => {
    setSelectedId('');
    setForm(emptyForm);
    setMode('idle');
  };

  const handleChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...form, price: Number(form.price), quantity: Number(form.quantity) };
      const saved = isEditing
        ? await managerApi.updateMinibarItem(selectedItem._id, payload)
        : await managerApi.createMinibarItem(payload);
      setMessage(isEditing ? 'Lưu thay đổi món minibar thành công.' : 'Tạo món minibar thành công.');
      await loadItems(saved._id);
      closeModal();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const handleDeactivate = async () => {
    if (!selectedItem) return;
    const item = await managerApi.deactivateMinibarItem(selectedItem._id);
    setMessage('Ngừng sử dụng món minibar thành công.');
    await loadItems(item._id);
    closeModal();
  };

  const handleActivate = async () => {
    if (!selectedItem) return;
    const item = await managerApi.activateMinibarItem(selectedItem._id);
    setMessage('Kích hoạt lại món minibar thành công.');
    await loadItems(item._id);
    closeModal();
  };

  return (
    <div className="manager-ops-page manager-figma-page">
      {message && <div className="manager-ops-message">{message}</div>}

      <section className="inventory-overview-grid">
        <article className="figma-card inventory-kpi-card">
          <span className="figma-eyebrow">Kho minibar</span>
          <h2>{items.length} món đang quản lý</h2>
          <p>{activeCount} món đang sử dụng, tổng số lượng hiện có là {totalQuantity} sản phẩm.</p>
          <p>{lowOrOutCount} món cần kiểm tra tồn kho.</p>
          <button className="manager-ops-button" onClick={openCreateModal} type="button"><Plus size={16} /> Thêm món</button>
        </article>

        <article className="figma-card stock-category-card">
          <div className="figma-card-heading">
            <h2>Danh mục tồn kho</h2>
            <span>...</span>
          </div>
          <div className="stock-category-bar" aria-label="Tỷ lệ danh mục minibar">
            {categoryStats.map((stat, index) => (
              <span key={stat.category} className={`stock-segment stock-segment-${index}`} style={{ flexGrow: Math.max(stat.count, 1) }} />
            ))}
          </div>
          <div className="stock-category-list">
            {categoryStats.map((stat, index) => (
              <div key={stat.category}>
                <span><i className={`stock-dot stock-segment-${index}`} />{stat.category}</span>
                <strong>{stat.percent}% ({stat.count} món)</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="figma-card inventory-table-card">
        <div className="inventory-toolbar">
          <label className="figma-search-box">
            <Search size={17} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm món, danh mục, mô tả..." />
          </label>
          <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}>
            <option value="">Tất cả tồn kho</option>
            <option value="in_stock">Còn hàng</option>
            <option value="low_stock">Sắp hết</option>
            <option value="out_of_stock">Hết hàng</option>
          </select>
        </div>

        <div className="manager-ops-table-wrap">
          <table className="manager-ops-table figma-inventory-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Món</th>
                <th>Danh mục</th>
                <th>Số lượng</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th>Giá</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length ? filteredItems.map((item) => (
                <tr className={`manager-ops-row ${selectedId === item._id ? 'is-selected' : ''}`} key={item._id} onClick={() => openEditModal(item)}>
                  <td>{item.image_url ? <img className="inventory-thumb" alt={item.name} src={item.image_url} /> : <span className="inventory-thumb is-empty"><PackageCheck size={18} /></span>}</td>
                  <td><strong>{item.name}</strong><small>{item.description || 'Chưa có mô tả'}</small></td>
                  <td>{item.category}</td>
                  <td><strong>{Number(item.quantity || 0)}</strong><small>sản phẩm</small></td>
                  <td>
                    <span className={`manager-ops-status ${stockTone[item.stock_status] || 'is-info'}`}>{stockLabels[item.stock_status] || item.stock_status}</span>
                    <div className="stock-progress"><span style={{ width: `${getQuantityPercent(item.quantity)}%` }} /></div>
                  </td>
                  <td><span className={`manager-ops-status ${item.is_active ? 'is-good' : 'is-muted'}`}>{item.is_active ? 'Đang sử dụng' : 'Ngừng sử dụng'}</span></td>
                  <td>{formatCurrency(item.price)} VND</td>
                  <td><button className="icon-action-button" type="button" onClick={(event) => { event.stopPropagation(); openEditModal(item); }}><Pencil size={16} /></button></td>
                </tr>
              )) : <tr><td className="manager-ops-empty" colSpan="8">Không tìm thấy món minibar phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="manager-modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <section className="manager-modal-card minibar-modal-card" role="dialog" aria-modal="true" aria-labelledby="minibar-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="manager-modal-heading">
              <div>
                <span className="figma-eyebrow">{isCreating ? 'Thêm món mới' : 'Chi tiết món minibar'}</span>
                <h2 id="minibar-modal-title">{isCreating ? 'Thêm món minibar' : selectedItem?.name}</h2>
                <p>{isEditing ? `${selectedItem.category} - ${formatCurrency(selectedItem.price)} VND` : 'Nhập thông tin món minibar mới.'}</p>
              </div>
              <button className="icon-action-button" type="button" onClick={closeModal}><X size={18} /></button>
            </div>

            <form className="manager-ops-form" onSubmit={handleSubmit}>
              <label>Tên món<input name="name" onChange={handleChange} required value={form.name} /></label>
              <label>Danh mục<select name="category" onChange={handleChange} value={form.category}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label>Giá<input min="0" name="price" onChange={handleChange} required type="number" value={form.price} /></label>
              <label>Số lượng<input min="0" name="quantity" onChange={handleChange} required step="1" type="number" value={form.quantity} /></label>
              <label>Tồn kho<select name="stock_status" onChange={handleChange} value={form.stock_status}><option value="in_stock">Còn hàng</option><option value="low_stock">Sắp hết</option><option value="out_of_stock">Hết hàng</option></select></label>
              <label className="manager-ops-wide">URL ảnh món<input name="image_url" onChange={handleChange} placeholder="https://example.com/minibar-item.jpg" type="url" value={form.image_url} /></label>
              {form.image_url && <div className="manager-ops-preview manager-ops-wide"><img alt={form.name || 'Minibar'} src={form.image_url} /></div>}
              <label className="manager-ops-wide">Mô tả<input name="description" onChange={handleChange} value={form.description} /></label>
              <div className="manager-ops-actions">
                <button className="manager-ops-button" type="submit">{isEditing ? 'Lưu thay đổi' : 'Tạo món'}</button>
                {isEditing && selectedItem?.is_active && <button className="manager-ops-danger" onClick={handleDeactivate} type="button"><PackageX size={15} /> Ngừng sử dụng</button>}
                {isEditing && !selectedItem?.is_active && <button className="manager-ops-secondary" onClick={handleActivate} type="button"><PackageCheck size={15} /> Kích hoạt lại</button>}
                <button className="manager-ops-secondary" onClick={closeModal} type="button">Đóng</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default ManagerMinibarItemsPage;
