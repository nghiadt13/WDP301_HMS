import { useMemo } from 'react';

const HousekeepingMinibarPicker = ({
  items = [],
  value = [],
  onChange,
  disabled = false,
  isLoading = false,
  loadError = '',
  onRetry,
}) => {
  const normalizedItems = useMemo(() => items.map((item) => {
    const minibarItem = item?.item_id || {};
    const itemId = String(minibarItem?._id || item?._id || item?.id || '').trim();
    return {
      itemId,
      name: minibarItem?.name || item?.name || item?.item || 'Minibar item',
      category: minibarItem?.category || item?.category || '-',
      unitPrice: Number(minibarItem?.price ?? item?.price ?? 0),
      availableQty: Number(item?.availableQty ?? item?.quantity ?? item?.availableQuantity ?? 0),
    };
  }).filter((item) => item.itemId), [items]);

  const selectedMap = useMemo(() => new Map(value.map((entry) => [String(entry.item_id), entry])), [value]);

  const selectedTotal = useMemo(
    () => value.reduce((sum, entry) => sum + Number(entry.qty || 0) * Number(entry.price || 0), 0),
    [value]
  );

  const updateSelection = (item, nextQty) => {
    const qty = Math.max(0, Number(nextQty || 0));
    const existing = value.find((entry) => String(entry.item_id) === String(item.itemId));

    if (qty <= 0) {
      onChange(value.filter((entry) => String(entry.item_id) !== String(item.itemId)));
      return;
    }

    const nextEntry = {
      item_id: item.itemId,
      item: item.name,
      qty,
      price: item.unitPrice,
    };

    if (existing) {
      onChange(value.map((entry) => (String(entry.item_id) === String(item.itemId) ? nextEntry : entry)));
      return;
    }

    onChange([...value, nextEntry]);
  };

  if (isLoading) {
    return (
      <section className="housekeeping-task-detail-section">
        <h4>Minibar inspection</h4>
        <p>Loading minibar items...</p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="housekeeping-task-detail-section">
        <h4>Minibar inspection</h4>
        <p>Cannot load minibar items: {loadError}</p>
        {onRetry ? (
          <button type="button" className="housekeeping-outline-btn" onClick={onRetry}>
            Retry
          </button>
        ) : null}
      </section>
    );
  }

  if (!normalizedItems.length) {
    return (
      <section className="housekeeping-task-detail-section">
        <h4>Minibar inspection</h4>
        <p>No minibar items are configured for this hotel.</p>
      </section>
    );
  }

  return (
    <section className="housekeeping-task-detail-section">
      <div className="housekeeping-task-checklist-head">
        <h4>Minibar inspection</h4>
        <span>Total: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedTotal)}</span>
      </div>
      <p style={{ marginTop: 0, color: '#64748b' }}>
        Housekeeping enters only the consumed quantity. Item name and unit price are loaded from the hotel minibar catalog.
      </p>
      <div style={{ display: 'grid', gap: '12px' }}>
        {normalizedItems.map((item) => {
          const current = selectedMap.get(String(item.itemId));
          const currentQty = current?.qty || 0;
          const subtotal = currentQty * item.unitPrice;
          return (
            <label
              key={item.itemId}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 2fr) 120px 120px 140px 120px',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                background: currentQty > 0 ? '#eff6ff' : '#fff',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{item.category}</div>
              </div>
              <div style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.unitPrice)}
              </div>
              <input
                type="number"
                min="0"
                step="1"
                value={currentQty}
                disabled={disabled}
                onChange={(event) => updateSelection(item, event.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: disabled ? '#f8fafc' : '#fff',
                }}
              />
              <div style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
};

export default HousekeepingMinibarPicker;
