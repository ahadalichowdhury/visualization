import { useEffect, useRef } from "react";

interface NodeContextMenuProps {
  x: number;
  y: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const NodeContextMenu = ({ 
  x, 
  y, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onClose 
}: NodeContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-white dark:bg-[#252526] rounded-lg shadow-xl border border-gray-200 dark:border-[#3e3e3e] py-1 min-w-[200px]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1">
        Node Actions
      </div>

      <button
        onClick={() => {
          onEdit();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-[#d4d4d4] hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-3 transition-colors"
      >
        <span className="text-lg">⚙️</span>
        <span className="font-medium">Configuration</span>
      </button>

      <button
        onClick={() => {
          onDuplicate();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-[#d4d4d4] hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-3 transition-colors"
      >
        <span className="text-lg">📋</span>
        <span className="font-medium">Duplicate</span>
      </button>
      
      <div className="border-t border-gray-100 my-1"></div>
      
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors"
      >
        <span className="text-lg">🗑️</span>
        <span className="font-medium">Delete</span>
      </button>
    </div>
  );
};
