'use client';

import { useState, useCallback } from 'react';

export function useDialog() {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'warning'
  });

  const showDialog = useCallback(({ title, message, onConfirm, confirmText, cancelText, type }) => {
    setDialogState({
      isOpen: true,
      title: title || '',
      message,
      onConfirm: onConfirm || (() => {}),
      confirmText: confirmText || 'Confirm',
      cancelText: cancelText || 'Cancel',
      type: type || 'warning'
    });
  }, []);

  const hideDialog = useCallback(() => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    dialogState,
    showDialog,
    hideDialog
  };
}

export function useAlert() {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: '',
    type: 'info',
    duration: 5000
  });

  const showAlert = useCallback((message, type = 'info', duration = 5000) => {
    setAlertState({
      isOpen: true,
      message,
      type,
      duration
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    alertState,
    showAlert,
    hideAlert
  };
}

