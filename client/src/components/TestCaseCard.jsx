import { useState } from 'react';

const ExpandableText = ({ text, maxLength = 100 }) => {
  const [expanded, setExpanded] = useState(false);
  const str = String(text);
  const isLong = str.length > maxLength;

  if (!isLong) {
    return <span className="text-gray-300 text-sm break-words">{str}</span>;
  }

  return (
    <span
      onClick={() => setExpanded(!expanded)}
      className="text-gray-300 text-sm cursor-pointer hover:text-gray-200 transition-colors break-words block"
    >
      {expanded ? str : str.slice(0, maxLength) + '...'}
      <span className="text-blue-400 text-xs ml-1">
        {expanded ? '(show less)' : '(show more)'}
      </span>
    </span>
  );
};

const TestCaseCard = ({ testCase, index, templateFields, onUpdate, onRemove, isSaved = false, testCaseId }) => {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ ...testCase });

  const handleFieldChange = (fieldName, value) => {
    setEditData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleMultiselectChange = (fieldName, option, checked) => {
    setEditData((prev) => {
      const current = Array.isArray(prev[fieldName]) ? prev[fieldName] : [];
      const updated = checked
        ? [...current, option]
        : current.filter((v) => v !== option);
      return { ...prev, [fieldName]: updated };
    });
  };

  const handleSaveEdit = () => {
    onUpdate(editData);
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditData({ ...testCase });
    setEditing(false);
  };

  const renderFieldValue = (field) => {
    const value = testCase[field.name];

    if (value === undefined || value === null || value === '') {
      return <span className="text-gray-500 italic">Empty</span>;
    }

    if (field.type === 'boolean') {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${value ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }

    if (field.type === 'multiselect' && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => (
            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900 text-blue-300">
              {v}
            </span>
          ))}
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-900 text-purple-300">
          {value}
        </span>
      );
    }

    if (field.type === 'textarea') {
      return <ExpandableText text={value} maxLength={150} />;
    }

    return <ExpandableText text={String(value)} maxLength={100} />;
  };

  const renderFieldInput = (field) => {
    const value = editData[field.name];
    const baseClass = 'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 text-sm';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={baseClass}
          />
        );
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            rows={3}
            className={`${baseClass} resize-none`}
          />
        );
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={baseClass}
          >
            <option value="">Select...</option>
            {field.options?.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'multiselect':
        return (
          <div className="bg-gray-700 border border-gray-600 rounded p-2 space-y-1">
            {field.options?.map((opt, i) => (
              <label key={i} className="flex items-center space-x-2 text-gray-300 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(opt)}
                  onChange={(e) => handleMultiselectChange(field.name, opt, e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'number':
        return (
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value ? Number(e.target.value) : '')}
            className={baseClass}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={baseClass}
          />
        );
      case 'boolean':
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded"
            />
            <span className="text-gray-300 text-sm">{value ? 'Yes' : 'No'}</span>
          </label>
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={baseClass}
          />
        );
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-white font-semibold text-sm">
          {testCaseId || `Test Case #${index + 1}`}
          {isSaved && testCase.status && (
            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              testCase.status === 'active' ? 'bg-green-900 text-green-300' :
              testCase.status === 'archived' ? 'bg-gray-700 text-gray-400' :
              'bg-yellow-900 text-yellow-300'
            }`}>
              {testCase.status}
            </span>
          )}
        </span>
        <div className="flex items-center space-x-2">
          {editing ? (
            <>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors cursor-pointer"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors cursor-pointer"
              >
                Edit
              </button>
              {onRemove && (
                <button
                  onClick={onRemove}
                  className="px-3 py-1 text-xs bg-red-900/50 hover:bg-red-800 text-red-400 rounded transition-colors cursor-pointer"
                >
                  Remove
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        {templateFields
          .sort((a, b) => a.order - b.order)
          .map((field) => (
            <div key={field.id} className="grid grid-cols-3 gap-2 items-start">
              <label className="text-xs font-medium text-gray-400 pt-2">
                {field.label}
                {field.required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              <div className="col-span-2 overflow-hidden">
                {editing ? renderFieldInput(field) : renderFieldValue(field)}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default TestCaseCard;
