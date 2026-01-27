import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDialog, useAlert } from '../useDialog';

describe('useDialog hook', () => {
  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useDialog());
    
    expect(result.current.dialogState.isOpen).toBe(false);
    expect(result.current.dialogState.title).toBe('');
    expect(result.current.dialogState.message).toBe('');
  });

  it('should open dialog with provided data', () => {
    const { result } = renderHook(() => useDialog());
    
    act(() => {
      result.current.showDialog({
        title: 'Test Title',
        message: 'Test Message',
        confirmText: 'Yes',
        cancelText: 'No',
        type: 'danger'
      });
    });

    expect(result.current.dialogState.isOpen).toBe(true);
    expect(result.current.dialogState.title).toBe('Test Title');
    expect(result.current.dialogState.message).toBe('Test Message');
    expect(result.current.dialogState.confirmText).toBe('Yes');
    expect(result.current.dialogState.cancelText).toBe('No');
    expect(result.current.dialogState.type).toBe('danger');
  });

  it('should use default values when not provided', () => {
    const { result } = renderHook(() => useDialog());
    
    act(() => {
      result.current.showDialog({
        message: 'Test Message'
      });
    });

    expect(result.current.dialogState.isOpen).toBe(true);
    expect(result.current.dialogState.title).toBe('');
    expect(result.current.dialogState.confirmText).toBe('Confirm');
    expect(result.current.dialogState.cancelText).toBe('Cancel');
    expect(result.current.dialogState.type).toBe('warning');
  });

  it('should close dialog when hideDialog is called', () => {
    const { result } = renderHook(() => useDialog());
    
    act(() => {
      result.current.showDialog({
        title: 'Test',
        message: 'Test'
      });
    });

    expect(result.current.dialogState.isOpen).toBe(true);

    act(() => {
      result.current.hideDialog();
    });

    expect(result.current.dialogState.isOpen).toBe(false);
    // Other state should be preserved
    expect(result.current.dialogState.title).toBe('Test');
  });

  it('should store onConfirm callback', () => {
    const { result } = renderHook(() => useDialog());
    const mockCallback = vi.fn();
    
    act(() => {
      result.current.showDialog({
        message: 'Test',
        onConfirm: mockCallback
      });
    });

    expect(result.current.dialogState.onConfirm).toBe(mockCallback);
    
    // Call the callback
    act(() => {
      result.current.dialogState.onConfirm();
    });

    expect(mockCallback).toHaveBeenCalled();
  });

  it('should use empty function as default onConfirm', () => {
    const { result } = renderHook(() => useDialog());
    
    act(() => {
      result.current.showDialog({
        message: 'Test'
      });
    });

    expect(typeof result.current.dialogState.onConfirm).toBe('function');
    // Should not throw
    expect(() => result.current.dialogState.onConfirm()).not.toThrow();
  });
});

describe('useAlert hook', () => {
  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useAlert());
    
    expect(result.current.alertState.isOpen).toBe(false);
    expect(result.current.alertState.message).toBe('');
    expect(result.current.alertState.type).toBe('info');
    expect(result.current.alertState.duration).toBe(5000);
  });

  it('should show alert with provided message and type', () => {
    const { result } = renderHook(() => useAlert());
    
    act(() => {
      result.current.showAlert('Test message', 'success', 3000);
    });

    expect(result.current.alertState.isOpen).toBe(true);
    expect(result.current.alertState.message).toBe('Test message');
    expect(result.current.alertState.type).toBe('success');
    expect(result.current.alertState.duration).toBe(3000);
  });

  it('should use default type and duration when not provided', () => {
    const { result } = renderHook(() => useAlert());
    
    act(() => {
      result.current.showAlert('Test message');
    });

    expect(result.current.alertState.type).toBe('info');
    expect(result.current.alertState.duration).toBe(5000);
  });

  it('should close alert when hideAlert is called', () => {
    const { result } = renderHook(() => useAlert());
    
    act(() => {
      result.current.showAlert('Test message');
    });

    expect(result.current.alertState.isOpen).toBe(true);

    act(() => {
      result.current.hideAlert();
    });

    expect(result.current.alertState.isOpen).toBe(false);
    // Message should be preserved
    expect(result.current.alertState.message).toBe('Test message');
  });

  it('should support different alert types', () => {
    const { result } = renderHook(() => useAlert());
    
    const types = ['info', 'success', 'warning', 'error'];
    
    types.forEach(type => {
      act(() => {
        result.current.showAlert('Test', type);
      });
      expect(result.current.alertState.type).toBe(type);
    });
  });
});
