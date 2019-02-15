import * as Joi from 'joi';

const HistoryWikiSchema = {
    preview: Joi.boolean().default(false),
    diff: Joi.string().valid('percent', 'full', 'none').default('none')
};

export { HistoryWikiSchema };
