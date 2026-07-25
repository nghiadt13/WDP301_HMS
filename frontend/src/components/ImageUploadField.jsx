import { useRef, useState } from 'react';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { uploadApi } from '@/features/manager/services/room-api';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const normalizeUrls = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    const value = String(item || '').trim();
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

const getFileSignature = (file) => `${String(file?.name || '').toLowerCase()}::${file?.size || 0}::${file?.lastModified || 0}`;

const validateImageFiles = (files, maxFiles, existingCount) => {
  const errors = [];
  const validFiles = [];
  const seen = new Set();

  if (existingCount + files.length > maxFiles) {
    errors.push(`You can upload up to ${maxFiles} images.`);
    return { errors, validFiles };
  }

  files.forEach((file) => {
    const signature = getFileSignature(file);
    if (seen.has(signature)) {
      errors.push(`Duplicate file skipped: ${file.name}`);
      return;
    }
    seen.add(signature);

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      errors.push(`Invalid file type: ${file.name}. Only jpg, jpeg, png, and webp are allowed.`);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      errors.push(`File too large: ${file.name}. Maximum size is 5MB.`);
      return;
    }

    validFiles.push(file);
  });

  return { errors, validFiles };
};

const defaultRenderImageUrl = (url) => url;

function ImageUploadField({
  label = 'Images',
  value = [],
  onChange,
  disabled = false,
  maxFiles = 10,
  helperText = '',
  buttonLabel = 'Select images',
  emptyStateLabel = 'No images uploaded yet.',
  previewAltPrefix = 'Uploaded image',
  renderImageUrl = defaultRenderImageUrl,
  selectedIndex = -1,
  selectedBadgeLabel = '',
  onPreviewClick,
  variant = 'button',
}) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState([]);

  const urls = normalizeUrls(Array.isArray(value) ? value : []);

  const openPicker = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const { errors, validFiles } = validateImageFiles(files, maxFiles, urls.length);
    if (errors.length) {
      setMessages(errors);
      event.target.value = '';
      return;
    }

    try {
      setIsUploading(true);
      setMessages([]);
      const response = await uploadApi.uploadImages(validFiles);
      const uploadedUrls = response?.data?.urls || [];
      onChange?.(normalizeUrls([...urls, ...uploadedUrls]));
    } catch (error) {
      setMessages([error?.response?.data?.message || 'Image upload failed.']);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleRemove = async (index) => {
    const nextUrls = urls.filter((_, itemIndex) => itemIndex !== index);
    const targetUrl = urls[index] || '';
    onChange?.(nextUrls);

    const filename = String(targetUrl || '').split('/').pop();
    if (!filename || /^https?:\/\//i.test(targetUrl)) {
      return;
    }

    try {
      await uploadApi.deleteImage(filename);
    } catch (error) {
      setMessages([error?.response?.data?.message || 'Failed to remove image from storage.']);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>{label}</div>
        {helperText ? <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{helperText}</div> : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled || isUploading}
      />

      {variant === 'dropzone' ? (
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled || isUploading}
          style={{
            minHeight: '136px',
            borderRadius: '16px',
            border: '1px dashed #94a3b8',
            background: '#f8fafc',
            color: '#334155',
            display: 'grid',
            placeItems: 'center',
            gap: '8px',
            cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
            padding: '20px',
          }}
        >
          <Upload size={30} />
          <span style={{ fontWeight: 600 }}>{isUploading ? 'Uploading images...' : buttonLabel}</span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Only jpg, jpeg, png, webp. Max 5MB each.</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled || isUploading}
          style={{
            justifySelf: 'start',
            height: '42px',
            padding: '0 16px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#0f172a',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          <Upload size={16} />
          <span>{isUploading ? 'Uploading...' : buttonLabel}</span>
        </button>
      )}

      {messages.length ? (
        <div style={{ display: 'grid', gap: '6px' }}>
          {messages.map((message) => (
            <div key={message} style={{ color: '#b91c1c', fontSize: '12px', lineHeight: 1.5 }}>{message}</div>
          ))}
        </div>
      ) : null}

      {urls.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))', gap: '12px' }}>
          {urls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              onClick={() => onPreviewClick?.(index)}
              role={onPreviewClick ? 'button' : undefined}
              tabIndex={onPreviewClick ? 0 : undefined}
              onKeyDown={(event) => {
                if (!onPreviewClick) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onPreviewClick(index);
                }
              }}
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '14px',
                border: selectedIndex === index ? '2px solid #2563eb' : '1px solid #cbd5e1',
                background: '#ffffff',
                cursor: onPreviewClick ? 'pointer' : 'default',
                minHeight: '120px',
              }}
            >
              <img
                src={renderImageUrl(url)}
                alt={`${previewAltPrefix} ${index + 1}`}
                style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
              />
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleRemove(index);
                }}
                disabled={disabled || isUploading}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '999px',
                  border: 'none',
                  background: 'rgba(15, 23, 42, 0.75)',
                  color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
                }}
              >
                <X size={14} />
              </button>
              {selectedIndex === index && selectedBadgeLabel ? (
                <div style={{ position: 'absolute', left: '8px', bottom: '8px', padding: '4px 8px', borderRadius: '999px', background: '#2563eb', color: '#ffffff', fontSize: '11px', fontWeight: 700 }}>
                  {selectedBadgeLabel}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
          <ImageIcon size={16} />
          <span>{emptyStateLabel}</span>
        </div>
      )}
    </div>
  );
}

export default ImageUploadField;