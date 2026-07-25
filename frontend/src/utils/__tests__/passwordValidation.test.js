import { describe, it, expect } from 'vitest';
import { getPasswordValidationErrors, getApiValidationErrors } from '../passwordValidation';

describe('Password Validation Utility Unit Tests (UT133 - UT136)', () => {
  it('UT133: Validate mật khẩu mạnh trả về danh sách lỗi rỗng', () => {
    const errors = getPasswordValidationErrors('Password123!', 'Mật khẩu');
    expect(errors).toHaveLength(0);
  });

  it('UT134: Validate mật khẩu dưới 8 ký tự trả về lỗi độ dài', () => {
    const errors = getPasswordValidationErrors('Pass1!', 'Mật khẩu');
    expect(errors).toContain('Mật khẩu must be at least 8 characters long');
  });

  it('UT135: Validate mật khẩu thiếu chữ hoa, chữ thường hoặc số', () => {
    const noUppercase = getPasswordValidationErrors('password123!', 'Mật khẩu');
    expect(noUppercase).toContain('Mật khẩu must include at least 1 uppercase letter');

    const noNumber = getPasswordValidationErrors('Password!', 'Mật khẩu');
    expect(noNumber).toContain('Mật khẩu must include at least 1 number');
  });

  it('UT136: Validate mật khẩu thiếu ký tự đặc biệt', () => {
    const errors = getPasswordValidationErrors('Password123', 'Mật khẩu');
    expect(errors).toContain('Mật khẩu must include at least 1 special character');
  });
});
