import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import AppHeader from '../AppHeader';

describe('AppHeader Component', () => {
  it('renders brand logo/text correctly', () => {
    render(
      <MemoryRouter>
        <AppHeader />
      </MemoryRouter>
    );

    expect(screen.getByText(/Hotelify/i)).toBeInTheDocument();
  });
});
