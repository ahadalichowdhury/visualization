import { useEffect, useRef } from "react";

interface EdgeContextMenuProps {
  x: number;
  y: number;
  onDelete: () => void;
  onClose: () => void;
}

export const EdgeContextMenu = ({ x, y, onDelete, onClose }: EdgeContextMenuProps) => {
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
      className="absolute z-50 bg-white dark:bg-[#252526] rounded-lg shadow-xl border border-gray-200 dark:border-[#3e3e3e] py-1 min-w-[180px]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
      >
        <span className="text-lg">🗑️</span>
        <span className="font-medium">Delete Connection</span>
      </button>
      
      <div className="border-t border-gray-100 my-1"></div>
      
      <button
        onClick={onClose}
        className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-white dark:bg-[#252526] flex items-center space-x-2 transition-colors"
      >
        <span className="text-lg">✖️</span>
        <span>Cancel</span>
      </button>
    </div>
  );
};
