/* eslint-disable no-underscore-dangle */
const request = require('supertest');
const mongoose = require('mongoose');
const config = require('config');
const status = require('http-status');
const { Application } = require('../../../models/application');
const { Event } = require('../../../models/events'); // You need to import the Event model

let app;
describe('Event controller', () => {
  beforeEach(async () => {
    app = require('../../../index');
    const connectionString = config.get('mongodb');
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterEach(async () => {
    await app.close();
    await mongoose.disconnect();
  });

  describe('addEvent', () => {
    afterEach(async () => {
      await Application.deleteMany();
      await Event.deleteMany();
    });

    it('should add a new event', async () => {
      // Create a mock application in the test database
      const mockApplication = {
        appName: 'TestApp',
        appDescription: 'This is a test application',
        isActive: true,
        isDeleted: false,
      };
      const createdApplication = await Application.create(mockApplication);
      const newEvent = {
        eventName: 'Test Event',
        eventDescription: 'This is a test event',
        applicationId: createdApplication._id,
      };

      const response = await request(app).post('/api/events').send(newEvent);
      expect(response.status).toBe(status.OK);
      expect(response.body.eventName).toBe(newEvent.eventName);
      expect(response.body.eventDescription).toBe(newEvent.eventDescription);

      // Check if the event was saved in the database
      const savedEvent = await Event.findOne({
        eventName: newEvent.eventName,
        applicationId: createdApplication._id,
      });

      expect(savedEvent).toBeDefined();
    });

    it('should handle duplicate event names', async () => {
      // Create a mock application in the test database
      const mockApplication = {
        appName: 'TestApp',
        appDescription: 'This is a test application',
        isActive: true,
        isDeleted: false,
      };
      const createdApplication = await Application.create(mockApplication);

      const existingEvent = {
        eventName: 'Existing Event',
        eventDescription: 'This is an existing event',
        applicationId: createdApplication._id,
      };
      await Event.create(existingEvent);

      const duplicateEvent = {
        eventName: 'Existing Event', // Same name as existing event
        eventDescription: 'This is a duplicate event',
        applicationId: createdApplication._id,
      };

      const response = await request(app)
        .post('/api/events')
        .send(duplicateEvent);

      expect(response.status).toBe(status.CONFLICT);
    });

    it('should handle invalid or inactive application', async () => {
      const invalidApplicationId = new mongoose.Types.ObjectId();

      const newEvent = {
        eventName: 'Test Event',
        eventDescription: 'This is a test event',
        applicationId: invalidApplicationId,
      };

      const response = await request(app).post('/api/events').send(newEvent);

      expect(response.status).toBe(status.NOT_FOUND);
    });
  });

  describe('listEvent', () => {
    afterEach(async () => {
      await Application.deleteMany();
      await Event.deleteMany();
    });

    it('should list events with pagination and filters', async () => {
      // Create a mock application and event in the test database
      const mockApplication = {
        appName: 'TestApp',
        appDescription: 'This is a test application',
        isActive: true,
        isDeleted: false,
      };
      const createdApplication = await Application.create(mockApplication);

      const mockEvent = {
        eventName: 'Event1',
        eventDescription: 'This is Event 1',
        applicationId: createdApplication._id,
      };
      await Event.create(mockEvent);

      const query = {
        applicationId: createdApplication._id.toString(),
        page: 1,
        pageSize: 10,
        eventName: 'Event1',
      };
      const response = await request(app).get('/api/events').query(query);

      expect(response.status).toBe(status.OK);
      expect(response.body.events).toHaveLength(1); // Only one event matches the filter
      expect(response.body.currentPage).toBe(1);
      expect(response.body.totalPages).toBe(1);
      expect(response.body.pageSize).toBe(10);
      expect(response.body.totalEvents).toBe(1);
    });

    it('should handle invalid or inactive application', async () => {
      const invalidApplicationId = new mongoose.Types.ObjectId();

      const response = await request(app).get('/api/events').query({
        applicationId: invalidApplicationId,
        page: 1,
        pageSize: 10,
      });

      expect(response.status).toBe(status.BAD_REQUEST);
    });
  });

  describe('updateEvent', () => {
    afterEach(async () => {
      await Application.deleteMany();
      await Event.deleteMany();
    });

    it('should update an event', async () => {
      // Create a mock application in the test database
      const mockApplication = {
        appName: 'TestApp',
        appDescription: 'This is a test application',
        isActive: true,
        isDeleted: false,
      };
      const createdApplication = await Application.create(mockApplication);

      // Create a mock event in the test database
      const mockEvent = {
        eventName: 'TestEvent',
        eventDescription: 'This is a test event',
        applicationId: createdApplication._id,
      };
      const createdEvent = await Event.create(mockEvent);

      // Update data
      const updatedEventData = {
        eventName: 'UpdatedEventName',
        eventDescription: 'Updated event description',
      };

      const response = await request(app)
        .put(`/api/events/${createdEvent._id}/update`)
        .send(updatedEventData);

      expect(response.status).toBe(status.OK);
      expect(response.body.eventName).toBe(updatedEventData.eventName);
      expect(response.body.eventDescription).toBe(
        updatedEventData.eventDescription,
      );
      expect(response.body.dateUpdated).toBeDefined();
    });

    it('should handle non-existing event', async () => {
      const nonExistingEventId = new mongoose.Types.ObjectId();

      const updatedEventData = {
        eventName: 'UpdatedEventName',
        eventDescription: 'Updated event description',
      };

      const response = await request(app)
        .put(`/api/events/${nonExistingEventId}/update`)
        .send(updatedEventData);

      expect(response.status).toBe(status.BAD_REQUEST);
    });
  });

  describe('deleteEvent', () => {
    afterEach(async () => {
      await Application.deleteMany();
      await Event.deleteMany();
    });

    it('should mark an event as deleted', async () => {
      // Create a mock application in the test database
      const mockApplication = {
        appName: 'TestApp',
        appDescription: 'This is a test application',
        isActive: true,
        isDeleted: false,
      };
      const createdApplication = await Application.create(mockApplication);

      // Create a mock event associated with the application
      const mockEvent = {
        eventName: 'TestEvent',
        eventDescription: 'This is a test event',
        applicationId: createdApplication._id,
      };
      const createdEvent = await Event.create(mockEvent);

      const response = await request(app)
        .patch(`/api/events/${createdEvent._id}/delete`)
        .query({ applicationId: createdApplication._id.toString() });

      expect(response.status).toBe(status.OK);
      expect(response.body.isDeleted).toBe(true);
      expect(response.body.dateUpdated).toBeDefined();
    });

    it('should handle non-existing event', async () => {
      const nonExistingEventId = new mongoose.Types.ObjectId();
      const mockApplication = await Application.create({
        appName: 'TestApp',
        appDescription: 'This is a test application',
        isActive: true,
        isDeleted: false,
      });

      const response = await request(app)
        .patch(`/api/events/${nonExistingEventId}/delete`)
        .query({ applicationId: mockApplication._id });

      expect(response.status).toBe(status.BAD_REQUEST);
    });

    it('should handle event not associated with application', async () => {
      // Create two mock applications in the test database
      const mockApplication1 = await Application.create({
        appName: 'TestApp1',
        appDescription: 'This is a test application 1',
        isActive: true,
        isDeleted: false,
      });
      const mockApplication2 = await Application.create({
        appName: 'TestApp2',
        appDescription: 'This is a test application 2',
        isActive: true,
        isDeleted: false,
      });

      // Create a mock event associated with the first application
      const mockEvent = {
        eventName: 'TestEvent',
        eventDescription: 'This is a test event',
        applicationId: mockApplication1._id,
      };
      const createdEvent = await Event.create(mockEvent);

      const response = await request(app)
        .patch(`/api/events/${createdEvent._id}/delete`)
        .query({ applicationId: mockApplication2._id.toString() });

      expect(response.status).toBe(status.NOT_FOUND);
    });
  });
});
