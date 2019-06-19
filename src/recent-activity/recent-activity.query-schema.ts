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
    diff: Joi.string()
        .valid('metadata', 'full', 'none')
        .default('none'),
    expiring: Joi.boolean().default(false),
    completed: Joi.boolean().default(false),
    langs: Joi.string(),
    range: Joi.string()
        .valid('today', 'all')
        .default('today')
};

export { RecentActivityQuerySchema };

