import * as Joi from 'joi';

const StatQuerySchema = {
    cache: Joi.boolean().default(true),
    period: Joi.boolean().valid('today', 'this-week', 'this-month', 'all-time').default('all-time'),
    since: Joi.number()
};

export { StatQuerySchema };
