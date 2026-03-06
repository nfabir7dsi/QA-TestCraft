import { useState } from 'react';
import TemplateBuilder from './TemplateBuilder';
import DefaultTemplateSelector from './DefaultTemplateSelector';

const TemplateBuilderModal = ({ isOpen, onClose, onSave, initialTemplate, loading }) => {
  const [showDefaultSelector, setShowDefaultSelector] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(initialTemplate);

  const handleDefaultTemplateSelect = (template) => {
    setCurrentTemplate({
      fields: template.fields,
    });
    setShowDefaultSelector(false);
  };

  const handleClose = () => {
    setShowDefaultSelector(false);
    onClose();
  };

  if (!isOpen) return null;

  const hasFields = currentTemplate?.fields && currentTemplate.fields.length > 0;

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white">Template Builder</h2>
            <p className="text-gray-400 mt-1">
              Design your custom test case structure
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Start from template button */}
        {!hasFields && (
          <div className="mb-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Quick Start</h3>
            <p className="text-gray-400 mb-4">
              Save time by starting with a pre-built template, or build from scratch
            </p>
            <button
              onClick={() => setShowDefaultSelector(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium cursor-pointer"
            >
              📋 Browse Default Templates
            </button>
          </div>
        )}

        {/* Builder */}
        <TemplateBuilder
          initialTemplate={currentTemplate}
          onSave={onSave}
          onCancel={handleClose}
          loading={loading}
        />

        {/* Default Template Selector */}
        <DefaultTemplateSelector
          isOpen={showDefaultSelector}
          onClose={() => setShowDefaultSelector(false)}
          onSelect={handleDefaultTemplateSelect}
        />
      </div>
    </div>
  );
};

export default TemplateBuilderModal;