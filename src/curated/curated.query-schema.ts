import * as Joi from 'joi';

const CuratedQuerySchema = {
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
    user: Joi.string(),
    sort: Joi.string().valid('none', 'recent', 'viewed', 'size').default('none')
};

export { CuratedQuerySchema };

