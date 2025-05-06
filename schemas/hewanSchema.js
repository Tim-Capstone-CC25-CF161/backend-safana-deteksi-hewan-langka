const Joi = require('joi');

const hewanSchema = Joi.object({
  nama: Joi.string().max(100).required(),
  namaLatin: Joi.string().max(100).required(),
  populasi: Joi.number().integer().min(0).required(),
  endangeredStatus: Joi.string().max(50).required(),
});

module.exports = { hewanSchema };