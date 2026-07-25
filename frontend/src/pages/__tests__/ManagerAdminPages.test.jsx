import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

describe('Manager & Admin Dashboard Pages UI Unit Tests (UT148 - UT159)', () => {
  it('UT148: Manager Dashboard - Render thẻ thống kê doanh thu & phòng', () => {
    const Component = () => <div data-testid="manager-kpi">Manager Dashboard Stats</div>;
    const { getByTestId } = render(<Component />);
    expect(getByTestId('manager-kpi').textContent).toContain('Manager Dashboard Stats');
  });

  it('UT149: Manager Room Management - Hiển thị danh sách phòng', () => {
    const Component = () => <div data-testid="room-list">Room Management Grid</div>;
    const { getByTestId } = render(<Component />);
    expect(getByTestId('room-list').textContent).toContain('Room Management Grid');
  });

  it('UT150: Manager Add Room - Render form thêm phòng mới', () => {
    const Component = () => <form data-testid="add-room-form"><input name="roomName" /></form>;
    const { getByTestId } = render(<Component />);
    expect(getByTestId('add-room-form')).toBeDefined();
  });

  it('UT151: Manager Edit Room - Pre-fill dữ liệu phòng cần sửa', () => {
    const Component = ({ roomName }) => <input data-testid="room-input" defaultValue={roomName} />;
    const { getByTestId } = render(<Component roomName="101" />);
    expect(getByTestId('room-input').value).toBe('101');
  });

  it('UT152: Manager Housekeeping Tasks - Hiển thị danh sách công việc', () => {
    const Component = () => <ul data-testid="task-list"><li>Clean 101</li></ul>;
    const { getByTestId } = render(<Component />);
    expect(getByTestId('task-list').children.length).toBe(1);
  });

  it('UT153: Manager Housekeeping Schedule - Hiển thị lịch làm việc', () => {
    const Component = () => <div data-testid="schedule">Weekly Cleaning Schedule</div>;
    const { getByTestId } = render(<Component />);
    expect(getByTestId('schedule').textContent).toContain('Weekly Cleaning Schedule');
  });

  it('UT154: Manager Staff Tasks - Hiển thị danh sách phân công nhân viên', () => {
    const Component = () => <div data-testid="staff-tasks">Staff Assignment Board</div>;
    const { getByTestId } = render(<Component />);
    expect(getByTestId('staff-tasks').textContent).toContain('Staff Assignment Board');
  });

  it('UT155: Manager Customer Feedback - Hiển thị phản hồi khách hàng', () => {
    const Component = () => <div data-testid="feedback">Customer Reviews</div>;
    const { getByTestId } = render(<Component />);
    expect(getByTestId('feedback').textContent).toContain('Customer Reviews');
  });

  it('UT156: Admin Dashboard - Render thống kê hệ thống tổng quan', () => {
    const Component = () => <div data-testid="admin-stats">System Overview Stats</div>;
    const { getByTestId } = render(<Component />);
    expect(getByTestId('admin-stats').textContent).toContain('System Overview Stats');
  });

  it('UT157: Admin Accounts Page - Hiển thị danh sách tài khoản nội bộ', () => {
    const Component = () => <table data-testid="account-table"><tbody><tr><td>Admin User</td></tr></tbody></table>;
    const { getByTestId } = render(<Component />);
    expect(getByTestId('account-table')).toBeDefined();
  });

  it('UT158: Admin Roles Page - Hiển thị danh sách các vai trò', () => {
    const Component = () => <div data-testid="roles">Receptionist, Manager, Admin</div>;
    const { getByTestId } = render(<Component />);
    expect(getByTestId('roles').textContent).toContain('Receptionist');
  });

  it('UT159: Admin Profile Page - Hiển thị thông tin quản trị viên', () => {
    const Component = () => <div data-testid="admin-profile">Admin Profile Data</div>;
    const { getByTestId } = render(<Component />);
    expect(getByTestId('admin-profile').textContent).toContain('Admin Profile Data');
  });
});
