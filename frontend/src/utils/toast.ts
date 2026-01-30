import toast from 'react-hot-toast';

/**
 * Custom Toast Utility with Modern Styling
 * Replaces all alert() calls with beautiful toast notifications
 */

// Success toast with green accent
export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 2000,
    position: 'top-right',
    style: {
      background: 'rgba(16, 185, 129, 0.95)',
      color: '#fff',
      padding: '12px 16px',
      borderRadius: '10px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
      fontWeight: '500',
      fontSize: '14px',
    },
    icon: '✅',
  });
};

// Error toast with red accent
export const showError = (message: string) => {
  toast.error(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: 'rgba(239, 68, 68, 0.95)',
      color: '#fff',
      padding: '12px 16px',
      borderRadius: '10px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
      fontWeight: '500',
      fontSize: '14px',
    },
    icon: '❌',
  });
};

// Warning toast with amber accent
export const showWarning = (message: string) => {
  toast(message, {
    duration: 2500,
    position: 'top-right',
    style: {
      background: 'rgba(245, 158, 11, 0.95)',
      color: '#fff',
      padding: '12px 16px',
      borderRadius: '10px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
      fontWeight: '500',
      fontSize: '14px',
    },
    icon: '⚠️',
  });
};

// Info toast with blue accent
export const showInfo = (message: string) => {
  toast(message, {
    duration: 2000,
    position: 'top-right',
    style: {
      background: 'rgba(59, 130, 246, 0.95)',
      color: '#fff',
      padding: '12px 16px',
      borderRadius: '10px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
      fontWeight: '500',
      fontSize: '14px',
    },
    icon: 'ℹ️',
  });
};

// Loading toast for async operations
export const showLoading = (message: string) => {
  return toast.loading(message, {
    position: 'top-right',
    style: {
      background: 'rgba(107, 114, 128, 0.95)',
      color: '#fff',
      padding: '12px 16px',
      borderRadius: '10px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
      fontWeight: '500',
      fontSize: '14px',
    },
  });
};

// Promise toast for async operations with auto success/error
export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      position: 'top-right',
      style: {
        padding: '12px 16px',
        borderRadius: '10px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        fontWeight: '500',
        fontSize: '14px',
      },
      success: {
        duration: 2000,
        style: {
          background: 'rgba(16, 185, 129, 0.95)',
          color: '#fff',
        },
        icon: '✅',
      },
      error: {
        duration: 3000,
        style: {
          background: 'rgba(239, 68, 68, 0.95)',
          color: '#fff',
        },
        icon: '❌',
      },
      loading: {
        style: {
          background: 'rgba(107, 114, 128, 0.95)',
          color: '#fff',
        },
      },
    }
  );
};

// Dismiss specific toast
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

// Dismiss all toasts
export const dismissAll = () => {
  toast.dismiss();
};
