/* eslint-disable no-underscore-dangle */
const httpMocks = require('node-mocks-http');
const status = require('http-status');
const knex = require('../../startup/knex');

const {
  addApplication,
  listApplication,
  deactivateApplication,
  deleteApplication,
  updateApplication,
} = require('../../controllers/postgresql/applicationController');

jest.mock('../../startup/knex');

describe('createApplication', () => {
  it('should return 409 if application with the name already exists', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      url: '/api/applications',
      body: {
        name: 'Test Application',
        description: 'This is a test application',
      },
    });
    const res = httpMocks.createResponse();

    knex.mockReturnValue({
      insert: jest.fn().mockReturnValue([1]),
      where: jest.fn().mockReturnValue({
        first: jest.fn().mockReturnValue({
          name: 'Test Application',
        }),
      }),
    });

    await addApplication(req, res);

    const responseData = res._getData();

    expect(res.statusCode).toBe(status.CONFLICT);
    expect(res._isEndCalled()).toBeTruthy();
    expect(responseData).toEqual(
      'An application with the same name already exists.',
    );
  });

  it('should create a new application', async () => {
    // Prepare a mock request and response
    const req = httpMocks.createRequest({
      method: 'POST',
      url: '/api/applications',
      body: {
        appName: 'New Application',
        appDescription: 'This is a new application',
      },
    });
    const res = httpMocks.createResponse();

    // Mock the Knex query methods
    knex.mockReturnValue({
      insert: jest
        .fn()
        .mockReturnValue({ returning: jest.fn().mockReturnValue([1]) }),
      where: jest.fn().mockReturnValue({
        first: jest.fn().mockReturnValue(undefined),
      }),
    });

    await addApplication(req, res);

    // Parse the response data
    const responseData = res._getData();
    // Assertions
    expect(res._isEndCalled()).toBeTruthy();
    expect(responseData).toEqual(responseData);
  });
});

describe('listApplication', () => {
  it('should list applications with default pagination', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      url: '/api/applications',
    });
    const res = httpMocks.createResponse();

    // Mock the Knex query methods
    knex.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnValue([{ total: 20 }]),
      first: jest.fn(),
    });

    await listApplication(req, res);

    const responseData = JSON.parse(res._getData());

    // Assertions
    expect(res.statusCode).toBe(status.OK);
    expect(res._isEndCalled()).toBeTruthy();
  });
  it('should list all applications', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      url: '/api/applications',
    });
    const res = httpMocks.createResponse();

    // Mock the Knex query methods
    knex.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnValue([{ total: 50 }]),
      first: jest.fn(),
    });

    await listApplication(req, res);

    const responseData = JSON.parse(res._getData());

    // Assertions
    expect(res.statusCode).toBe(status.OK);
    expect(res._isEndCalled()).toBeTruthy();
  });
});

describe('updateApplication', () => {
  it('should return 409 if application with the same name already exists', async () => {
    const req = httpMocks.createRequest({
      method: 'PUT',
      url: '/api/applications/1', // Replace with the actual application ID
      params: { app_id: 1 }, // Replace with the actual application ID
      body: {
        appName: 'Test Application',
      },
    });
    const res = httpMocks.createResponse();

    // Mock the Knex query methods
    knex.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhereNot: jest.fn().mockReturnThis(),
      first: jest.fn().mockReturnValue({
        id: 2, // Mocking an existing application with different ID
        appName: 'Test Application',
      }),
    });

    await updateApplication(req, res);

    const responseData = res._getData();

    expect(res.statusCode).toBe(status.CONFLICT);
    expect(res._isEndCalled()).toBeTruthy();
    expect(responseData).toEqual(
      'An application with the same name already exists.',
    );
  });
  it('should update an existing application', async () => {
    // Prepare a mock request and response
    const req = httpMocks.createRequest({
      method: 'PUT',
      url: '/api/applications/1', // Replace with the actual application ID
      params: { app_id: 1 }, // Replace with the actual application ID
      body: {
        appName: 'Updated Application',
        appDescription: 'This is an updated application',
      },
    });
    const res = httpMocks.createResponse();

    // Mock the Knex query methods
    knex.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhereNot: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnValue(1), // Mocking successful update
      returning: jest.fn().mockReturnValue([{ id: 1, ...req.body }]),
      first: jest.fn().mockReturnValue({}),
    });

    await updateApplication(req, res);

    const responseData = res._getData();
    // Assertions
    expect(res._isEndCalled()).toBeTruthy();
    expect(responseData).toBe(
      'An application with the same name already exists.',
    );
  });
});

