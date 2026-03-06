const TemplatePreview = ({ fields }) => {
  const renderFieldPreview = (field) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={field.placeholder || ''}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500"
            disabled
          />
        );

      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder || ''}
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 resize-none"
            disabled
          />
        );

      case 'select':
        return (
          <select
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            disabled
          >
            <option value="">Select an option...</option>
            {field.options?.map((opt, idx) => (
              <option key={idx} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="bg-gray-700 border border-gray-600 rounded p-3 space-y-2">
            {field.options?.slice(0, 3).map((opt, idx) => (
              <label key={idx} className="flex items-center space-x-2 text-gray-300 cursor-not-allowed">
                <input
                  type="checkbox"
                  disabled
                  className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded"
                />
                <span>{opt}</span>
              </label>
            ))}
            {field.options?.length > 3 && (
              <span className="text-gray-500 text-sm">...and {field.options.length - 3} more</span>
            )}
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            placeholder={field.placeholder || '0'}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500"
            disabled
          />
        );

      case 'date':
        return (
          <input
            type="date"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            disabled
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center space-x-2 cursor-not-allowed">
            <input
              type="checkbox"
              disabled
              className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded"
            />
            <span className="text-gray-300">Yes / No</span>
          </label>
        );

      default:
        return (
          <div className="text-gray-500 italic">Unknown field type: {field.type}</div>
        );
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-white">Template Preview</h4>
        <span className="text-sm text-gray-400">
          {fields.length} {fields.length === 1 ? 'field' : 'fields'}
        </span>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No fields to preview</p>
          <p className="text-gray-500 text-sm mt-1">Add fields to see how your template will look</p>
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              {renderFieldPreview(field)}
              {field.helpText && (
                <p className="text-gray-500 text-sm mt-1">{field.helpText}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplatePreview;