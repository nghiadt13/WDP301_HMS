import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import LoginPage from '../LoginPage';
import axiosClient from '../../api/axiosClient';

vi.mock('../../api/axiosClient', () => ({
  default: {
    post: vi.fn()
  }
}));

describe('Customer Auth - LoginPage Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

  it('UT018: Frontend UI - Render form đăng nhập đúng tiêu đề và trường nhập liệu', () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: /Welcome Back to Hotelify/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter Login Account/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login to Dashboard/i })).toBeInTheDocument();
  });

  it('UT019: Frontend UI - Báo lỗi khi backend trả về lỗi đăng nhập sai tài khoản', async () => {
    axiosClient.post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid email or password' } }
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/Enter Login Account/i), {
      target: { value: 'wronguser' }
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter Password/i), {
      target: { value: 'Wrongpass123!' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Login to Dashboard/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('UT020: Frontend UI - Đăng nhập thành công lưu token vào localStorage', async () => {
    const mockAuthResponse = {
      data: {
        token: 'mock-jwt-token-xyz',
        user: { role: { name: 'Customer' }, full_name: 'Nguyen Customer' }
      }
    };
    axiosClient.post.mockResolvedValueOnce(mockAuthResponse);

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/Enter Login Account/i), {
      target: { value: 'customer123' }
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter Password/i), {
      target: { value: 'Password123!' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Login to Dashboard/i }));

    await waitFor(() => {
      expect(localStorage.getItem('hotelify_token')).toBe('mock-jwt-token-xyz');
    });
  });
});