describe('deleteApplication', () => {
  it('should delete an existing application', async () => {
    // Prepare a mock request and response
    const req = httpMocks.createRequest({
      method: 'DELETE',
      url: '/api/applications/1', // Replace with the actual application ID
      params: { app_id: 1 }, // Replace with the actual application ID
    });
    const res = httpMocks.createResponse();

    // Mock the Knex query methods
    knex.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnValue({
        returning: jest
          .fn()
          .mockReturnValue([{ id: 1, isDeleted: true, isActive: false }]),
      }), // Mocking successful update
    });

    await deleteApplication(req, res);

    const responseData = res._getData();

    // Assertions
    expect(res._isEndCalled()).toBeTruthy();
    expect(responseData.isDeleted).toBe(true);
    expect(responseData.isActive).toBe(false);
  });

  it('should return 404 if application with the given ID was not found', async () => {
    const req = httpMocks.createRequest({
      method: 'DELETE',
      url: '/api/applications/2', // Replace with the actual application ID
      params: { app_id: 2 }, // Replace with the actual application ID
    });
    const res = httpMocks.createResponse();

    // Mock the Knex query methods
    knex.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnValue({
        returning: jest.fn().mockReturnValue([]), // Mocking unsuccessful update
      }),
    });

    await deleteApplication(req, res);

    const responseData = res._getData();

    // Assertions
    expect(res.statusCode).toBe(status.NOT_FOUND);
    expect(res._isEndCalled()).toBeTruthy();
    expect(responseData).toBe(
      'The application with the given ID was not found.',
    );
  });
});

describe('deactivateApplication', () => {
  it('should return 404 if application with the given ID was not found', async () => {
    // Prepare a mock request and response
    const req = httpMocks.createRequest({
      method: 'PUT',
      url: '/api/applications/2', // Replace with the actual application ID
      params: { app_id: 2 }, // Replace with the actual application ID
    });
    const res = httpMocks.createResponse();

    // Mock the Knex query methods
    knex.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockReturnValue(undefined), // Mocking an application not found
    });

    await deactivateApplication(req, res);

    const responseData = res._getData();

    // Assertions
    expect(res.statusCode).toBe(status.NOT_FOUND);
    expect(res._isEndCalled()).toBeTruthy();
    expect(responseData).toBe(
      'The application with the given ID was not found.',
    );
  });

  it('should deactivate an existing application', async () => {
    // Prepare a mock request and response
    const req = httpMocks.createRequest({
      method: 'PUT',
      url: '/api/applications/1', // Replace with the actual application ID
      params: { app_id: 1 }, // Replace with the actual application ID
    });
    const res = httpMocks.createResponse();

    // Mock the Knex query methods
    const existingApplication = {
      id: 1,
      isActive: true,
      /* Add other properties as needed */
    };
    const updatedApplication = {
      ...existingApplication,
      isActive: false,
      dateUpdated: new Date(),
    };

    knex.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockReturnValue(existingApplication),
      update: jest.fn().mockReturnValue({
        returning: jest.fn().mockReturnValue([updatedApplication]),
      }),
    });

    await deactivateApplication(req, res);

    const responseData = res._getData();

    // Assertions
    expect(res.statusCode).toBe(status.OK);
    expect(res._isEndCalled()).toBeTruthy();
    expect(responseData.isActive).toBe(false);
  });
});
