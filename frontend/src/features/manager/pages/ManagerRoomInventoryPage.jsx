import { useEffect, useMemo, useState } from 'react';
import { Search, Pencil, PackageCheck, PackageX, Plus, X } from 'lucide-react';
import { managerApi } from '../services/manager-api.js';
import './manager-operations.css';
const resolveInventoryImageUrl = (url) => {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) return value;

  const apiUrl = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:9999/api`;
  const origin = apiUrl.replace(/\/api\/?$/i, '');
  return `${origin}${value.startsWith('/') ? value : `/${value}`}`;
};

const categories = ['Đồ uống', 'Đồ ăn nhẹ', 'Đồ dùng phòng tắm', 'Tiện ích phòng', 'Đồ cá nhân', 'Khác'];
const emptyForm = { name: '', category: categories[0], price: 0, quantity: 0, stock_status: 'in_stock', image_url: '', description: '' };
const stockLabels = { in_stock: 'Còn hàng', low_stock: 'Sắp hết', out_of_stock: 'Hết hàng' };
const stockTone = { in_stock: 'is-good', low_stock: 'is-warning', out_of_stock: 'is-danger' };
const LOW_STOCK_THRESHOLD = 10;

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

const getStockStatusFromQuantity = (quantity) => {
  const value = Number(quantity);
  if (!Number.isInteger(value) || value < 0) return '';
  if (value === 0) return 'out_of_stock';
  if (value <= LOW_STOCK_THRESHOLD) return 'low_stock';
  return 'in_stock';
};

const ManagerRoomInventoryPage = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState('');
  const [mode, setMode] = useState('idle');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState('');

  const selectedItem = items.find((item) => item._id === selectedId);
  const isEditing = mode === 'edit' && selectedItem;
  const isCreating = mode === 'create';
  const isModalOpen = isCreating || isEditing;

  const loadItems = async (nextId = selectedId) => {
    const data = await managerApi.getRoomInventoryItems();
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
    setImageFile(null);
    setImageError('');
  };

  const openCreateModal = () => {
    setSelectedId('');
    setForm(emptyForm);
    setMode('create');
    setMessage('');
    setImageFile(null);
    setImageError('');
  };

  const closeModal = () => {
    setSelectedId('');
    setForm(emptyForm);
    setMode('idle');
    setImageFile(null);
    setImageError('');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === 'quantity') next.stock_status = getStockStatusFromQuantity(value) || current.stock_status;
      return next;
    });
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0];
    setImageError('');
    setImageFile(null);
    if (!file) return;
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!acceptedTypes.includes(file.type)) {
      setImageError('Ảnh phải có định dạng JPG, PNG hoặc WebP.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Ảnh không được vượt quá 5 MB.');
      event.target.value = '';
      return;
    }
    setImageFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const quantity = Number(form.quantity);
      const calculatedStatus = getStockStatusFromQuantity(quantity);
      if (!Number.isInteger(quantity) || quantity < 0) throw new Error('Số lượng phải là số nguyên không âm.');
      if (!imageFile) throw new Error('Vui lòng tải lên ảnh vật tư JPG, PNG hoặc WebP.');
      const imageUrl = await managerApi.uploadRoomInventoryImage(imageFile);
      const payload = { ...form, image_url: imageUrl, price: Number(form.price), quantity, stock_status: calculatedStatus };
      const saved = isEditing
        ? await managerApi.updateRoomInventoryItem(selectedItem._id, payload)
        : await managerApi.createRoomInventoryItem(payload);
      setMessage(isEditing ? 'Lưu thay đổi vật tư phòng thành công.' : 'Tạo vật tư phòng thành công.');
      await loadItems(saved._id);
      closeModal();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const handleDeactivate = async () => {
    if (!selectedItem) return;
    const item = await managerApi.deactivateRoomInventoryItem(selectedItem._id);
    setMessage('Ngừng sử dụng vật tư phòng thành công.');
    await loadItems(item._id);
    closeModal();
  };

  const handleActivate = async () => {
    if (!selectedItem) return;
    const item = await managerApi.activateRoomInventoryItem(selectedItem._id);
    setMessage('Kích hoạt lại vật tư phòng thành công.');
    await loadItems(item._id);
    closeModal();
  };

  return (
    <div className="manager-ops-page manager-figma-page">
      {message && <div className="manager-ops-message">{message}</div>}

      <section className="inventory-overview-grid">
        <article className="figma-card inventory-kpi-card">
          <span className="figma-eyebrow">Kho vật tư phòng</span>
          <h2>{items.length} vật tư đang quản lý</h2>
          <p>{activeCount} vật tư đang sử dụng, tổng số lượng hiện có là {totalQuantity} sản phẩm.</p>
          <p>{lowOrOutCount} vật tư cần kiểm tra tồn kho.</p>
          <button className="manager-ops-button" onClick={openCreateModal} type="button"><Plus size={16} /> Thêm vật tư</button>
        </article>

        <article className="figma-card stock-category-card">
          <div className="figma-card-heading">
            <h2>Danh mục tồn kho</h2>
            <span>...</span>
          </div>
          <div className="stock-category-bar" aria-label="Tỷ lệ danh mục vật tư phòng">
            {categoryStats.map((stat, index) => (
              <span key={stat.category} className={`stock-segment stock-segment-${index}`} style={{ flexGrow: Math.max(stat.count, 1) }} />
            ))}
          </div>
          <div className="stock-category-list">
            {categoryStats.map((stat, index) => (
              <div key={stat.category}>
                <span><i className={`stock-dot stock-segment-${index}`} />{stat.category}</span>
                <strong>{stat.percent}% ({stat.count} vật tư)</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="figma-card inventory-table-card">
        <div className="inventory-toolbar">
          <label className="figma-search-box">
            <Search size={17} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm vật tư, danh mục, mô tả..." />
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
                <th>Vật tư</th>
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
                  <td>{item.image_url ? <img className="inventory-thumb" alt={item.name} src={resolveInventoryImageUrl(item.image_url)} /> : <span className="inventory-thumb is-empty"><PackageCheck size={18} /></span>}</td>
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
              )) : <tr><td className="manager-ops-empty" colSpan="8">Không tìm thấy vật tư phòng phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="manager-modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <section className="manager-modal-card room-inventory-modal-card" role="dialog" aria-modal="true" aria-labelledby="room-inventory-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="manager-modal-heading">
              <div>
                <span className="figma-eyebrow">{isCreating ? 'Thêm vật tư mới' : 'Chi tiết vật tư phòng'}</span>
                <h2 id="room-inventory-modal-title">{isCreating ? 'Thêm vật tư phòng' : selectedItem?.name}</h2>
                <p>{isEditing ? `${selectedItem.category} - ${formatCurrency(selectedItem.price)} VND` : 'Nhập thông tin vật tư phòng mới.'}</p>
              </div>
              <button className="icon-action-button" type="button" onClick={closeModal}><X size={18} /></button>
            </div>

            <form className="manager-ops-form" onSubmit={handleSubmit}>
              <label>Tên vật tư<input name="name" onChange={handleChange} required value={form.name} /></label>
              <label>Danh mục<select name="category" onChange={handleChange} value={form.category}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label>Giá<input min="0" name="price" onChange={handleChange} required type="number" value={form.price} /></label>
              <label>Số lượng<input min="0" name="quantity" onChange={handleChange} required step="1" type="number" value={form.quantity} /></label>
              <label>Tồn kho<input aria-label="Tồn kho được tính tự động" disabled value={stockLabels[getStockStatusFromQuantity(form.quantity)] || 'Nhập số lượng hợp lệ'} /></label>
              <label className="manager-ops-wide">Tải ảnh vật tư<input accept="image/jpeg,image/png,image/webp" onChange={handleImageFileChange} required type="file" />{imageFile && <small>Đã chọn: {imageFile.name}</small>}<small>Chỉ nhận JPG, PNG hoặc WebP; dung lượng tối đa 5 MB.</small>{imageError && <small className="manager-ops-field-error">{imageError}</small>}</label>
              {isEditing && selectedItem?.image_url && <div className="manager-ops-preview manager-ops-wide"><img alt={form.name || 'Vật tư phòng'} src={resolveInventoryImageUrl(selectedItem.image_url)} /><small>Chọn ảnh mới để thay thế ảnh hiện tại.</small></div>}
              <label className="manager-ops-wide">Mô tả<input name="description" onChange={handleChange} value={form.description} /></label>
              <div className="manager-ops-actions">
                <button className="manager-ops-button" type="submit">{isEditing ? 'Lưu thay đổi' : 'Tạo vật tư'}</button>
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

export default ManagerRoomInventoryPage;

