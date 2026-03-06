import Joi from 'joi';

// POST /api/testcases/generate
export const generateSchema = Joi.object({
  projectId: Joi.string().required(),
  description: Joi.string().min(10).max(2000).required().messages({
    'string.min': 'Description must be at least 10 characters',
    'string.max': 'Description cannot exceed 2000 characters',
    'any.required': 'Description is required',
  }),
  options: Joi.object({
    count: Joi.number().integer().min(1).max(20).default(5),
    scenarios: Joi.array()
      .items(Joi.string().valid('positive', 'negative', 'edge', 'boundary'))
      .min(1)
      .default(['positive']),
  }).default({ count: 5, scenarios: ['positive'] }),
});

// POST /api/testcases
export const saveTestCasesSchema = Joi.object({
  projectId: Joi.string().required(),
  testCases: Joi.array()
    .items(
      Joi.object({
        data: Joi.object().required(),
        status: Joi.string().valid('draft', 'active', 'archived').default('draft'),
        generatedBy: Joi.string().valid('ai', 'manual').default('ai'),
        tags: Joi.array().items(Joi.string().max(30)).max(20).default([]),
      })
    )
    .min(1)
    .max(50)
    .required(),
});

// PUT /api/testcases/:id
export const updateTestCaseSchema = Joi.object({
  data: Joi.object().optional(),
  status: Joi.string().valid('draft', 'active', 'archived').optional(),
  tags: Joi.array().items(Joi.string().max(30)).max(20).optional(),
}).min(1);

// POST /api/testcases/bulk-delete
export const bulkDeleteSchema = Joi.object({
  ids: Joi.array().items(Joi.string()).min(1).max(100).required(),
});

// POST /api/testcases/bulk-status
export const bulkStatusSchema = Joi.object({
  ids: Joi.array().items(Joi.string()).min(1).max(100).required(),
  status: Joi.string().valid('draft', 'active', 'archived').required(),
});
