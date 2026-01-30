interface CanvasToolbarProps {
  mode: 'hand' | 'pointer';
  onChangeMode: (mode: 'hand' | 'pointer') => void;
}

export const CanvasToolbar = ({ mode, onChangeMode }: CanvasToolbarProps) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white dark:bg-[#252526] rounded-lg shadow-md border border-gray-200 dark:border-[#3e3e3e] p-1 flex space-x-1">
      <button
        onClick={() => onChangeMode('pointer')}
        className={`p-2 rounded-md transition-all ${
          mode === 'pointer'
            ? 'bg-blue-100 text-blue-700 shadow-sm'
            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] hover:text-gray-700 dark:text-[#d4d4d4]'
        }`}
        title="Selection Tool (Drag to select)"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      </button>

      <button
        onClick={() => onChangeMode('hand')}
        className={`p-2 rounded-md transition-all ${
          mode === 'hand'
            ? 'bg-blue-100 text-blue-700 shadow-sm'
            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] hover:text-gray-700 dark:text-[#d4d4d4]'
        }`}
        title="Pan Tool (Drag to move canvas)"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
        </svg>
      </button>
      
      <div className="w-px bg-slate-600 mx-1 my-1"></div>
      
      <div className="flex items-center px-2 text-xs text-gray-400 select-none">
        {mode === 'pointer' ? 'Drag to select' : 'Drag to pan'}
      </div>
    </div>
  );
};
