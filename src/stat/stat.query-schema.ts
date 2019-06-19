import * as Joi from 'joi';

const StatQuerySchema = {
    cache: Joi.boolean().default(true),
    limit: Joi.number().integer().min(1).max(100).default(10),
    period: Joi.boolean()
        .valid('today', 'this-week', 'this-month', 'all-time')
        .default('all-time'),
    since: Joi.number()
};

export { StatQuerySchema };

