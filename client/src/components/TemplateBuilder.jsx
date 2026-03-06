import { useState, useEffect } from 'react';
import FieldConfigurator from './FieldConfigurator';
import TemplatePreview from './TemplatePreview';

const TemplateBuilder = ({ initialTemplate, onSave, onCancel, loading }) => {
  const [fields, setFields] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialTemplate?.fields && Array.isArray(initialTemplate.fields)) {
      setFields(initialTemplate.fields);
    }
  }, [initialTemplate]);

  const addField = () => {
    const newField = {
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      label: '',
      type: 'text',
      required: false,
      order: fields.length,
    };
    setFields([...fields, newField]);
    setErrors({}); // Clear errors when adding new field
  };

  const removeField = (fieldId) => {
    const updatedFields = fields.filter((f) => f.id !== fieldId);
    // Update order values
    const reorderedFields = updatedFields.map((field, idx) => ({
      ...field,
      order: idx,
    }));
    setFields(reorderedFields);
    setErrors({}); // Clear errors when removing field
  };

  const updateField = (fieldId, updates) => {
    setFields(
      fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f))
    );
  };

  const moveField = (fieldId, direction) => {
    const index = fields.findIndex((f) => f.id === fieldId);

    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === fields.length - 1)
    ) {
      return;
    }

    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [
      newFields[targetIndex],
      newFields[index],
    ];

    // Update order values
    newFields.forEach((field, idx) => {
      field.order = idx;
    });

    setFields(newFields);
  };

  const validateTemplate = () => {
    const newErrors = {};

    // Check at least one field
    if (fields.length === 0) {
      newErrors.general = 'Template must have at least one field';
      setErrors(newErrors);
      return false;
    }

    // Check for duplicate names
    const names = fields.map((f) => f.name).filter((n) => n);
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
      newErrors.general = 'Field names must be unique';
      setErrors(newErrors);
      return false;
    }

    // Validate each field
    fields.forEach((field, index) => {
      const fieldErrors = {};

      if (!field.name) {
        fieldErrors.name = 'Field name is required';
      } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.name)) {
        fieldErrors.name = 'Field name must start with a letter and contain only letters, numbers, and underscores';
      }

      if (!field.label) {
        fieldErrors.label = 'Field label is required';
      }

      if (
        ['select', 'multiselect'].includes(field.type) &&
        (!field.options || field.options.length === 0)
      ) {
        fieldErrors.options = 'Options are required for select fields';
      }

      if (Object.keys(fieldErrors).length > 0) {
        newErrors[`field-${index}`] = fieldErrors;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateTemplate()) {
      const template = {
        fields: fields.map((field, index) => ({
          ...field,
          order: index,
        })),
        updatedAt: new Date().toISOString(),
      };
      onSave(template);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Configure Test Case Template</h3>
          <p className="text-gray-400 text-sm mt-1">
            Define the fields that will be used in your test cases
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            type="button"
            onClick={addField}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium cursor-pointer"
          >
            + Add Field
          </button>
        </div>
      </div>

      {/* Error Display */}
      {errors.general && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
          {errors.general}
        </div>
      )}

      {/* Fields List */}
      <div className="space-y-4">
        {fields.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center border-2 border-dashed border-gray-700">
            <svg
              className="w-16 h-16 text-gray-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-400 text-lg font-medium mb-2">No fields yet</p>
            <p className="text-gray-500">Click "Add Field" to get started building your template</p>
          </div>
        ) : (
          fields.map((field, index) => (
            <FieldConfigurator
              key={field.id}
              field={field}
              index={index}
              onUpdate={(updates) => updateField(field.id, updates)}
              onRemove={() => removeField(field.id)}
              onMoveUp={() => moveField(field.id, 'up')}
              onMoveDown={() => moveField(field.id, 'down')}
              canMoveUp={index > 0}
              canMoveDown={index < fields.length - 1}
              errors={errors[`field-${index}`]}
            />
          ))
        )}
      </div>

      {/* Preview */}
      {showPreview && <TemplatePreview fields={fields} />}

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4 border-t border-gray-700">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || fields.length === 0}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {loading ? 'Saving Template...' : 'Save Template'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TemplateBuilder;