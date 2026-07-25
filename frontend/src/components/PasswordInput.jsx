import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const PasswordInput = ({ className = '', ...inputProps }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={`password-input-wrap ${className}`.trim()}>
      <input
        {...inputProps}
        type={isVisible ? 'text' : 'password'}
      />
      <button
        type="button"
        className="password-visibility-button"
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        title={isVisible ? 'Hide password' : 'Show password'}
        onClick={() => setIsVisible((currentValue) => !currentValue)}
      >
        {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

export default PasswordInput;
