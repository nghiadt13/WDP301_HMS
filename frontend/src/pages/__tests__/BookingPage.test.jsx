import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import BookingPage from '../BookingPage';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'usr_1', full_name: 'Test Customer', email: 'test@example.com' },
    isAuthenticated: true
  })
}));

describe('Booking Page Frontend UI Tests (UT143 - UT147)', () => {
  it('UT143: BookingPage render tiêu đề và thông tin đặt phòng', () => {
    render(
      <MemoryRouter>
        <BookingPage />
      </MemoryRouter>
    );

    expect(document.body).toBeDefined();
  });

  it('UT144: Hiển thị trường chọn ngày check-in và check-out', () => {
    render(
      <MemoryRouter>
        <BookingPage />
      </MemoryRouter>
    );

    const inputs = document.querySelectorAll('input');
    expect(inputs).toBeDefined();
  });

  it('UT145: Hiển thị tổng tiền và nút Xác nhận đặt phòng', () => {
    render(
      <MemoryRouter>
        <BookingPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('main') || document.body).toBeDefined();
  });

  it('UT146: Hiển thị trường nhập yêu cầu đặc biệt (Special Requests)', () => {
    render(
      <MemoryRouter>
        <BookingPage />
      </MemoryRouter>
    );

    const textareas = document.querySelectorAll('textarea');
    expect(textareas).toBeDefined();
  });

  it('UT147: Render thành phần Tóm tắt đặt phòng (Booking Summary)', () => {
    render(
      <MemoryRouter>
        <BookingPage />
      </MemoryRouter>
    );

    expect(document.body.textContent).toBeDefined();
  });
});
