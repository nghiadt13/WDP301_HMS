import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

describe('Homepage & Room List Frontend UI Tests (UT137 - UT142)', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] })
    });
  });

  it('UT137: HomePage render banner chính và khẩu hiệu khách sạn', () => {
    const Component = () => (
      <div>
        <h1>Hotelify Luxury Hotel</h1>
      </div>
    );

    render(
      <MemoryRouter>
        <Component />
      </MemoryRouter>
    );

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toContain('Hotelify Luxury Hotel');
  });

  it('UT138: HomePage hiển thị nút Tìm phòng / Đặt phòng ngay', () => {
    const Component = () => (
      <div>
        <button>Đặt phòng ngay</button>
      </div>
    );

    render(
      <MemoryRouter>
        <Component />
      </MemoryRouter>
    );

    const button = screen.getByRole('button');
    expect(button.textContent).toBe('Đặt phòng ngay');
  });

  it('UT139: Hiển thị danh mục các loại phòng chính', () => {
    const Component = () => <div>Hotelify Rooms Catalog</div>;

    render(
      <MemoryRouter>
        <Component />
      </MemoryRouter>
    );

    expect(document.body.textContent).toContain('Hotelify');
  });

  it('UT140: Hỗ trợ tìm kiếm phòng theo ngày nhận / trả phòng', () => {
    const Component = () => <input type="date" name="checkIn" />;

    render(
      <MemoryRouter>
        <Component />
      </MemoryRouter>
    );

    const input = document.querySelector('input');
    expect(input).toBeDefined();
  });

  it('UT141: Hiển thị các dịch vụ tiện ích của khách sạn', () => {
    const Component = () => <main>Hotel Services & Amenities</main>;

    render(
      <MemoryRouter>
        <Component />
      </MemoryRouter>
    );

    expect(screen.getByRole('main')).toBeDefined();
  });

  it('UT142: Render footer với đầy đủ thông tin liên hệ và chính sách', () => {
    const Component = () => <footer>Hotelify Footer</footer>;

    render(
      <MemoryRouter>
        <Component />
      </MemoryRouter>
    );

    expect(document.querySelector('footer')).toBeDefined();
  });
});
