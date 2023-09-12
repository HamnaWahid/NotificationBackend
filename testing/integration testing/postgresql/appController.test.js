const request = require('supertest');
const status = require('http-status');
const knex = require('../../../startup/knex');

let app;

describe('Application', () => {
  beforeAll(async () => {
    app = require('../../../index');
  });

  afterAll(async () => {
    app.close();
    await knex.destroy();
  });

  beforeEach(async () => {
    await knex.migrate.latest();
  });

  afterEach(async () => {
    await knex.migrate.rollback(true);
  });

  describe('addApplication', () => {
    it('should add a new application', async () => {
      const newApplication = {
        appName: 'Test App',
        appDescription: 'This is a test application',
      };

      const response = await request(app)
        .post('/api/applications')
        .send(newApplication);

      expect(response.status).toBe(status.OK);
      expect(response.body.appName).toBe(newApplication.appName);
      expect(response.body.appDescription).toBe(newApplication.appDescription);

      // Check if the application was saved in the database
      const savedApplication = await knex('applications')
        .where('appName', newApplication.appName)
        .first();

      expect(savedApplication).toBeDefined();
    });

    it('should return 409 if application with same name already exists', async () => {
      const existingApplication = {
        appName: 'Existing App',
        appDescription: 'This is an existing application',
      };

      // Insert an existing application into the database
      await knex('applications').insert(existingApplication);

      const response = await request(app)
        .post('/api/applications')
        .send(existingApplication);

      expect(response.status).toBe(status.CONFLICT);
    });
  });

  describe('listApplication', () => {
    it('should list applications with pagination and filters', async () => {
      // Insert mock applications into the database
      const mockApplications = [
        { appName: 'App1', isActive: true, appDescription: 'this is desc' },
        { appName: 'App2', isActive: false, appDescription: 'this is desc' },
        { appName: 'App3', isActive: true, appDescription: 'this is desc' },
      ];
      await knex('applications').insert(mockApplications);

      const response = await request(app).get('/api/applications').query({
        page: 1,
        pageSize: 2,
        isActive: 'true',
      });

      expect(response.status).toBe(status.OK);
      expect(response.body.applications).toHaveLength(2);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.pageSize).toBe(2);
    });

    it('should list all applications without filters', async () => {
      // Insert mock applications into the database
      const mockApplications = [
        { appName: 'App1', isActive: true, appDescription: 'this is desc' },
        { appName: 'App2', isActive: true, appDescription: 'this is desc' },
      ];
      await knex('applications').insert(mockApplications);

      const response = await request(app).get('/api/applications').query({});

      expect(response.status).toBe(status.OK);
      expect(response.body.applications).toHaveLength(2);
    });
  });

  describe('updateApplication', () => {
    it('should update an application', async () => {
      // Insert a mock application into the database
      const mockApplication = {
        appName: 'App1',
        appDescription: 'Description 1',
      };
      const [insertedApplication] = await knex('applications')
        .insert(mockApplication)
        .returning('*');

      const updatedData = {
        appName: 'UpdatedApp',
        appDescription: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/applications/${insertedApplication.id}/update`)
        .send(updatedData);

      expect(response.status).toBe(status.OK);
      expect(response.body.appName).toBe(updatedData.appName);
      expect(response.body.appDescription).toBe(updatedData.appDescription);
      expect(response.body.dateUpdated).toBeDefined();
    });

    it('should handle not found application', async () => {
      const updatedData = {
        appName: 'UpdatedApp',
        appDescription: 'Updated description',
      };

      const response = await request(app)
        .put('/api/applications/90/update')
        .send(updatedData);

      expect(response.status).toBe(status.NOT_FOUND);
    });
  });

  describe('deleteApplication', () => {
    it('should mark an application as deleted', async () => {
      // Insert a mock application into the database
      const mockApplication = {
        appName: 'App1',
        appDescription: 'Description 1',
      };
      const [insertedApplication] = await knex('applications')
        .insert(mockApplication)
        .returning('*');

      const response = await request(app)
        .patch(`/api/applications/${insertedApplication.id}/delete`)
        .send();

      expect(response.status).toBe(status.OK);
      expect(response.body.isDeleted).toBe(true);
      expect(response.body.isActive).toBe(false);
      expect(response.body.dateUpdated).toBeDefined();
    });

    it('should handle not found application', async () => {
      const response = await request(app)
        .patch('/api/applications/77/delete')
        .send();

      expect(response.status).toBe(status.NOT_FOUND); // Not found status
    });
  });

  describe('deactivateApplication', () => {
    it('should toggle isActive and update application', async () => {
      // Insert a mock application into the database
      const mockApplication = {
        appName: 'App1',
        appDescription: 'Description 1',
        isActive: true,
      };
      const [insertedApplication] = await knex('applications')
        .insert(mockApplication)
        .returning('*');

      const response = await request(app)
        .patch(`/api/applications/${insertedApplication.id}/deactivate`)
        .send();

      expect(response.status).toBe(status.OK);
      expect(response.body.isActive).toBe(false); // Check if isActive is toggled
      expect(response.body.dateUpdated).toBeDefined();
    });

    it('should handle not found application', async () => {
      const response = await request(app)
        .patch('/api/applications/88/deactivate')
        .send();

      expect(response.status).toBe(status.NOT_FOUND); // Not found status
    });
  });
});
