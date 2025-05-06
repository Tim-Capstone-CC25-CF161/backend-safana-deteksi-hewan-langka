const Joi = require('joi');

const endangeredImageSchema = Joi.object({
  idHewan: Joi.number().required(),
  imageUrl: Joi.string().uri().required()
});

module.exports = { endangeredImageSchema };