import * as Joi from 'joi';

const RecentActivityQuerySchema = {
    offset: Joi.number()
        .integer()
        .min(0)
        .optional()
        .default(0),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .optional()
        .default(10),
    preview: Joi.boolean().default(false),
    diff_percent: Joi.boolean().default(false)
};

export { RecentActivityQuerySchema };
