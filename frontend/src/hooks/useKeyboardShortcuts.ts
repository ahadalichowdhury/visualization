import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  onCopy?: () => void;
  onPaste?: () => void;
  onSelectAll?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
}

export const useKeyboardShortcuts = ({
  onCopy,
  onPaste,
  onSelectAll,
  onUndo,
  onRedo,
  onDelete,
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if typing in input
      if (
        (event.target as HTMLElement).isContentEditable ||
        (event.target as HTMLElement).tagName === 'INPUT' || 
        (event.target as HTMLElement).tagName === 'TEXTAREA'
      ) {
        return;
      }

      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      // Handle Ctrl/Cmd combinations
      if (isCtrlOrCmd) {
        switch (event.key.toLowerCase()) {
          case 'a':
            event.preventDefault();
            event.stopPropagation();
            console.log('🎯 Select All triggered');
            onSelectAll?.();
            break;
          case 'c':
            event.preventDefault();
            event.stopPropagation();
            console.log('📋 Copy triggered');
            onCopy?.();
            break;
          case 'v':
            event.preventDefault();
            event.stopPropagation();
            console.log('📌 Paste triggered');
            onPaste?.();
            break;
          case 'z':
            event.preventDefault();
            event.stopPropagation();
            if (event.shiftKey) {
              console.log('↪️ Redo triggered');
              onRedo?.();
            } else {
              console.log('↩️ Undo triggered');
              onUndo?.();
            }
            break;
          case 'y':
            event.preventDefault();
            event.stopPropagation();
            console.log('↪️ Redo triggered');
            onRedo?.();
            break;
          case 'd':
            event.preventDefault();
            event.stopPropagation();
            console.log('📋➕ Duplicate triggered');
            // Duplicate = Copy + Paste
            onCopy?.();
            setTimeout(() => onPaste?.(), 10);
            break;
        }
      } else {
        // Handle Delete/Backspace without modifiers
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault();
          event.stopPropagation();
          console.log('🗑️ Delete triggered');
          onDelete?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCopy, onPaste, onSelectAll, onUndo, onRedo, onDelete]);
};
