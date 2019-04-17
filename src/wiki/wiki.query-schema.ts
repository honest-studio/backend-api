import * as Joi from 'joi';

const WikiQuerySchema = {
    cache: Joi.boolean().default(true)
};

export { WikiQuerySchema };
