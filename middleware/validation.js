/* eslint-disable consistent-return */
const Joi = require('joi');
const status = require('http-status');

const validateUser = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  });
  const { error } = schema.validate(req.body);

  if (error) {
    return res
      .status(status.BAD_REQUEST)
      .json({ error: error.details[0].message });
  }
  next();
};

const validateApp = (req, res, next) => {
  const schema = Joi.object({
    appName: Joi.string().min(3).max(50).required(),
    appDescription: Joi.string().min(3).max(50).required(),
    dateCreated: Joi.date(),
    dateUpdated: Joi.date(),
    isActive: Joi.boolean(),
    isDeleted: Joi.boolean(),
    createdBy: Joi.string(),
    updatedBy: Joi.string(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res
      .status(status.BAD_REQUEST)
      .json({ error: error.details[0].message });
  }
  next();
};

const validateAppPatch = (req, res, next) => {
  const querySchema = Joi.object({}); // Empty query schema to disallow query parameters
  const bodySchema = Joi.object({}); // Empty body schema to disallow body parameters

  const { error: queryError } = querySchema.validate(req.query);
  if (queryError) {
    return res
      .status(status.BAD_REQUEST)
      .json({ error: 'No query parameters are allowed.' });
  }

  const { error: bodyError } = bodySchema.validate(req.body);
  if (bodyError) {
    return res
      .status(status.BAD_REQUEST)
      .json({ error: 'No request body parameters are allowed.' });
  }

  next();
};

const validateUpdatingApp = (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return res
      .status(status.BAD_REQUEST)
      .json({ error: 'No data provided in the request body.' });
  }

  if (Object.keys(req.query).length > 0) {
    return res
      .status(status.BAD_REQUEST)
      .json({ error: 'No query parameters are allowed.' });
  }

  const schema = Joi.object({
    appName: Joi.string().min(3).max(50),
    appDescription: Joi.string().min(3).max(50),
    dateCreated: Joi.date(),
    dateUpdated: Joi.date(),
    isActive: Joi.boolean(),
    isDeleted: Joi.boolean(),
    createdBy: Joi.string(),
    updatedBy: Joi.string(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res
      .status(status.BAD_REQUEST)
      .json({ error: error.details[0].message });
  }
  next();
};

const validateEvents = (req, res, next) => {
  const schema = Joi.object({
    eventName: Joi.string().min(3).max(100).required(),
    eventDescription: Joi.string().min(3).max(200).required(),
    dateCreated: Joi.date(),
    dateUpdated: Joi.date(),
    isDeleted: Joi.boolean(),
    createdBy: Joi.string(),
    isActive: Joi.boolean(),
    updatedBy: Joi.string(),
    applicationId: Joi.string(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res
      .status(status.BAD_REQUEST)
      .json({ error: error.details[0].message });
  }
  next();
};

// const validateGetEvent = (req, res, next) => {
//   const querySchema = Joi.object({
//     eventName: Joi.string().min(3).max(50),
//     eventDescription: Joi.string().min(3).max(50),
//     applicationId: Joi.string(), // You might want to add any specific validation rules here
//     isDeleted: Joi.boolean(),
//     page: Joi.number().integer().min(1), // Page number, minimum 1
//     pageSize: Joi.number().integer().min(1),
//   });

//   const { error: queryError } = querySchema.validate(req.query);
//   if (queryError) {
//     return res
//       .status(status.BAD_REQUEST)
//       .json({ error: queryError.details[0].message });
//   }
//   next();
// };

const validateDeleteEvent = (req, res, next) => {
  const querySchema = Joi.object({});

  const bodySchema = Joi.object({}); // Empty body schema to disallow body parameters

  const { error: queryError } = querySchema.validate(req.query);
  if (queryError) {
    return res
      .status(status.BAD_REQUEST)
      .json({ error: queryError.details[0].message });
  }

  const { error: bodyError } = bodySchema.validate(req.body);
  if (bodyError) {
    return res
      .status(status.BAD_REQUEST)
      .json({ error: 'No request body parameters are allowed.' });
  }

  next();
};

const validateUpdatingEvents = (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return res
      .status(status.BAD_REQUEST)
      .json({ error: 'No data provided in the request body.' });
  }

  const schema = Joi.object({
    eventName: Joi.string().min(3).max(100),
    eventDescription: Joi.string().min(3).max(200),
    dateCreated: Joi.date(),
    dateUpdated: Joi.date(),
    isDeleted: Joi.boolean(),
    createdBy: Joi.string(),
    updatedBy: Joi.string(),
    isActive: Joi.boolean(),
  });

  const { error: bodyError } = schema.validate(req.body);
  if (bodyError) {
    return res
      .status(status.BAD_REQUEST)
      .json({ error: bodyError.details[0].message });
  }

  const allowedQueryParams = ['pageSize', 'page', 'applicationId'];

  const unwantedQueryParams = Object.keys(req.query).filter(
    (param) => !allowedQueryParams.includes(param),
  );
  if (unwantedQueryParams.length > 0) {
    return res.status(status.BAD_REQUEST).json({
      error: `Unwanted query parameters found: ${unwantedQueryParams.join(
        ', ',
      )}`,
    });
  }

  next();
};

const validateMessages = (req, res, next) => {
  // Remove the metadata field from req.body
  const { metadata, ...bodyWithoutMetadata } = req.body;

  const schema = Joi.object({
    contents: Joi.string(),
    createdBy: Joi.string(),
    dateCreated: Joi.date(),
    dateUpdated: Joi.date(),
    email: Joi.string().email().required(),
    updatedBy: Joi.string(),
    notificationId: Joi.string(),
  });

  const { error } = schema.validate(bodyWithoutMetadata); // Validate without metadata

  if (error) {
    return res
      .status(status.BAD_REQUEST)
      .json({ error: error.details[0].message });
  }
  next();
};

const validateGetMessages = (req, res, next) => {
  const querySchema = Joi.object({
    contents: Joi.string(),
    email: Joi.string().email().required(),
    notificationId: Joi.string(),
    page: Joi.number().integer().min(1), // Page number, minimum 1
    pageSize: Joi.number().integer().min(1),
  });

  const { error: queryError } = querySchema.validate(req.query);
  if (queryError) {
    return res
      .status(status.BAD_REQUEST)
      .json({ error: queryError.details[0].message });
  }
  next();
};
//
const validateNotification = (req, res, next) => {
  const schema = Joi.object({
    notificationName: Joi.string().min(3).max(100).required(),
    notificationDescription: Joi.string().min(3).max(200).required(),
    dateCreated: Joi.date(),
    isActive: Joi.boolean(),
    dateUpdated: Joi.date(),
    isDeleted: Joi.boolean(),
    eventId: Joi.string(),
    templateSubject: Joi.string().min(5).max(100).required(),
    templateBody: Joi.string().min(10).max(1000).required(),
    createdBy: Joi.string(),
    deletedBy: Joi.string(),
    metadata: Joi.array().items(Joi.string()), // JSON object
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res
      .status(status.BAD_REQUEST)
      .json({ error: error.details[0].message });
  }
  next();
};

// const validateGetNotifications = (req, res, next) => {
//   const querySchema = Joi.object({
//     isDeleted: Joi.boolean(),
//     eventId: Joi.string(),
//     templateSubject: Joi.string().min(5).max(100),
//     templateBody: Joi.string().min(10).max(1000),
//     page: Joi.number().integer().min(1), // Page number, minimum 1
//     pageSize: Joi.number().integer().min(1),
//     notificationName: Joi.string(),
//     notificationDescription: Joi.string(),
//   });

//   const { error: queryError } = querySchema.validate(req.query);
//   if (queryError) {
//     return res
//       .status(status.BAD_REQUEST)
//       .json({ error: queryError.details[0].message });
//   }
//   next();
// };

const validateDeleteNotification = (req, res, next) => {
  const querySchema = Joi.object({
    eventId: Joi.string(), // Only allow eventId in query
  });

  const bodySchema = Joi.object({}); // Empty body schema to disallow body parameters

  const { error: queryError } = querySchema.validate(req.query);
  if (queryError) {
    return res
      .status(status.BAD_REQUEST)
      .json({ error: queryError.details[0].message });
  }

  const { error: bodyError } = bodySchema.validate(req.body);
  if (bodyError) {
    return res
      .status(status.BAD_REQUEST)
      .json({ error: 'No request body parameters are allowed.' });
  }

  next();
};

const validateUpdatingNotification = (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return res
      .status(status.BAD_REQUEST)
      .json({ error: 'No data provided in the request body.' });
  }

  const schema = Joi.object({
    notificationName: Joi.string().min(3).max(100),
    notificationDescription: Joi.string().min(3).max(200),
    dateCreated: Joi.date(),
    dateUpdated: Joi.date(),
    isDeleted: Joi.boolean(),
    eventId: Joi.string(),
    templateSubject: Joi.string().min(5).max(100),
    templateBody: Joi.string().min(10).max(1000),
    createdBy: Joi.string(),
    deletedBy: Joi.string(),
    metadata: Joi.array().items(Joi.string()), // JSON object
  });

  const { error: bodyError } = schema.validate(req.body);
  if (bodyError) {
    return res
      .status(status.BAD_REQUEST)
      .json({ error: bodyError.details[0].message });
  }

  const allowedQueryParams = ['eventId', 'applicationId', 'page', 'pageSize'];

  const unwantedQueryParams = Object.keys(req.query).filter(
    (param) => !allowedQueryParams.includes(param),
  );
  if (unwantedQueryParams.length > 0) {
    return res.status(status.BAD_REQUEST).json({
      error: `Unwanted query parameters found: ${unwantedQueryParams.join(
        ', ',
      )}`,
    });
  }

  next();
};

module.exports = {
  validateUser,
  validateApp,
  validateEvents,
  validateMessages,
  validateNotification,
  validateUpdatingEvents,
  validateUpdatingApp,
  validateUpdatingNotification,
  validateAppPatch,
  validateDeleteEvent,
  validateDeleteNotification,
  // validateGetApp,
  // validateGetEvent,
  // validateGetNotifications,
  validateGetMessages,
};
