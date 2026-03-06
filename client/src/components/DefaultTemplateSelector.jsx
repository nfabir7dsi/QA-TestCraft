import { useState, useEffect } from 'react';
import templateService from '../services/templateService';
import toast from 'react-hot-toast';

const DefaultTemplateSelector = ({ isOpen, onClose, onSelect }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await templateService.getDefaultTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load default templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
      setSelectedTemplate(null); // Reset selection
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Choose a Template</h2>
              <p className="text-gray-400 text-sm mt-1">
                Select a pre-built template as a starting point
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-400">Loading templates...</p>
            </div>
          ) : (
            <>
              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                        : 'border-gray-700 bg-gray-700/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-bold text-lg">{template.name}</h3>
                      {selectedTemplate?.id === template.id && (
                        <svg
                          className="w-6 h-6 text-blue-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>

                    <p className="text-gray-400 text-sm mb-3">{template.description}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                        {template.category}
                      </span>
                      <span className="text-xs text-blue-400 font-medium">
                        {template.fields.length} {template.fields.length === 1 ? 'field' : 'fields'}
                      </span>
                    </div>

                    {/* Show field preview when selected */}
                    {selectedTemplate?.id === template.id && template.fields.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <p className="text-xs text-gray-400 mb-2">Fields included:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.fields.slice(0, 8).map((field) => (
                            <span
                              key={field.id}
                              className="text-xs bg-gray-600/50 text-gray-300 px-2 py-1 rounded"
                            >
                              {field.label}
                            </span>
                          ))}
                          {template.fields.length > 8 && (
                            <span className="text-xs text-gray-500 px-2 py-1">
                              +{template.fields.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-700">
                <button
                  onClick={handleSelect}
                  disabled={!selectedTemplate}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Use This Template
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DefaultTemplateSelector;