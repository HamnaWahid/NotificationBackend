/* eslint-disable no-underscore-dangle */
const request = require('supertest');
const mongoose = require('mongoose');
const config = require('config');
const status = require('http-status');
const { Application } = require('../../../models/application');
// Adjust the path accordingly
let app;

describe('Application controller', () => {
  beforeAll(async () => {
    app = require('../../../index');
    const connectionString = config.get('mongodb');
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await app.close();
    await mongoose.disconnect();
  });
  describe('addApplication', () => {
    // Clear the database after each test
    afterEach(async () => {
      await Application.deleteMany();
    });

    it('should add a new application', async () => {
      const newApplication = {
        appName: 'Test App',
        appDescription: 'This is a test application',
      };

      const response = await request(app)
        .post('/api/applications')
        .send(newApplication);

      expect(response.body.appName).toBe(newApplication.appName);
      expect(response.body.appDescription).toBe(newApplication.appDescription);
      // Check if the application was saved in the database
      const savedApplication = await Application.findOne({
        appName: newApplication.appName,
      });

      expect(savedApplication).toBeDefined();
    });
  });

  describe('listApplication', () => {
    beforeEach(async () => {
      await Application.deleteMany();
    });

    it('should list applications with pagination and filters', async () => {
      const mockApplication = {
        appDescription: 'Test App description',
        appName: 'TestApp',
        isActive: true,
      };
      await Application.create(mockApplication);

      const response = await request(app).get('/api/applications').query({
        page: 1,
        pageSize: 5,
        isActive: 'true',
        appName: 'TestApp',
      });

      expect(response.status).toBe(status.OK);
      expect(response.body.applications).toHaveLength(1);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.totalPages).toBe(1);
      expect(response.body.pageSize).toBe(5);
      expect(response.body.totalApplications).toBe(1);
    });

    it('should list all applications without filters', async () => {
      const mockApplications = [
        { appName: 'App1', appDescription: 'this is test' },
        { appName: 'App2', appDescription: 'this is test' },
      ];
      await Application.insertMany(mockApplications);

      const response = await request(app).get('/api/applications').query({});

      expect(response.status).toBe(status.OK);
    });
  });

  describe('updateApplication', () => {
    beforeEach(async () => {
      // Clear the Application collection before each test
      await Application.deleteMany();
    });

    it('should update an application', async () => {
      // Create a mock application in the test database
      const mockApplication = {
        appName: 'TestApp',
        appDescription: 'This is a test description',
      };
      const createdApplication = await Application.create(mockApplication);

      // New data for updating the application
      const updatedData = {
        appName: 'UpdatedTestApp',
        appDescription: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/applications/${createdApplication._id}/update`)
        .send(updatedData);

      expect(response.status).toBe(status.OK);
      expect(response.body.appName).toBe(updatedData.appName);
      expect(response.body.appDescription).toBe(updatedData.appDescription);
      expect(response.body.dateUpdated).toBeDefined();
    });
    // change name
    it('should handle application name conflict', async () => {
      // Create two mock applications in the test database
      const mockApplication1 = {
        appName: 'TestApp1',
        appDescription: 'Description 1',
      };
      const mockApplication2 = {
        appName: 'TestApp2',
        appDescription: 'Description 2',
      };
      await Application.create(mockApplication1);
      const existingApp = await Application.create(mockApplication2);
      // Attempt to update an application with the same name as the existing app
      const updatedData = {
        appName: 'TestApp1',
        appDescription: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/applications/${existingApp._id}/update`)
        .send(updatedData);

      expect(response.status).toBe(status.CONFLICT);
    });
  });

  describe('deleteApplication', () => {
    beforeEach(async () => {
      await Application.deleteMany();
    });

    it('should mark an application as deleted', async () => {
      // Create a mock application in the test database
      const mockApplication = {
        appName: 'TestApp',
        appDescription: 'This is a test description',
      };
      const createdApplication = await Application.create(mockApplication);

      const response = await request(app).patch(
        `/api/applications/${createdApplication._id}/delete`,
      );

      expect(response.status).toBe(status.OK);
      expect(response.body.isDeleted).toBe(true);
      expect(response.body.isActive).toBe(false);
      expect(response.body.dateUpdated).toBeDefined();
    });
  });

  describe('deactivateApplication', () => {
    beforeEach(async () => {
      // Clear the Application collection before each test
      await Application.deleteMany();
    });

    it('should toggle isActive and update application', async () => {
      // Create a mock application in the test database
      const mockApplication = {
        appName: 'TestApp',
        appDescription: 'This is a test description',
        isActive: true,
      };
      const createdApplication = await Application.create(mockApplication);

      const response = await request(app).patch(
        `/api/applications/${createdApplication._id}/deactivate`,
      );

      expect(response.status).toBe(status.OK);
      expect(response.body.isActive).toBe(false);
      expect(response.body.dateUpdated).toBeDefined();
    });
  });
});
