import React from 'react';
import { ARCHITECTURE_TEMPLATES, ArchitectureTemplate } from '../../data/templates';

interface TemplateModalProps {
  onSelectTemplate: (template: ArchitectureTemplate) => void;
  onClose: () => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({ onSelectTemplate, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#252526] rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Choose a Template</h2>
            <p className="text-gray-500 mt-1">Start with a proven architecture pattern</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-[#9ca3af] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ARCHITECTURE_TEMPLATES.map((template) => (
              <div 
                key={template.id}
                className="group bg-white dark:bg-[#252526] rounded-xl border border-gray-200 dark:border-[#3e3e3e] shadow-sm hover:shadow-lg hover:border-primary-500 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
                onClick={() => onSelectTemplate(template)}
              >
                {/* Decoration Header */}
                <div className={`h-2 w-full ${
                  template.category === 'starter' ? 'bg-green-500' :
                  template.category === 'pattern' ? 'bg-blue-500' :
                  'bg-purple-500'
                }`} />
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wider ${
                      template.category === 'starter' ? 'bg-green-100 text-green-700' :
                      template.category === 'pattern' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {template.category}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-primary-600 transition-colors">
                    {template.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-[#9ca3af] mb-4 line-clamp-3">
                    {template.description}
                  </p>
                  
                  <div className="mt-auto pt-4 flex items-center text-sm text-gray-500 border-t border-gray-100">
                    <div className="flex -space-x-2 mr-3">
                       {/* Render mini overlapping icons of logic nodes */}
                       {template.nodes.slice(0, 3).map((node, i) => (
                         <div key={i} className="w-6 h-6 rounded-full bg-gray-100 dark:bg-[#2d2d2d] border-2 border-white flex items-center justify-center text-[10px]">
                           {/* Simple heuristic for icon */}
                           {node.data.nodeType?.includes('db') ? '🗄️' : 
                            node.data.nodeType?.includes('cache') ? '⚡' : 
                            node.data.nodeType?.includes('lb') ? '⚖️' : '📦'}
                         </div>
                       ))}
                       {template.nodes.length > 3 && (
                         <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-[#2d2d2d] border-2 border-white flex items-center justify-center text-[10px] font-bold">
                           +{template.nodes.length - 3}
                         </div>
                       )}
                    </div>
                    <span>{template.nodes.length} Components</span>
                  </div>
                </div>
                
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 group-hover:bg-primary-50 transition-colors flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-[#9ca3af] group-hover:text-primary-700">Load Template</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-primary-600 transform group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-white dark:bg-[#252526] border-t border-gray-100 text-center text-sm text-gray-500">
           Select a template to verify auto-scaling behavior instantly.
        </div>
      </div>
    </div>
  );
};
