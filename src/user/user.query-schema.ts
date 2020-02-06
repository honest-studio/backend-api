import * as Joi from 'joi';

const UserQuerySchema = {
    offset: Joi.number()
        .integer()
        .min(0)
        .optional()
        .default(0),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(1000)
        .optional()
        .default(10)
};

export { UserQuerySchema };

