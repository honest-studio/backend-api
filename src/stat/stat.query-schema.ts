import * as Joi from 'joi';

const StatQuerySchema = {
    cache: Joi.boolean().default(true),
    limit: Joi.number().integer().min(1).max(100).default(10),
    period: Joi.boolean()
        .valid('today', 'this-week', 'this-month', 'all-time')
        .default('today'),
    sortby: Joi.boolean()
        .valid('iq', 'votes', 'edits')
        .default('iq'),
    starttime: Joi.number().integer().min(1),
    endtime: Joi.number().integer().min(1),
    lang: Joi.string(),
    user: Joi.string()
};

export { StatQuerySchema };

