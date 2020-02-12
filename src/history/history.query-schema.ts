import * as Joi from 'joi';

const HistoryWikiSchema = {
    cache: Joi.boolean().default(true),
    preview: Joi.boolean().default(false),
    diff: Joi.string()
        .valid('metadata', 'full', 'none')
        .default('none')
};

export { HistoryWikiSchema };

