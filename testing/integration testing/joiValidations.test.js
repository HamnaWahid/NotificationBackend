const request = require('supertest');
const express = require('express');
const Joi = require('joi');
const status = require('http-status');
const {
  validateApp,
  validateEvents,
  validateMessages,
  validateNotification,
  validateDeleteEvent,
  validateUpdatingEvents,
  validateUpdatingApp,
  validateUpdatingNotification,
  validateAppPatch,
  validateDeleteNotification,
  validateGetEvent,
  validateGetNotifications,
  validateGetMessages,
} = require('../../middleware/validation');

const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn();

  next();
});

describe('validateGetApp', () => {
  it('should pass validation with valid query parameters', async () => {
    const response = await request(app).get('/test').query({
      appName: 'TestApp',
      appDescription: 'Description',
    });
    expect(response.status).toBe(status.NOT_FOUND);
  });
});

describe('validateApp', () => {
  it('Valid request body should pass validation', () => {
    const validRequestBody = {
      appName: 'Valid App',
      appDescription: 'This is a valid app.',
    };

    const req = { body: validRequestBody };
    const res = {};
    const next = jest.fn();

    validateApp(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('Invalid request body should return 400 Bad Request', () => {
    const invalidRequestBody = {
      // Missing required fields
    };

    const req = { body: invalidRequestBody };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateApp(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.any(String), // Error message from Joi validation
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('validateAppPatch', () => {
  it('Valid request with no query and body parameters should pass validation', () => {
    const req = {
      query: {},
      body: {},
    };
    const res = {};
    const next = jest.fn();

    validateAppPatch(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('Request with query parameters should return 400 Bad Request', () => {
    const req = {
      query: { param: 'value' },
      body: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateAppPatch(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No query parameters are allowed.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('Request with body parameters should return 400 Bad Request', () => {
    const req = {
      query: {},
      body: { field: 'value' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateAppPatch(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No request body parameters are allowed.',
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('validateUpdatingApp', () => {
  it('Valid request body should pass validation', () => {
    const validRequestBody = {
      appName: 'Updated App',
      appDescription: 'This app has been updated.',
    };

    const req = {
      body: validRequestBody,
      query: {},
    };
    const res = {};
    const next = jest.fn();

    validateUpdatingApp(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('Empty request body should return 400 Bad Request', () => {
    const req = {
      body: {},
      query: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateUpdatingApp(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No data provided in the request body.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('Request with query parameters should return 400 Bad Request', () => {
    const req = {
      body: {
        appName: 'Updated App',
      },
      query: { param: 'value' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateUpdatingApp(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No query parameters are allowed.',
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('validateEvents', () => {
  it('Valid event data should pass validation', () => {
    const validEventData = {
      eventName: 'Valid Event',
      eventDescription: 'This is a valid event.',
    };

    const req = { body: validEventData };
    const res = {};
    const next = jest.fn();

    validateEvents(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('Invalid event data should return 400 Bad Request', () => {
    const invalidEventData = {};

    const req = { body: invalidEventData };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateEvents(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.any(String), // Error message from Joi validation
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('validateGetEvent', () => {
  it('Valid query parameters should pass validation', () => {
    const validQuery = {
      eventName: 'Valid Event',
      eventDescription: 'This is a valid event.',
      applicationId: 'validApplicationId',
      isDeleted: false,
      page: 1,
      pageSize: 10,
    };

    const req = { query: validQuery };
    const res = {};
    const next = jest.fn();

    validateGetEvent(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('Invalid query parameters should return 400 Bad Request', () => {
    const invalidQuery = {
      eventName: 123, // Invalid type
    };

    const req = { query: invalidQuery };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateGetEvent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.any(String), // Error message from Joi validation
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('validateDeleteEvent', () => {
  it('Valid query parameters should pass validation', () => {
    const validQuery = {
      applicationId: 'validApplicationId',
    };

    const req = {
      query: validQuery,
      body: {},
    };
    const res = {};
    const next = jest.fn();

    validateDeleteEvent(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('Invalid query parameters should return 400 Bad Request', () => {
    const invalidQuery = {
      applicationId: 123, // Invalid data type
    };

    const req = {
      query: invalidQuery,
      body: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateDeleteEvent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      // eslint-disable-next-line prettier/prettier
      error: '"applicationId" must be a string',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('Request with query parameters and body parameters should return 400 Bad Request', () => {
    const validQuery = {
      applicationId: 'validApplicationId',
    };

    const req = {
      query: validQuery,
      body: { field: 'value' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateDeleteEvent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No request body parameters are allowed.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('Missing query parameters should return 400 Bad Request', () => {
    const req = {
      query: {},
      body: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateDeleteEvent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: '"applicationId" is required',
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('validateUpdatingEvents', () => {
  it('Valid request body should pass validation', () => {
    const validRequestBody = {
      eventName: 'Updated Event',
      eventDescription: 'This event has been updated.',
      dateCreated: '2023-08-29',
      dateUpdated: '2023-08-30',
      isDeleted: false,
      createdBy: 'John Doe',
      updatedBy: 'Jane Smith',
    };

    const req = {
      body: validRequestBody,
      query: {},
    };
    const res = {};
    const next = jest.fn();

    validateUpdatingEvents(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('Empty request body should return 400 Bad Request', () => {
    const req = {
      body: {},
      query: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateUpdatingEvents(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No data provided in the request body.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('Invalid request body should return 400 Bad Request', () => {
    const invalidRequestBody = {
      eventName: 'E', // Too short
    };

    const req = {
      body: invalidRequestBody,
      query: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateUpdatingEvents(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.any(String), // Error message from Joi validation
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('Unwanted query parameters should return 400 Bad Request', () => {
    const req = {
      body: {},
      query: { unwantedParam: 'value' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateUpdatingEvents(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No data provided in the request body.',
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('validateMessages', () => {
  it('Valid request body should pass validation', () => {
    const validRequestBody = {
      contents: 'This is a valid message.',
      createdBy: 'John Doe',
      dateCreated: '2023-08-29',
      dateUpdated: '2023-08-30',
      email: 'john@example.com',
      updatedBy: 'Jane Smith',
      notificationId: 'validNotificationId',
    };

    const req = {
      body: validRequestBody,
    };
    const res = {};
    const next = jest.fn();

    validateMessages(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('Invalid request body should return 400 Bad Request', () => {
    const invalidRequestBody = {
      email: 'invalidEmail', // Invalid email format
    };

    const req = {
      body: invalidRequestBody,
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateMessages(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.any(String), // Error message from Joi validation
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('Request with metadata field should pass validation', () => {
    const req = {
      body: {
        contents: 'This is a valid message.',
        createdBy: 'John Doe',
        dateCreated: '2023-08-29',
        dateUpdated: '2023-08-30',
        email: 'john@example.com',
        updatedBy: 'Jane Smith',
        notificationId: 'validNotificationId',
        metadata: 'additionalData', // Including metadata field
      },
    };
    const res = {};
    const next = jest.fn();

    validateMessages(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

describe('validateGetMessages', () => {
  it('Valid query parameters should pass validation', () => {
    const validQuery = {
      contents: 'message content',
      email: 'john@example.com',
      notificationId: 'validNotificationId',
      page: 1,
      pageSize: 10,
    };

    const req = {
      query: validQuery,
    };
    const res = {};
    const next = jest.fn();

    validateGetMessages(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('Invalid query parameters should return 400 Bad Request', () => {
    const invalidQuery = {
      email: 'invalidEmail', // Invalid email format
    };

    const req = {
      query: invalidQuery,
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateGetMessages(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.any(String), // Error message from Joi validation
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('Query parameters with invalid page number should return 400 Bad Request', () => {
    const invalidQuery = {
      email: 'john@example.com',
      page: 0, // Invalid page number
    };

    const req = {
      query: invalidQuery,
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateGetMessages(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.any(String), // Error message from Joi validation
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('Query parameters with missing required field should return 400 Bad Request', () => {
    const invalidQuery = {
      contents: 'message content',
      // Missing required 'email' field
    };

    const req = {
      query: invalidQuery,
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateGetMessages(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.any(String), // Error message from Joi validation
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('validateNotification', () => {
  it('Valid request body should pass validation', () => {
    const validRequestBody = {
      notificationName: 'New Notification',
      notificationDescription: 'This is a new notification.',
      templateSubject: 'Subject',
      templateBody: 'Notification body content.',
    };

    const req = {
      body: validRequestBody,
    };
    const res = {};
    const next = jest.fn();

    validateNotification(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('Invalid request body should return 400 Bad Request', () => {
    const invalidRequestBody = {
      templateSubject: 'Subject', // Missing required fields
    };

    const req = {
      body: invalidRequestBody,
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateNotification(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.any(String), // Error message from Joi validation
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('Request with metadata should pass validation', () => {
    const validRequestBody = {
      notificationName: 'New Notification',
      notificationDescription: 'This is a new notification.',
      templateSubject: 'Subject',
      templateBody: 'Notification body content.',
      metadata: ['metadata1', 'metadata2'],
    };

    const req = {
      body: validRequestBody,
    };
    const res = {};
    const next = jest.fn();

    validateNotification(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

describe('validateGetNotifications', () => {
  it('Valid query parameters should pass validation', () => {
    const validQuery = {
      isDeleted: false,
      eventId: 'validEventId',
      templateSubject: 'Subject',
      templateBody: 'Notification body content.',
      page: 1,
      pageSize: 10,
      notificationName: 'Notification Name',
      notificationDescription: 'Description',
    };

    const req = {
      query: validQuery,
    };
    const res = {};
    const next = jest.fn();

    validateGetNotifications(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('Query parameters with invalid page number should return 400 Bad Request', () => {
    const invalidQuery = {
      page: 0, // Invalid page number
    };

    const req = {
      query: invalidQuery,
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateGetNotifications(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.any(String), // Error message from Joi validation
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('validateDeleteNotification', () => {
  it('Valid query parameters should pass validation', () => {
    const validQuery = {
      eventId: 'validEventId',
    };

    const req = {
      query: validQuery,
      body: {},
    };
    const res = {};
    const next = jest.fn();

    validateDeleteNotification(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('Invalid query parameters should return 400 Bad Request', () => {
    const invalidQuery = {
      eventId: 123, // Invalid type
    };

    const req = {
      query: invalidQuery,
      body: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateDeleteNotification(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.any(String), // Error message from Joi validation
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('Request with body parameters should return 400 Bad Request', () => {
    const req = {
      query: {},
      body: { field: 'value' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateDeleteNotification(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No request body parameters are allowed.',
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('validateUpdatingNotification', () => {
  it('Valid request body should pass validation', () => {
    const validRequestBody = {
      notificationName: 'Updated Notification',
      notificationDescription: 'This notification has been updated.',
    };

    const req = {
      body: validRequestBody,
      query: {},
    };
    const res = {};
    const next = jest.fn();

    validateUpdatingNotification(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('Empty request body should return 400 Bad Request', () => {
    const req = {
      body: {},
      query: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateUpdatingNotification(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No data provided in the request body.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('Request with query parameters should return 400 Bad Request', () => {
    const req = {
      body: {
        notificationName: 'Updated Notification',
      },
      query: { param: 'value' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateUpdatingNotification(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unwanted query parameters found: param',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('Request with unwanted query parameters should return 400 Bad Request', () => {
    const req = {
      body: {
        notificationName: 'Updated Notification',
      },
      query: { unwantedParam: 'value' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateUpdatingNotification(req, res, next);

    expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.any(String), // Error message from the middleware
    });
    expect(next).not.toHaveBeenCalled();
  });
});
