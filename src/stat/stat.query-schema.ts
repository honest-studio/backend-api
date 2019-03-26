import * as Joi from 'joi';

const StatQuerySchema = {
    cache: Joi.boolean().default(true),
};

export { StatQuerySchema };
