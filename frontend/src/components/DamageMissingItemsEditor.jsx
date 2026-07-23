import { Plus, Trash2 } from 'lucide-react';
import ImageUploadField from './ImageUploadField.jsx';

const createClientId = () => `damage-item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const createDamageMissingItem = (type = 'damaged') => ({
  client_id: createClientId(),
  name: '',
  type,
  description: '',
  estimated_compensation_amount: '',
  approved_compensation_amount: '',
  photos: [],
});

export const withDamageMissingItemClientId = (item = {}, fallbackType = 'damaged') => ({
  ...item,
  client_id: item?.client_id || createClientId(),
  type: item?.type || fallbackType,
  photos: Array.isArray(item?.photos) ? item.photos : [],
});

function DamageMissingItemsEditor({
  title = 'Damage & Missing Items',
  description = '',
  value = [],
  onChange,
  showApprovedAmount = false,
  disabled = false,
  renderImageUrl,
}) {
  const items = Array.isArray(value) ? value : [];

  const updateItem = (index, patch) => {
    const nextItems = items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
    onChange?.(nextItems);
  };

  const addItem = () => {
    onChange?.([...items, createDamageMissingItem('damaged')]);
  };

  const removeItem = (index) => {
    onChange?.(items.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <section style={{ display: 'grid', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
        <div>
          <h4 style={{ margin: 0, color: '#0f172a' }}>{title}</h4>
          {description ? <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}>{description}</p> : null}
        </div>
        <button
          type="button"
          onClick={addItem}
          disabled={disabled}
          style={{
            height: '40px',
            padding: '0 14px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#0f172a',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <Plus size={16} />
          Add item
        </button>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: '16px', borderRadius: '14px', background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '13px' }}>
          No damage or missing items added.
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: '16px' }}>
        {items.map((item, index) => (
          <article key={item.client_id || `item-${index}`} style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'grid', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <strong style={{ color: '#0f172a' }}>Item {index + 1}</strong>
              <button
                type="button"
                onClick={() => removeItem(index)}
                disabled={disabled}
                style={{ border: 'none', background: '#fef2f2', color: '#dc2626', width: '34px', height: '34px', borderRadius: '10px', display: 'grid', placeItems: 'center', cursor: disabled ? 'not-allowed' : 'pointer' }}
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <label style={{ display: 'grid', gap: '6px', fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                <span>Item name</span>
                <input
                  value={item.name || ''}
                  onChange={(event) => updateItem(index, { name: event.target.value })}
                  disabled={disabled}
                  placeholder="e.g. Bath towel, bedside lamp"
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1' }}
                />
              </label>

              <label style={{ display: 'grid', gap: '6px', fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                <span>Type</span>
                <select
                  value={item.type || 'damaged'}
                  onChange={(event) => updateItem(index, { type: event.target.value, photos: event.target.value === 'missing' ? [] : item.photos || [] })}
                  disabled={disabled}
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff' }}
                >
                  <option value="damaged">Damaged</option>
                  <option value="missing">Missing</option>
                </select>
              </label>

              <label style={{ display: 'grid', gap: '6px', fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                <span>Estimated compensation</span>
                <input
                  type="number"
                  min="0"
                  value={item.estimated_compensation_amount ?? ''}
                  onChange={(event) => updateItem(index, { estimated_compensation_amount: event.target.value })}
                  disabled={disabled}
                  placeholder="Optional"
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1' }}
                />
              </label>

              {showApprovedAmount ? (
                <label style={{ display: 'grid', gap: '6px', fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                  <span>Approved compensation</span>
                  <input
                    type="number"
                    min="0"
                    value={item.approved_compensation_amount ?? ''}
                    onChange={(event) => updateItem(index, { approved_compensation_amount: event.target.value })}
                    disabled={disabled}
                    placeholder="Approved amount"
                    style={{ width: '100%', padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1' }}
                  />
                </label>
              ) : null}
            </div>

            <label style={{ display: 'grid', gap: '6px', fontSize: '13px', color: '#334155', fontWeight: 600 }}>
              <span>Description</span>
              <textarea
                value={item.description || ''}
                onChange={(event) => updateItem(index, { description: event.target.value, note: event.target.value })}
                disabled={disabled}
                rows={3}
                placeholder="Describe the condition or what is missing"
                style={{ width: '100%', padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', resize: 'vertical' }}
              />
            </label>

            <ImageUploadField
              label="Photo evidence"
              helperText="Optional photo evidence."
              value={Array.isArray(item.photos) ? item.photos : []}
              onChange={(photos) => updateItem(index, { photos })}
              disabled={disabled}
              renderImageUrl={renderImageUrl}
              buttonLabel="Upload photos"
              emptyStateLabel="No evidence photos uploaded."
            />
          </article>
        ))}
      </div>
    </section>
  );
}

export default DamageMissingItemsEditor;