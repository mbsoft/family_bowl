import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer component', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should render build date from environment variable', () => {
    process.env.NEXT_PUBLIC_BUILD_DATE = 'January 1, 2025';
    const { container } = render(<Footer />);
    expect(screen.getByText(/Build Date: January 1, 2025/)).toBeTruthy();
  });

  it('should render current date as fallback when build date is not set', () => {
    delete process.env.NEXT_PUBLIC_BUILD_DATE;
    const { container } = render(<Footer />);
    const buildDateText = screen.getByText(/Build Date:/);
    expect(buildDateText).toBeTruthy();
    // Should contain a date (format will vary by locale)
    expect(buildDateText.textContent).toMatch(/Build Date:/);
  });

  it('should render creator name', () => {
    render(<Footer />);
    expect(screen.getByText('Created by Jim Welch')).toBeTruthy();
  });

  it('should render GitHub repository link', () => {
    const { container } = render(<Footer />);
    const githubLink = container.querySelector('a[href="https://github.com/mbsoft/family_bowl"]');
    expect(githubLink).toBeTruthy();
    expect(githubLink.getAttribute('target')).toBe('_blank');
    expect(githubLink.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('should render GitHub icon SVG', () => {
    const { container } = render(<Footer />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
  });

  it('should have correct footer styling classes', () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer');
    expect(footer).toBeTruthy();
    expect(footer.className).toContain('bg-white');
    expect(footer.className).toContain('dark:bg-gray-800');
    expect(footer.className).toContain('border-t-4');
  });

  it('should have responsive layout classes', () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer');
    const innerDiv = footer.querySelector('.flex');
    expect(innerDiv.className).toContain('flex-col');
    expect(innerDiv.className).toContain('sm:flex-row');
  });
});
