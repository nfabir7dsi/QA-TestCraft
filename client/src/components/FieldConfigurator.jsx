import { useState } from 'react';

const FIELD_TYPES = [
  { value: 'text', label: 'Text (Single Line)' },
  { value: 'textarea', label: 'Text Area (Multi-line)' },
  { value: 'select', label: 'Dropdown (Single Select)' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Checkbox (Yes/No)' },
];

const FieldConfigurator = ({
  field,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  errors = {},
}) => {
  const [expanded, setExpanded] = useState(true);
  const [optionsText, setOptionsText] = useState(
    field.options ? field.options.join(', ') : ''
  );

  const handleChange = (key, value) => {
    onUpdate({ [key]: value });
  };

  const handleOptionsChange = (text) => {
    setOptionsText(text);
    const options = text
      .split(',')
      .map((opt) => opt.trim())
      .filter((opt) => opt);
    onUpdate({ options });
  };

  const needsOptions = ['select', 'multiselect'].includes(field.type);

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg
              className={`w-5 h-5 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <span className="text-white font-medium">
            Field {index + 1}: {field.label || 'Untitled Field'}
          </span>
          <span className="text-sm text-gray-400">({field.type})</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Move Up button */}
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Move up"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          {/* Move Down button */}
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Move down"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Remove button */}
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            title="Remove field"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Configuration */}
      {expanded && (
        <div className="space-y-4 pl-8">
          {/* Field Name & Label */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Field Name (Internal) *
              </label>
              <input
                type="text"
                value={field.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border ${
                  errors.name ? 'border-red-500' : 'border-gray-600'
                } rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="e.g., testCaseId"
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              <p className="text-gray-500 text-xs mt-1">No spaces, letters/numbers/underscores only</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Label (Display) *
              </label>
              <input
                type="text"
                value={field.label || ''}
                onChange={(e) => handleChange('label', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border ${
                  errors.label ? 'border-red-500' : 'border-gray-600'
                } rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="e.g., Test Case ID"
              />
              {errors.label && <p className="text-red-400 text-sm mt-1">{errors.label}</p>}
            </div>
          </div>

          {/* Field Type & Required */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Field Type *
              </label>
              <select
                value={field.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.required || false}
                  onChange={(e) => handleChange('required', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-300">Required Field</span>
              </label>
            </div>
          </div>

          {/* Options for select/multiselect */}
          {needsOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Options (comma-separated) *
              </label>
              <input
                type="text"
                value={optionsText}
                onChange={(e) => handleOptionsChange(e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border ${
                  errors.options ? 'border-red-500' : 'border-gray-600'
                } rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="e.g., High, Medium, Low"
              />
              {errors.options && <p className="text-red-400 text-sm mt-1">{errors.options}</p>}
            </div>
          )}

          {/* Placeholder */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Placeholder Text
            </label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => handleChange('placeholder', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Example input value..."
            />
          </div>

          {/* Help Text */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Help Text
            </label>
            <input
              type="text"
              value={field.helpText || ''}
              onChange={(e) => handleChange('helpText', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Helpful description for users..."
            />
          </div>

          {/* Default Value */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Default Value
            </label>
            {field.type === 'boolean' ? (
              <select
                value={field.defaultValue === true ? 'true' : 'false'}
                onChange={(e) => handleChange('defaultValue', e.target.value === 'true')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            ) : field.type === 'select' && field.options && field.options.length > 0 ? (
              <select
                value={field.defaultValue || ''}
                onChange={(e) => handleChange('defaultValue', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- None --</option>
                {field.options.map((opt, idx) => (
                  <option key={idx} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                value={field.defaultValue || ''}
                onChange={(e) => handleChange('defaultValue', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldConfigurator;