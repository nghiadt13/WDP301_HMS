import { useEffect, useState } from 'react';
import { managerApi } from '../services/manager-api.js';
import './manager-operations.css';

const categories = ['Đồ uống', 'Đồ ăn nhẹ', 'Đồ cá nhân', 'Khác'];
const emptyForm = { name: '', category: categories[0], price: 0, stock_status: 'in_stock', image_url: '', description: '' };
const stockLabels = { in_stock: 'Còn hàng', low_stock: 'Sắp hết', out_of_stock: 'Hết hàng' };
const getErrorMessage = (error) => error?.response?.data?.message || error.message || 'Đã có lỗi xảy ra';
const formatCurrency = (value) => Number(value || 0).toLocaleString('vi-VN');
const toForm = (item) => ({ name: item.name || '', category: item.category || categories[0], price: item.price || 0, stock_status: item.stock_status || 'in_stock', image_url: item.image_url || '', description: item.description || '' });

const ManagerMinibarItemsPage = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState('');
  const [mode, setMode] = useState('idle');
  const [message, setMessage] = useState('');
  const selectedItem = items.find((item) => item._id === selectedId);
  const isEditing = mode === 'edit' && selectedItem;
  const isCreating = mode === 'create';

  const loadItems = async (nextId = selectedId) => {
    const data = await managerApi.getMinibarItems();
    setItems(data);
    if (nextId) {
      const nextItem = data.find((item) => item._id === nextId);
      if (nextItem) { setSelectedId(nextItem._id); setForm(toForm(nextItem)); setMode('edit'); }
    }
  };

  useEffect(() => { loadItems('').catch((error) => setMessage(getErrorMessage(error))); }, []);
  const handleSelect = (item) => { setSelectedId(item._id); setForm(toForm(item)); setMode('edit'); setMessage(''); };
  const handleAdd = () => { setSelectedId(''); setForm(emptyForm); setMode('create'); setMessage(''); };
  const handleChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...form, price: Number(form.price) };
      const saved = isEditing ? await managerApi.updateMinibarItem(selectedItem._id, payload) : await managerApi.createMinibarItem(payload);
      setMessage(isEditing ? 'Lưu thay đổi món minibar thành công.' : 'Tạo món minibar thành công.');
      await loadItems(saved._id);
    } catch (error) { setMessage(getErrorMessage(error)); }
  };

  const handleDeactivate = async () => { if (!selectedItem) return; const item = await managerApi.deactivateMinibarItem(selectedItem._id); setMessage('Ngừng sử dụng món minibar thành công.'); await loadItems(item._id); };
  const handleActivate = async () => { if (!selectedItem) return; const item = await managerApi.activateMinibarItem(selectedItem._id); setMessage('Kích hoạt lại món minibar thành công.'); await loadItems(item._id); };

  return (
    <div className="manager-ops-page">
      {message && <div className="manager-ops-message">{message}</div>}
      <section className="manager-ops-grid">
        <article className="manager-ops-card">
          <div className="manager-ops-heading"><div><h2>Danh sách món minibar</h2><p>Quản lý tên món, danh mục, giá, hình ảnh và trạng thái tồn kho.</p></div><button className="manager-ops-button" onClick={handleAdd} type="button">Thêm món</button></div>
          <div className="manager-ops-table-wrap"><table className="manager-ops-table"><thead><tr><th>Món</th><th>Danh mục</th><th>Giá</th><th>Tồn kho</th><th>Trạng thái</th></tr></thead><tbody>{items.length ? items.map((item) => <tr className={`manager-ops-row ${selectedId === item._id ? 'is-selected' : ''}`} key={item._id} onClick={() => handleSelect(item)}><td><div className="manager-ops-item-cell">{item.image_url ? <img alt={item.name} src={item.image_url} /> : <span className="manager-ops-placeholder">No image</span>}<span><strong>{item.name}</strong><small>{item.description || 'Chưa có mô tả'}</small></span></div></td><td>{item.category}</td><td>{formatCurrency(item.price)} VND</td><td><span className="manager-ops-status is-info">{stockLabels[item.stock_status] || item.stock_status}</span></td><td><span className={`manager-ops-status ${item.is_active ? 'is-good' : 'is-muted'}`}>{item.is_active ? 'Đang sử dụng' : 'Ngừng sử dụng'}</span></td></tr>) : <tr><td className="manager-ops-empty" colSpan="5">Chưa có món minibar nào.</td></tr>}</tbody></table></div>
        </article>
        <article className="manager-ops-card">
          <div className="manager-ops-heading"><div><h2>{isCreating ? 'Thêm món minibar' : isEditing ? 'Chi tiết món minibar' : 'Chọn món minibar'}</h2><p>{isEditing ? `${selectedItem.category} - ${formatCurrency(selectedItem.price)} VND` : 'Chọn một dòng để xem chi tiết.'}</p></div></div>
          {isCreating || isEditing ? <form className="manager-ops-form" onSubmit={handleSubmit}><label>Tên món<input name="name" onChange={handleChange} required value={form.name} /></label><label>Danh mục<select name="category" onChange={handleChange} value={form.category}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Giá<input min="0" name="price" onChange={handleChange} required type="number" value={form.price} /></label><label>Tồn kho<select name="stock_status" onChange={handleChange} value={form.stock_status}><option value="in_stock">{stockLabels.in_stock}</option><option value="low_stock">{stockLabels.low_stock}</option><option value="out_of_stock">{stockLabels.out_of_stock}</option></select></label><label className="manager-ops-wide">URL ảnh món<input name="image_url" onChange={handleChange} placeholder="https://example.com/minibar-item.jpg" type="url" value={form.image_url} /></label>{form.image_url && <div className="manager-ops-preview manager-ops-wide"><img alt={form.name || 'Minibar'} src={form.image_url} /></div>}<label className="manager-ops-wide">Mô tả<input name="description" onChange={handleChange} value={form.description} /></label><div className="manager-ops-actions"><button className="manager-ops-button" type="submit">{isEditing ? 'Lưu thay đổi' : 'Tạo món'}</button>{isEditing && selectedItem?.is_active && <button className="manager-ops-danger" onClick={handleDeactivate} type="button">Ngừng sử dụng</button>}{isEditing && !selectedItem?.is_active && <button className="manager-ops-secondary" onClick={handleActivate} type="button">Kích hoạt lại</button>}</div></form> : <div className="manager-ops-detail-empty">Chọn món minibar hoặc nhấn Thêm món.</div>}
        </article>
      </section>
    </div>
  );
};

export default ManagerMinibarItemsPage;
