const { errorResponse } = require('../utils/response');

const validateBody = (requiredFields = []) => {
  return (req, res, next) => {
    const errors = [];

    requiredFields.forEach((field) => {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        errors.push({ field, message: `${field} is required` });
      }
    });

    if (errors.length > 0) {
      return errorResponse(res, 'Validation failed', errors, 400);
    }

    return next();
  };
};

module.exports = {
  validateBody,
};
