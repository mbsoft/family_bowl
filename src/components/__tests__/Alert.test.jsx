import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Alert from '../Alert';

describe('Alert component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <Alert isOpen={false} onClose={vi.fn()} message="Test" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render message when open', () => {
    render(<Alert isOpen={true} onClose={vi.fn()} message="Test message" />);
    expect(screen.getByText('Test message')).toBeTruthy();
  });

  it('should call onClose after duration expires', async () => {
    const onClose = vi.fn();
    render(<Alert isOpen={true} onClose={onClose} message="Test" duration={1000} />);
    
    // Wait for initial setTimeout (makes component visible)
    vi.advanceTimersByTime(0);
    
    // Wait for duration + fade out
    vi.advanceTimersByTime(1000 + 300);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should not auto-close when duration is 0', () => {
    const onClose = vi.fn();
    render(<Alert isOpen={true} onClose={onClose} message="Test" duration={0} />);
    
    vi.advanceTimersByTime(10000);
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Alert isOpen={true} onClose={onClose} message="Test" />);
    
    vi.advanceTimersByTime(0);
    
    const closeButton = screen.getByLabelText('Close');
    closeButton.click();
    
    vi.advanceTimersByTime(300);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should apply error type styles', () => {
    const { container } = render(
      <Alert isOpen={true} onClose={vi.fn()} message="Error" type="error" />
    );
    const alertDiv = container.querySelector('.border-\\[\\#EF4444\\]');
    expect(alertDiv).toBeTruthy();
  });

  it('should apply danger type styles', () => {
    const { container } = render(
      <Alert isOpen={true} onClose={vi.fn()} message="Danger" type="danger" />
    );
    const alertDiv = container.querySelector('.border-\\[\\#EF4444\\]');
    expect(alertDiv).toBeTruthy();
  });

  it('should apply warning type styles', () => {
    const { container } = render(
      <Alert isOpen={true} onClose={vi.fn()} message="Warning" type="warning" />
    );
    const alertDiv = container.querySelector('.border-\\[\\#FFD700\\]');
    expect(alertDiv).toBeTruthy();
  });

  it('should apply success type styles', () => {
    const { container } = render(
      <Alert isOpen={true} onClose={vi.fn()} message="Success" type="success" />
    );
    const alertDiv = container.querySelector('.border-\\[\\#10B981\\]');
    expect(alertDiv).toBeTruthy();
  });

  it('should apply default info type styles', () => {
    const { container } = render(
      <Alert isOpen={true} onClose={vi.fn()} message="Info" type="info" />
    );
    const alertDiv = container.querySelector('.border-\\[\\#0D4F3C\\]');
    expect(alertDiv).toBeTruthy();
  });

  it('should hide when isOpen changes to false', () => {
    const { rerender, container } = render(
      <Alert isOpen={true} onClose={vi.fn()} message="Test" />
    );
    
    vi.advanceTimersByTime(0);
    expect(container.firstChild).toBeTruthy();
    
    rerender(<Alert isOpen={false} onClose={vi.fn()} message="Test" />);
    vi.advanceTimersByTime(0);
    
    expect(container.firstChild).toBeNull();
  });

  it('should clean up timers on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <Alert isOpen={true} onClose={onClose} message="Test" duration={1000} />
    );
    
    vi.advanceTimersByTime(0);
    unmount();
    
    vi.advanceTimersByTime(2000);
    
    // onClose should not be called after unmount
    expect(onClose).not.toHaveBeenCalled();
  });
});
