import * as Joi from 'joi';

const ProposalSchema = {
    preview: Joi.boolean().default(false),
    cache: Joi.boolean().default(true),
    diff: Joi.string()
        .valid('metadata', 'full', 'none')
        .default('none')
};

export { ProposalSchema };

