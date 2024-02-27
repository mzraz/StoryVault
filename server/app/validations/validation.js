// VALIDATION
const Joi = require('joi');
const {
    joiPassword
} = require('joi-password');

// CATEGORY VALIDATION
const createChapterValidations = (data) => {
    const schema = Joi.object({
        name: Joi.string().required(),
    });

    return schema.validate(data);
};

module.exports = {
    createChapterValidations
}