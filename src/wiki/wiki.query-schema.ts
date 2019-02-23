import * as Joi from 'joi';

const WikiQuerySchema = {
    json: Joi.boolean().default(false)
};

export { WikiQuerySchema };
