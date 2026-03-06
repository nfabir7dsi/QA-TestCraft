import Joi from 'joi';

// Supported field types
const fieldTypes = ['text', 'textarea', 'select', 'multiselect', 'number', 'date', 'boolean'];

// Schema for validating a single field in the template
export const fieldSchema = Joi.object({
  id: Joi.string()
    .required()
    .messages({
      'string.base': 'Field ID must be a string',
      'any.required': 'Field ID is required',
    }),

  name: Joi.string()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z][a-zA-Z0-9_]*$/)
    .required()
    .messages({
      'string.min': 'Field name must be at least 1 character',
      'string.max': 'Field name cannot exceed 50 characters',
      'string.pattern.base': 'Field name must start with a letter and contain only letters, numbers, and underscores',
      'any.required': 'Field name is required',
    }),

  label: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Field label must be at least 1 character',
      'string.max': 'Field label cannot exceed 100 characters',
      'any.required': 'Field label is required',
    }),

  type: Joi.string()
    .valid(...fieldTypes)
    .required()
    .messages({
      'any.only': `Field type must be one of: ${fieldTypes.join(', ')}`,
      'any.required': 'Field type is required',
    }),

  required: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'Required must be a boolean value',
    }),

  defaultValue: Joi.any()
    .allow(null, '')
    .optional(),

  // Options are required for select and multiselect types
  options: Joi.when('type', {
    is: Joi.string().valid('select', 'multiselect'),
    then: Joi.array()
      .items(Joi.string().min(1))
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one option is required for select/multiselect fields',
        'any.required': 'Options are required for select/multiselect fields',
      }),
    otherwise: Joi.forbidden().messages({
      'any.unknown': 'Options are only allowed for select/multiselect field types',
    }),
  }),

  validation: Joi.object({
    min: Joi.number().optional(),
    max: Joi.number().optional(),
    pattern: Joi.string().optional(),
    minLength: Joi.number().integer().min(0).optional(),
    maxLength: Joi.number().integer().min(0).optional(),
  })
    .optional()
    .messages({
      'object.base': 'Validation must be an object',
    }),

  placeholder: Joi.string()
    .max(100)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Placeholder cannot exceed 100 characters',
    }),

  helpText: Joi.string()
    .max(200)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Help text cannot exceed 200 characters',
    }),

  order: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base': 'Order must be a number',
      'number.integer': 'Order must be an integer',
      'number.min': 'Order must be 0 or greater',
      'any.required': 'Order is required',
    }),
});

// Schema for validating the complete template structure
export const templateSchema = Joi.object({
  fields: Joi.array()
    .items(fieldSchema)
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'Template must have at least 1 field',
      'array.max': 'Template cannot have more than 50 fields',
      'any.required': 'Fields array is required',
    }),

  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
});

// Schema for validating the update template request
export const updateTemplateSchema = Joi.object({
  testCaseTemplate: templateSchema.required().messages({
    'any.required': 'testCaseTemplate is required',
  }),
});

// Helper function to validate field ID uniqueness
export const validateFieldIdUniqueness = (fields) => {
  const ids = fields.map((f) => f.id);
  const uniqueIds = new Set(ids);

  if (ids.length !== uniqueIds.size) {
    return {
      valid: false,
      error: 'Field IDs must be unique within the template',
    };
  }

  return { valid: true };
};

// Helper function to validate field name uniqueness
export const validateFieldNameUniqueness = (fields) => {
  const names = fields.map((f) => f.name);
  const uniqueNames = new Set(names);

  if (names.length !== uniqueNames.size) {
    return {
      valid: false,
      error: 'Field names must be unique within the template',
    };
  }

  return { valid: true };
};

// Complete validation function for templates
export const validateTemplate = (template) => {
  // First validate against Joi schema
  const { error, value } = templateSchema.validate(template, { abortEarly: false });

  if (error) {
    return {
      valid: false,
      errors: error.details.map((detail) => detail.message),
    };
  }

  // Check field ID uniqueness
  const idCheck = validateFieldIdUniqueness(value.fields);
  if (!idCheck.valid) {
    return {
      valid: false,
      errors: [idCheck.error],
    };
  }

  // Check field name uniqueness
  const nameCheck = validateFieldNameUniqueness(value.fields);
  if (!nameCheck.valid) {
    return {
      valid: false,
      errors: [nameCheck.error],
    };
  }

  return {
    valid: true,
    value,
  };
};