import { useMemo, useState } from 'react';
import { NODE_TYPES, NodeTypeDefinition } from '../../types/builder.types';

interface NodePaletteProps {
  onAddNode: (nodeType: NodeTypeDefinition) => void;
}

export const NodePalette = ({ onAddNode }: NodePaletteProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter nodes based on search query
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) {
      return NODE_TYPES;
    }
    
    const query = searchQuery.toLowerCase();
    return NODE_TYPES.filter(
      (node) =>
        node.label.toLowerCase().includes(query) ||
        node.description.toLowerCase().includes(query) ||
        node.type.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Group filtered nodes by category
  const categories = useMemo(() => {
    return {
      compute: filteredNodes.filter((n) => n.category === 'compute'),
      storage: filteredNodes.filter((n) => n.category === 'storage'),
      network: filteredNodes.filter((n) => n.category === 'network'),
      messaging: filteredNodes.filter((n) => n.category === 'messaging'),
      other: filteredNodes.filter((n) => n.category === 'other'),
    };
  }, [filteredNodes]);

  return (
    <div className="w-full h-full bg-white dark:bg-[#252526] border-r border-gray-200 dark:border-[#3e3e3e] p-4 overflow-y-auto">
      <h3 className="text-lg font-bold text-gray-900 dark:text-[#cccccc] mb-4">Components</h3>
      
      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="w-full px-3 py-2 pl-9 border border-gray-300 dark:border-[#3e3e3e] rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">
            🔍
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 dark:text-[#9ca3af]"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-gray-500 mt-1">
            Found {filteredNodes.length} component{filteredNodes.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
      
      {Object.entries(categories).map(([category, nodes]) => (
        nodes.length > 0 && (
          <div key={category} className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] uppercase mb-2">
              {category}
            </h4>
            <div className="space-y-2">
              {nodes.map((nodeType) => (
                <button
                  key={nodeType.type}
                  onClick={() => onAddNode(nodeType)}
                  className="w-full flex items-center space-x-3 p-3 bg-gray-50 dark:bg-[#2d2d2d] hover:bg-gray-100 dark:hover:bg-[#3e3e3e] rounded-lg border border-gray-200 dark:border-[#3e3e3e] transition-colors group"
                  title={nodeType.description}
                >
                  <span className="text-2xl">{nodeType.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-[#cccccc]">
                      {nodeType.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-[#9ca3af] line-clamp-1">
                      {nodeType.description}
                    </div>
                  </div>
                  <span className="text-gray-400 dark:text-[#6a6a6a] group-hover:text-primary-600">
                    +
                  </span>
                </button>
              ))}
            </div>
          </div>
        )
      ))}
      
      {filteredNodes.length === 0 && searchQuery && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No components found</p>
          <p className="text-gray-400 text-xs mt-1">Try a different search term</p>
        </div>
      )}
      
      <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Search for components above, then click to add them to the canvas.
          Connect by dragging from one node to another.
        </p>
      </div>
    </div>
  );
};
