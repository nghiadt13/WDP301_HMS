import { useEffect, useState } from 'react';

import {
  createMinibarItem,
  deactivateMinibarItem,
  getMinibarItems,
  updateMinibarItem
} from '../api/managerApi.js';
import ManagerShell from '../components/ManagerShell.jsx';

const emptyForm = {
  name: '',
  category: 'Drink',
  price: 0,
  stock_status: 'in_stock',
  image_url: '',
  description: ''
};

const getErrorMessage = (error) => error?.response?.data?.message || error.message || 'Something went wrong';
const formatCurrency = (value) => Number(value || 0).toLocaleString('vi-VN');

const toItemForm = (item) => ({
  name: item.name || '',
  category: item.category || 'Drink',
  price: item.price || 0,
  stock_status: item.stock_status || 'in_stock',
  image_url: item.image_url || '',
  description: item.description || ''
});

const ManagerMinibarItemsPage = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [mode, setMode] = useState('idle');
  const [message, setMessage] = useState('');

  const selectedItem = items.find((item) => item._id === selectedItemId);
  const isEditing = mode === 'edit' && selectedItem;
  const isCreating = mode === 'create';

  const loadItems = async (nextSelectedId = selectedItemId) => {
    const data = await getMinibarItems();
    setItems(data);

    if (nextSelectedId) {
      const nextItem = data.find((item) => item._id === nextSelectedId);

      if (nextItem) {
        setSelectedItemId(nextItem._id);
        setForm(toItemForm(nextItem));
        setMode('edit');
      }
    }
  };

  useEffect(() => {
    loadItems('').catch((error) => setMessage(getErrorMessage(error)));
  }, []);

  const handleSelect = (item) => {
    setSelectedItemId(item._id);
    setForm(toItemForm(item));
    setMode('edit');
    setMessage('');
  };

  const handleAdd = () => {
    setSelectedItemId('');
    setForm(emptyForm);
    setMode('create');
    setMessage('');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const validateForm = () => {
    if (!form.name.trim()) return 'Item name is required.';
    if (!form.category.trim()) return 'Category is required.';
    if (Number(form.price) < 0) return 'Price must be greater than or equal to 0.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    try {
      const payload = { ...form, price: Number(form.price) };

      if (isEditing) {
        const updatedItem = await updateMinibarItem(selectedItem._id, payload);
        setMessage('Minibar item updated successfully.');
        await loadItems(updatedItem._id);
        return;
      }

      const createdItem = await createMinibarItem(payload);
      setMessage('Minibar item created successfully.');
      await loadItems(createdItem._id);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const handleDeactivate = async () => {
    if (!selectedItem) return;
    const deactivatedItem = await deactivateMinibarItem(selectedItem._id);
    setMessage('Minibar item deactivated successfully.');
    await loadItems(deactivatedItem._id);
  };

  return (
    <ManagerShell title="Minibar Item Management">
      <div className="manager-main-column">
        {message ? <div className="manager-message">{message}</div> : null}

        <section className="manager-grid manager-two-column">
          <article className="manager-card">
            <div className="manager-card-heading">
              <div>
                <h2>Minibar Item List</h2>
                <p className="manager-muted">Click an item to view details, edit, or deactivate it.</p>
              </div>
              <button className="manager-primary-button" onClick={handleAdd} type="button">Add Item</button>
            </div>
            <div className="manager-table-wrap">
              <table>
                <thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Status</th></tr></thead>
                <tbody>
                  {items.length ? items.map((item) => (
                    <tr className={`manager-clickable-row ${selectedItemId === item._id ? 'is-selected' : ''}`} key={item._id} onClick={() => handleSelect(item)}>
                      <td><div className="manager-item-cell">{item.image_url ? <img alt={item.name} src={item.image_url} /> : <span className="manager-item-placeholder">No image</span>}<span><strong>{item.name}</strong><small>{item.description || 'No description'}</small></span></div></td>
                      <td>{item.category}</td>
                      <td>{formatCurrency(item.price)} VND</td>
                      <td><span className={`manager-status ${item.is_active ? 'active' : 'inactive'}`}>{item.is_active ? 'active' : 'inactive'}</span></td>
                    </tr>
                  )) : <tr><td className="manager-empty-cell" colSpan="4">No minibar items yet. Click Add Item to create one.</td></tr>}
                </tbody>
              </table>
            </div>
          </article>

          <article className="manager-card">
            <div className="manager-card-heading">
              <div>
                <h2>{isCreating ? 'Add Minibar Item' : isEditing ? 'Minibar Item Detail' : 'Select a Minibar Item'}</h2>
                <p className="manager-muted">{isEditing ? `${selectedItem.category} - ${formatCurrency(selectedItem.price)} VND` : 'Item details appear after selecting a row.'}</p>
              </div>
            </div>

            {isCreating || isEditing ? (
              <form className="manager-form-grid" onSubmit={handleSubmit}>
                <label>Item Name<input name="name" onChange={handleChange} required value={form.name} /></label>
                <label>Category<select name="category" onChange={handleChange} value={form.category}><option>Drink</option><option>Snack</option><option>Personal Care</option><option>Other</option></select></label>
                <label>Price<input min="0" name="price" onChange={handleChange} required type="number" value={form.price} /></label>
                <label>Stock Status<select name="stock_status" onChange={handleChange} value={form.stock_status}><option value="in_stock">In Stock</option><option value="low_stock">Low Stock</option><option value="out_of_stock">Out of Stock</option></select></label>
                <label className="manager-form-wide">Item Image URL<input name="image_url" onChange={handleChange} placeholder="https://example.com/minibar-item.jpg" type="url" value={form.image_url} /></label>
                {form.image_url ? <div className="manager-image-preview manager-form-wide"><img alt={form.name || 'Minibar item preview'} src={form.image_url} /></div> : null}
                <label className="manager-form-wide">Description<input name="description" onChange={handleChange} value={form.description} /></label>
                <div className="manager-form-actions">
                  <button className="manager-primary-button" type="submit">{isEditing ? 'Save Changes' : 'Create Item'}</button>
                  {isEditing ? <button className="manager-row-action danger" onClick={handleDeactivate} type="button">Deactivate</button> : null}
                </div>
              </form>
            ) : (
              <div className="manager-detail-empty">Select an item from the list or click Add Item.</div>
            )}
          </article>
        </section>
      </div>
    </ManagerShell>
  );
};

export default ManagerMinibarItemsPage;
