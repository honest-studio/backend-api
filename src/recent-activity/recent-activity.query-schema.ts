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
    cache: Joi.boolean().default(true),
    diff: Joi.string()
        .valid('metadata', 'full', 'none')
        .default('none'),
    expiring: Joi.boolean().default(false),
    completed: Joi.boolean().default(false),
    approved: Joi.boolean().default(false),
    account_name: Joi.string(),
    lang: Joi.string(),
    langs: Joi.string().default('en'),
    voter: Joi.string(),
    range: Joi.string()
        .valid('today', 'all')
        .default('today'),
    user_agent: Joi.string().default('chrome')
};

export { RecentActivityQuerySchema };

