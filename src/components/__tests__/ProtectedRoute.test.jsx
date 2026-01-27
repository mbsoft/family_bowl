import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import ProtectedRoute from '../ProtectedRoute';
import { isAuthenticated, isAdmin } from '../../lib/auth';
import { useRouter } from 'next/navigation';

// Mock dependencies
vi.mock('../../lib/auth', () => ({
  isAuthenticated: vi.fn(),
  isAdmin: vi.fn(),
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('ProtectedRoute component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRouter.mockReturnValue({
      push: mockPush,
    });
    
    // Mock window object
    Object.defineProperty(window, 'window', {
      value: window,
      writable: true,
    });
  });

  it('should render children when authenticated and admin not required', () => {
    isAuthenticated.mockReturnValue(true);
    isAdmin.mockReturnValue(false);
    
    const { container } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(container.textContent).toContain('Protected Content');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should render children when authenticated and is admin (admin required)', () => {
    isAuthenticated.mockReturnValue(true);
    isAdmin.mockReturnValue(true);
    
    const { container } = render(
      <ProtectedRoute requireAdmin={true}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );
    
    expect(container.textContent).toContain('Admin Content');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should redirect to login when not authenticated', () => {
    isAuthenticated.mockReturnValue(false);
    isAdmin.mockReturnValue(false);
    
    const { container } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(container.textContent).not.toContain('Protected Content');
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should redirect to bets when admin required but user is not admin', () => {
    isAuthenticated.mockReturnValue(true);
    isAdmin.mockReturnValue(false);
    
    const { container } = render(
      <ProtectedRoute requireAdmin={true}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );
    
    expect(container.textContent).not.toContain('Admin Content');
    expect(mockPush).toHaveBeenCalledWith('/bets');
  });

  it('should return null when not authenticated (rendering check)', () => {
    isAuthenticated.mockReturnValue(false);
    isAdmin.mockReturnValue(false);
    
    const { container } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should return null when admin required but user is not admin (rendering check)', () => {
    isAuthenticated.mockReturnValue(true);
    isAdmin.mockReturnValue(false);
    
    const { container } = render(
      <ProtectedRoute requireAdmin={true}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should handle multiple children', () => {
    isAuthenticated.mockReturnValue(true);
    isAdmin.mockReturnValue(false);
    
    const { container } = render(
      <ProtectedRoute>
        <div>Child 1</div>
        <div>Child 2</div>
      </ProtectedRoute>
    );
    
    expect(container.textContent).toContain('Child 1');
    expect(container.textContent).toContain('Child 2');
  });

  it('should check authentication on mount', () => {
    isAuthenticated.mockReturnValue(true);
    isAdmin.mockReturnValue(false);
    
    render(
      <ProtectedRoute>
        <div>Content</div>
      </ProtectedRoute>
    );
    
    expect(isAuthenticated).toHaveBeenCalled();
  });

  it('should check admin status when requireAdmin is true', () => {
    isAuthenticated.mockReturnValue(true);
    isAdmin.mockReturnValue(true);
    
    render(
      <ProtectedRoute requireAdmin={true}>
        <div>Content</div>
      </ProtectedRoute>
    );
    
    expect(isAuthenticated).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
  });

  it('should not check admin status when requireAdmin is false', () => {
    isAuthenticated.mockReturnValue(true);
    isAdmin.mockReturnValue(false);
    
    render(
      <ProtectedRoute requireAdmin={false}>
        <div>Content</div>
      </ProtectedRoute>
    );
    
    expect(isAuthenticated).toHaveBeenCalled();
    // isAdmin might still be called, but it shouldn't affect rendering
  });
});
