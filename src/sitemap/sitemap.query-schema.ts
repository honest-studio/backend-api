import * as Joi from 'joi';

const SitemapQuerySchema = {
    limit: Joi.number()
        .integer()
        .min(10)
        .max(100000)
        .optional()
        .default(1000),
    lang: Joi.string()
};

export { SitemapQuerySchema };
