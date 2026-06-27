import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

const NotificationToast = ({ show, type = 'success', title, message, onClose }) => {
  if (!show) return null;

  const isSuccess = type === 'success';

  return (
    <div
      className={`fixed top-6 right-6 z-50 transform transition-transform duration-300 ease-out max-w-sm w-full p-4 rounded-xl border shadow-lg flex items-start gap-3 ${
        show ? 'translate-y-0' : 'translate-y-[-150%]'
      } ${isSuccess ? 'border-emerald-200 bg-brand-successBg' : 'border-red-200 bg-brand-errorBg'}`}
    >
      <div className={`p-1 rounded-lg ${isSuccess ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'}`}>
        {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      </div>
      <div className="flex-1">
        <h4 className={`text-sm font-medium mb-1 ${isSuccess ? 'text-brand-successText' : 'text-brand-errorText'}`}>
          {title}
        </h4>
        <p className="text-xs text-brand-textBody">{message}</p>
      </div>
      <button onClick={onClose} className="text-brand-textBody hover:text-brand-textHead">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default NotificationToast;
