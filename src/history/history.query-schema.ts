import * as Joi from 'joi';

const HistoryWikiSchema = {
    preview: Joi.boolean().default(false),
    diff: Joi.string()
        .valid('metadata', 'full', 'none')
        .default('none')
};

export { HistoryWikiSchema };

