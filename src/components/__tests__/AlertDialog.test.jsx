import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AlertDialog from '../AlertDialog';

describe('AlertDialog component', () => {
  beforeEach(() => {
    // Mock window.matchMedia if needed
    if (typeof window !== 'undefined' && !window.matchMedia) {
      window.matchMedia = vi.fn(() => ({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    }
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <AlertDialog
        isOpen={false}
        onClose={vi.fn()}
        title="Test Title"
        message="Test Message"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(
      <AlertDialog
        isOpen={true}
        onClose={vi.fn()}
        title="Test Title"
        message="Test Message"
      />
    );
    expect(screen.getByText('Test Title')).toBeTruthy();
    expect(screen.getByText('Test Message')).toBeTruthy();
  });

  it('should render title and message', () => {
    render(
      <AlertDialog
        isOpen={true}
        onClose={vi.fn()}
        title="My Title"
        message="My Message"
      />
    );
    expect(screen.getByText('My Title')).toBeTruthy();
    expect(screen.getByText('My Message')).toBeTruthy();
  });

  it('should call onClose when cancel button is clicked (cancel acts as close)', async () => {
    const onClose = vi.fn();
    render(
      <AlertDialog
        isOpen={true}
        onClose={onClose}
        title="Test Title"
        message="Test Message"
      />
    );
    
    // Cancel button acts as close
    const cancelButton = screen.getByText('Cancel');
    await userEvent.click(cancelButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });


  it('should call onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <AlertDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Test Title"
        message="Test Message"
      />
    );
    
    const confirmButton = screen.getByText('Confirm');
    await userEvent.click(confirmButton);
    
    // onConfirm is called first, then onClose
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should always show cancel button (default behavior)', () => {
    render(
      <AlertDialog
        isOpen={true}
        onClose={vi.fn()}
        title="Test Title"
        message="Test Message"
      />
    );
    
    // Cancel button is always shown in this component
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('should use custom confirm button text', () => {
    render(
      <AlertDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Test Title"
        message="Test Message"
        confirmText="Delete"
      />
    );
    
    expect(screen.getByText('Delete')).toBeTruthy();
    expect(screen.queryByText('Confirm')).toBeNull();
  });

  it('should use custom cancel button text', () => {
    render(
      <AlertDialog
        isOpen={true}
        onClose={vi.fn()}
        title="Test Title"
        message="Test Message"
        cancelText="No"
      />
    );
    
    expect(screen.getByText('No')).toBeTruthy();
    expect(screen.queryByText('Cancel')).toBeNull();
  });

  it('should apply danger type styles when type is danger', () => {
    const { container } = render(
      <AlertDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Test Title"
        message="Test Message"
        type="danger"
      />
    );
    
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton.className).toContain('from-[#EF4444]');
  });

  it('should apply warning type styles when type is warning', () => {
    const { container } = render(
      <AlertDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Test Title"
        message="Test Message"
        type="warning"
      />
    );
    
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton.className).toContain('from-[#FFD700]');
  });

  it('should apply default warning type styles when type is not specified', () => {
    const { container } = render(
      <AlertDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Test Title"
        message="Test Message"
      />
    );
    
    // Default type is 'warning'
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton.className).toContain('from-[#FFD700]');
  });

  it('should close dialog when clicking outside (backdrop)', async () => {
    const onClose = vi.fn();
    const { container } = render(
      <AlertDialog
        isOpen={true}
        onClose={onClose}
        title="Test Title"
        message="Test Message"
      />
    );
    
    // Find the backdrop (the div with onClick handler)
    const backdrop = container.querySelector('.absolute.inset-0');
    expect(backdrop).toBeTruthy();
    
    // Click on the backdrop
    await userEvent.click(backdrop);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not close when clicking inside the dialog content', async () => {
    const onClose = vi.fn();
    render(
      <AlertDialog
        isOpen={true}
        onClose={onClose}
        title="Test Title"
        message="Test Message"
      />
    );
    
    // Click on the message (inside dialog)
    const message = screen.getByText('Test Message');
    await userEvent.click(message);
    
    // Should not close
    expect(onClose).not.toHaveBeenCalled();
  });
});
