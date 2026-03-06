import Joi from 'joi';

export const connectSheetSchema = Joi.object({
  sheetUrl: Joi.string().uri().optional(),
  sheetId: Joi.string().optional(),
}).or('sheetUrl', 'sheetId');
