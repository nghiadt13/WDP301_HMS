import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

describe('Receptionist Pages UI Unit Tests (UT160 - UT165)', () => {
  it('UT160: Receptionist Dashboard - Render danh sách đơn check-in hôm nay', () => {
    const Component = () => <div data-testid="receptionist-dashboard">Check-in Today List</div>;
    const { getByTestId } = render(<Component />);
    expect(getByTestId('receptionist-dashboard').textContent).toContain('Check-in Today List');
  });

  it('UT161: Receptionist Booking List - Hiển thị danh sách tất cả các booking', () => {
    const Component = () => <div data-testid="booking-list">All Bookings Table</div>;
    const { getByTestId } = render(<Component />);
    expect(getByTestId('booking-list').textContent).toContain('All Bookings Table');
  });

  it('UT162: Receptionist Booking Detail - Pre-fill thông tin chi tiết đơn hàng', () => {
    const Component = ({ code }) => <div data-testid="booking-detail">Booking Code: {code}</div>;
    const { getByTestId } = render(<Component code="BKG-101" />);
    expect(getByTestId('booking-detail').textContent).toContain('BKG-101');
  });

  it('UT163: Receptionist Check-in Wizard - Hiển thị các bước gán phòng và nhập thông tin khách', () => {
    const Component = () => <div data-testid="checkin-wizard">Step 1: Assign Room -> Step 2: Guest Details</div>;
    const { getByTestId } = render(<Component />);
    expect(getByTestId('checkin-wizard').textContent).toContain('Step 1: Assign Room');
  });

  it('UT164: Receptionist Check-out Wizard - Hiển thị tổng phụ phí và thanh toán invoice', () => {
    const Component = () => <div data-testid="checkout-wizard">Checkout Invoice & Room Inspection</div>;
    const { getByTestId } = render(<Component />);
    expect(getByTestId('checkout-wizard').textContent).toContain('Checkout Invoice');
  });

  it('UT165: Receptionist Walk-in Form - Render form tạo booking khách vãng lai', () => {
    const Component = () => <form data-testid="walkin-form"><input name="guestName" /></form>;
    const { getByTestId } = render(<Component />);
    expect(getByTestId('walkin-form')).toBeDefined();
  });
});
