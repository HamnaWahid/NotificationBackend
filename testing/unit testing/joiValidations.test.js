const status = require('http-status');
const {
  validateApp,
  validateEvents,
  validateMessages,
  validateUpdatingEvents,
  validateUpdatingApp,
  validateUpdatingNotification,
  validateAppPatch,
  validateDeleteEvent,
  validateDeleteNotification,
  validateGetApp,
  validateGetEvent,
  validateGetNotifications,
  validateGetMessages,
} = require('../../middleware/validation'); // Replace with the actual path to your validation module

describe('Validation Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      query: {},
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('validateApp', () => {
    it('should pass validation for valid request body', () => {
      req.body = {
        appName: 'Sample App',
        appDescription: 'Description',
      };

      validateApp(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return bad request for invalid request body', () => {
      req.body = {
        appName: 'A',
        appDescription: 'Description',
      };

      validateApp(req, res, next);

      expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('validateEvents', () => {
    it('should pass validation for valid request body', () => {
      req.body = {
        eventName: 'Event Name',
        eventDescription: 'Description',
      };

      validateEvents(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return bad request for invalid request body', () => {
      req.body = {
        eventName: 'E',
        eventDescription: 'Description',
      };

      validateEvents(req, res, next);

      expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('validateMessages', () => {
    beforeEach(() => {
      req = {
        body: {}, // Initialize an empty request body for each test
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    it('should pass validation for a valid request body', () => {
      req.body = {
        contents: 'Test contents',
        createdBy: 'Test user',
        dateCreated: '2023-08-28',
        dateUpdated: '2023-08-28',
        email: 'test@example.com',
        updatedBy: 'Another user',
        notificationId: '123456',
      };

      validateMessages(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should return a 400 error for an invalid request body', () => {
      req.body = {
        contents: 'Test contents',
        createdBy: 'Test user',
        dateCreated: '2023-08-28',
        dateUpdated: '2023-08-28',
        email: 'invalid-email', // Invalid email
        updatedBy: 'Another user',
        notificationId: '123456',
      };

      validateMessages(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        error: '"email" must be a valid email',
      });
    });
  });

  describe('validateAppPatch', () => {
    beforeEach(() => {
      req = {
        query: {},
        body: {},
      };
    });

    it('should pass validation for no query and body parameters', () => {
      validateAppPatch(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should return a 400 error for query parameters', () => {
      req.query = {
        paramName: 'value',
      };

      validateAppPatch(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No query parameters are allowed.',
      });
    });

    it('should return a 400 error for body parameters', () => {
      req.body = {
        paramName: 'value',
      };

      validateAppPatch(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No request body parameters are allowed.',
      });
    });
  });

  describe('validateUpdatingApp', () => {
    beforeEach(() => {
      req = {
        query: {},
        body: {},
      };
    });

    it('should pass validation for a valid request body', () => {
      req.body = {
        appName: 'Updated App',
        appDescription: 'Updated Description',
        dateCreated: '2023-08-28',
        dateUpdated: '2023-08-28',
        isActive: true,
        isDeleted: false,
        createdBy: 'User',
        updatedBy: 'Admin',
      };

      validateUpdatingApp(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should return a 400 error for empty request body', () => {
      validateUpdatingApp(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No data provided in the request body.',
      });
    });

    it('should return a 400 error for query parameters', () => {
      req.query = {
        paramName: 'value',
      };

      validateUpdatingApp(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No data provided in the request body.',
      });
    });

    it('should return a 400 error for invalid request body', () => {
      req.body = {
        appName: 'T', // Invalid: less than minimum length
        appDescription: 'Test Description',
        dateCreated: 'invalid-date', // Invalid date
        isActive: 'not-a-boolean', // Invalid: not a boolean
        createdBy: 'User',
        updatedBy: 'Admin',
      };

      validateUpdatingApp(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        error: '"appName" length must be at least 3 characters long',
      });
    });
  });

  describe('validateGetEvent', () => {
    it('should pass validation for a valid query', () => {
      req.query = {
        eventName: 'Test Event',
        eventDescription: 'Test Description',
        applicationId: '12345',
        isDeleted: false,
        page: 1,
        pageSize: 10,
      };

      validateGetEvent(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should return a 400 error for invalid query parameters', () => {
      req.query = {
        eventName: 'T', // Invalid: less than minimum length
        applicationId: 'invalid-id', // Invalid: not a valid ID
        isDeleted: 'not-a-boolean', // Invalid: not a boolean
        page: 0, // Invalid: less than minimum value
        pageSize: -5, // Invalid: less than minimum value
      };

      validateGetEvent(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        error: '"eventName" length must be at least 3 characters long',
      });
    });
  });

  describe('validateDeleteEvent', () => {
    it('should pass validation for a valid query', () => {
      req.query = {
        applicationId: '12345',
      };

      validateDeleteEvent(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should return a 400 error for missing or empty query parameter', () => {
      validateDeleteEvent(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        error: '"applicationId" is required',
      });
    });
  });

  describe('validateUpdatingEvents', () => {
    it('should pass validation for a valid request body', () => {
      req.body = {
        eventName: 'Updated Event',
        eventDescription: 'Updated Description',
        dateCreated: '2023-08-28',
        dateUpdated: '2023-08-28',
        isDeleted: false,
        createdBy: 'User',
        updatedBy: 'Admin',
      };

      validateUpdatingEvents(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should return a 400 error for empty request body', () => {
      validateUpdatingEvents(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No data provided in the request body.',
      });
    });

    it('should return a 400 error for invalid request body', () => {
      req.body = {
        eventName: 'T', // Invalid: less than minimum length
        eventDescription: 'Test Description',
        dateCreated: 'invalid-date', // Invalid date
        isDeleted: 'not-a-boolean', // Invalid: not a boolean
        createdBy: 'User',
        updatedBy: 'Admin',
      };

      validateUpdatingEvents(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        error: '"eventName" length must be at least 3 characters long',
      });
    });

    it('should return a 400 error for unwanted query parameters', () => {
      req.query = {
        unwantedParam: 'value',
      };

      validateUpdatingEvents(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No data provided in the request body.',
      });
    });
  });

  describe('validateGetMessages', () => {
    it('should pass validation for a valid query', () => {
      req.query = {
        contents: 'Test contents',
        email: 'test@example.com',
        notificationId: '123456',
        page: 1,
        pageSize: 10,
      };

      validateGetMessages(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should return a 400 error for invalid query parameters', () => {
      req.query = {
        email: 'invalid-email', // Invalid email
        page: 0, // Invalid: less than minimum value
        pageSize: -5, // Invalid: less than minimum value
      };

      validateGetMessages(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        error: '"email" must be a valid email',
      });
    });
  });

  describe('validateGetNotifications', () => {
    it('should return a 400 error for invalid query parameters', () => {
      req.query = {
        templateSubject: 'Test', // Invalid: less than minimum length
        page: 0, // Invalid: less than minimum value
        pageSize: -5, // Invalid: less than minimum value
      };

      validateGetNotifications(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        error: '"templateSubject" length must be at least 5 characters long',
      });
    });
  });

  describe('validateDeleteNotification', () => {
    it('should pass validation for a valid query', () => {
      req.query = {
        eventId: '12345',
      };

      validateDeleteNotification(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('validateUpdatingNotification', () => {
    it('should pass validation for a valid request body', () => {
      req.body = {
        notificationName: 'Updated Notification',
        notificationDescription: 'Updated Description',
        dateCreated: '2023-08-28',
        dateUpdated: '2023-08-28',
        isDeleted: false,
        eventId: '12345',
        templateSubject: 'Updated Subject',
        templateBody: 'Updated Body',
        createdBy: 'User',
        deletedBy: 'Admin',
        metadata: ['data1', 'data2'],
      };

      validateUpdatingNotification(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should return a 400 error for empty request body', () => {
      validateUpdatingNotification(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No data provided in the request body.',
      });
    });

    it('should return a 400 error for invalid request body', () => {
      req.body = {
        notificationName: 'T', // Invalid: less than minimum length
        notificationDescription: 'Test Description',
        dateCreated: 'invalid-date', // Invalid date
        isDeleted: 'not-a-boolean', // Invalid: not a boolean
        eventId: '12345',
        templateSubject: 'Test Subject',
        templateBody: 'Test Body',
        createdBy: 'User',
        deletedBy: 'Admin',
        metadata: 123, // Invalid: not an array of strings
      };

      validateUpdatingNotification(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        error: '"notificationName" length must be at least 3 characters long',
      });
    });

    it('should return a 400 error for unwanted query parameters', () => {
      req.query = {
        unwantedParam: 'value',
      };

      validateUpdatingNotification(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(status.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No data provided in the request body.',
      });
    });
  });
});
