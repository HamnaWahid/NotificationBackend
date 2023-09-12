/* eslint-disable no-underscore-dangle */
const request = require('supertest');
const mongoose = require('mongoose');
const config = require('config');
const status = require('http-status');
const { Event } = require('../../../models/events');
const { Notification } = require('../../../models/notification'); // You need to import the Notification model

let app;

describe('notification', () => {
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

  describe('addNotification', () => {
    afterEach(async () => {
      await Event.deleteMany();
      await Notification.deleteMany();
    });

    it('should add a new notification', async () => {
      // Create a mock event in the test database
      const mockEvent = {
        eventName: 'TestEvent',
        eventDescription: 'This is a test event',
        applicationId: new mongoose.Types.ObjectId(),
      };
      const createdEvent = await Event.create(mockEvent);

      const newNotification = {
        notificationName: 'Test Notification',
        notificationDescription: 'This is a test notification',
        eventId: createdEvent._id,
        templateBody: 'Hello, {{name}}! This is a notification.',
        templateSubject: 'Notification Subject',
      };

      const response = await request(app)
        .post('/api/notifications')
        .send(newNotification);

      expect(response.status).toBe(status.OK);
      expect(response.body.notificationName).toBe(
        newNotification.notificationName,
      );
      expect(response.body.notificationDescription).toBe(
        newNotification.notificationDescription,
      );

      // Check if the notification was saved in the database
      const savedNotification = await Notification.findOne({
        notificationName: newNotification.notificationName,
        eventId: createdEvent._id,
      });

      expect(savedNotification).toBeDefined();
    });

    it('should handle invalid or deleted event', async () => {
      const invalidEventId = new mongoose.Types.ObjectId();

      const newNotification = {
        notificationName: 'Test Notification',
        notificationDescription: 'This is a test notification',
        eventId: invalidEventId,
        templateBody: 'Hello, {{name}}! This is a notification.',
        templateSubject: 'Notification Subject',
      };

      const response = await request(app)
        .post('/api/notifications')
        .send(newNotification);

      expect(response.status).toBe(status.BAD_REQUEST);
    });
  });

  describe('listNotification', () => {
    afterEach(async () => {
      await Event.deleteMany();
      await Notification.deleteMany();
    });

    it('should list notifications with pagination and filters', async () => {
      // Create a mock event in the test database
      const mockEvent = {
        eventName: 'TestEvent',
        eventDescription: 'This is a test event',
        applicationId: new mongoose.Types.ObjectId(),
        templateBody: 'Hello, {{name}}! This is a notification.',
        templateSubject: 'Notification Subject',
      };
      const createdEvent = await Event.create(mockEvent);

      // Create mock notifications for the event
      const mockNotifications = [
        {
          notificationName: 'Notification1',
          notificationDescription: 'This is Notification 1',
          eventId: createdEvent._id,
          templateBody: 'Hello, {{name}}! This is a notification.',
          templateSubject: 'Notification Subject',
        },
        {
          notificationName: 'Notification2',
          notificationDescription: 'This is Notification 2',
          eventId: createdEvent._id,
          templateBody: 'Hello, {{name}}! This is a notification.',
          templateSubject: 'Notification Subject',

          isDeleted: true,
        },
        // Add more mock notifications
      ];
      await Notification.insertMany(mockNotifications);

      const response = await request(app).get('/api/notifications').query({
        eventId: createdEvent._id.toString(),
        page: 1,
        pageSize: 10,
        isDeleted: 'false', // Retrieve only non-deleted notifications
      });

      expect(response.status).toBe(status.OK);
      expect(response.body.notifications).toHaveLength(1); // Only one non-deleted notification
      expect(response.body.currentPage).toBe(1);
      expect(response.body.totalPages).toBe(1);
      expect(response.body.pageSize).toBe(10);
      expect(response.body.totalNotifications).toBe(1);
    });

    it('should handle invalid or deleted event', async () => {
      const invalidEventId = new mongoose.Types.ObjectId();

      const response = await request(app).get('/api/notifications').query({
        eventId: invalidEventId.toString(),
        page: 1,
        pageSize: 10,
      });

      expect(response.status).toBe(status.BAD_REQUEST);
    });

    // Add test for listing deleted notifications
    it('should list deleted notifications', async () => {
      // Create a mock event in the test database
      const mockEvent = {
        eventName: 'TestEvent',
        eventDescription: 'This is a test event',
        applicationId: new mongoose.Types.ObjectId(),
        templateBody: 'Hello, {{name}}! This is a notification.',
        templateSubject: 'Notification Subject',
      };
      const createdEvent = await Event.create(mockEvent);

      // Create mock notifications for the event
      const mockNotifications = [
        {
          notificationName: 'Notification1',
          notificationDescription: 'This is Notification 1',
          templateBody: 'Hello, {{name}}! This is a notification.',
          templateSubject: 'Notification Subject',

          eventId: createdEvent._id,
        },
        {
          notificationName: 'Notification2',
          notificationDescription: 'This is Notification 2',
          templateBody: 'Hello, {{name}}! This is a notification.',
          templateSubject: 'Notification Subject',

          eventId: createdEvent._id,
          isDeleted: true,
        },
        // Add more mock notifications
      ];
      await Notification.insertMany(mockNotifications);

      const response = await request(app).get('/api/notifications').query({
        eventId: createdEvent._id.toString(),
        page: 1,
        pageSize: 10,
        isDeleted: 'true', // Retrieve only deleted notifications
      });

      expect(response.status).toBe(status.OK);
      expect(response.body.notifications).toHaveLength(1); // Only one deleted notification
      expect(response.body.currentPage).toBe(1);
      expect(response.body.totalPages).toBe(1);
      expect(response.body.pageSize).toBe(10);
      expect(response.body.totalNotifications).toBe(1);
    });
  });

  describe('updateNotification', () => {
    afterEach(async () => {
      await Event.deleteMany();
      await Notification.deleteMany();
    });

    it('should update a notification', async () => {
      // Create a mock event in the test database
      const mockEvent = {
        eventName: 'TestEvent',
        eventDescription: 'This is a test event',
        applicationId: new mongoose.Types.ObjectId(),
      };
      const createdEvent = await Event.create(mockEvent);

      // Create a mock notification associated with the event
      const mockNotification = {
        notificationName: 'Test Notification',
        notificationDescription: 'This is a test notification',
        eventId: createdEvent._id,
        templateBody: 'Hello, {{name}}! This is a notification.',
        templateSubject: 'Notification Subject',
      };
      const createdNotification = await Notification.create(mockNotification);

      const updatedData = {
        notificationName: 'Updated Notification',
        notificationDescription: 'This is an updated notification',
        templateBody: 'Hello, {{name}}! This is an updated notification.',
        templateSubject: 'Updated Notification Subject',
      };

      const response = await request(app)
        .put(`/api/notifications/${createdNotification._id.toString()}/update`)
        .query({ eventId: createdEvent._id.toString() })
        .send(updatedData);

      expect(response.status).toBe(status.OK);
      expect(response.body.notificationName).toBe(updatedData.notificationName);
      expect(response.body.notificationDescription).toBe(
        updatedData.notificationDescription,
      );
      const updatedNotification = await Notification.findById(
        createdNotification._id,
      );

      expect(updatedNotification.notificationName).toBe(
        updatedData.notificationName,
      );
      expect(updatedNotification.notificationDescription).toBe(
        updatedData.notificationDescription,
      );
    });

    it('should handle non-existing notification', async () => {
      const nonExistingNotificationId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(
          `/api/notifications/${nonExistingNotificationId.toString()}/update`,
        )
        .query({ eventId: new mongoose.Types.ObjectId().toString() })
        .send({});

      expect(response.status).toBe(status.BAD_REQUEST);
    });

    it('should handle notification not associated with event', async () => {
      // Create two mock events in the test database
      const mockEvent1 = {
        eventName: 'TestEvent1',
        eventDescription: 'This is a test event 1',
        applicationId: new mongoose.Types.ObjectId(),
      };
      const mockEvent2 = {
        eventName: 'TestEvent2',
        eventDescription: 'This is a test event 2',
        applicationId: new mongoose.Types.ObjectId(),
      };
      const createdEvent1 = await Event.create(mockEvent1);
      const createdEvent2 = await Event.create(mockEvent2);

      // Create a mock notification associated with the first event
      const mockNotification = {
        notificationName: 'Test Notification',
        notificationDescription: 'This is a test notification',
        eventId: createdEvent1._id,
        templateBody: 'Hello, {{name}}! This is a notification.',
        templateSubject: 'Notification Subject',
      };
      const createdNotification = await Notification.create(mockNotification);

      const updatedData = {
        notificationName: 'Updated Notification',
        notificationDescription: 'This is an updated notification',
        templateBody: 'Hello, {{name}}! This is a notification.',
        templateSubject: 'Notification Subject',
      };

      const response = await request(app)
        .put(`/api/notifications/${createdNotification._id.toString()}/update`)
        .query({ eventId: createdEvent2._id.toString() })
        .send(updatedData);

      expect(response.status).toBe(status.NOT_FOUND);
    });
  });

  describe('deleteNotification', () => {
    afterEach(async () => {
      await Event.deleteMany();
      await Notification.deleteMany();
    });

    it('should mark a notification as deleted', async () => {
      // Create a mock event in the test database
      const mockEvent = {
        eventName: 'TestEvent',
        eventDescription: 'This is a test event',
        applicationId: new mongoose.Types.ObjectId(),
      };
      const createdEvent = await Event.create(mockEvent);

      // Create a mock notification associated with the event
      const mockNotification = {
        notificationName: 'Test Notification',
        notificationDescription: 'This is a test notification',
        eventId: createdEvent._id,
        templateBody: 'Hello, {{name}}! This is a notification.',
        templateSubject: 'Notification Subject',
      };
      const createdNotification = await Notification.create(mockNotification);

      const response = await request(app)
        .patch(
          `/api/notifications/${createdNotification._id.toString()}/delete`,
        )
        .query({ eventId: createdEvent._id.toString() });

      expect(response.status).toBe(status.OK);
      expect(response.body.isDeleted).toBe(true);
      expect(response.body.dateUpdated).toBeDefined();

      // Check if the notification was marked as deleted in the database
      const deletedNotification = await Notification.findById(
        createdNotification._id,
      );

      expect(deletedNotification.isDeleted).toBe(true);
      expect(deletedNotification.dateUpdated).toBeDefined();
    });

    it('should handle non-existing notification', async () => {
      const nonExistingNotificationId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(
          `/api/notifications/${nonExistingNotificationId.toString()}/delete`,
        )
        .query({ eventId: new mongoose.Types.ObjectId().toString() });

      expect(response.status).toBe(status.BAD_REQUEST);
    });

    it('should handle notification not associated with event', async () => {
      // Create two mock events in the test database
      const mockEvent1 = {
        eventName: 'TestEvent1',
        eventDescription: 'This is a test event 1',
        applicationId: new mongoose.Types.ObjectId(),
      };
      const mockEvent2 = {
        eventName: 'TestEvent2',
        eventDescription: 'This is a test event 2',
        applicationId: new mongoose.Types.ObjectId(),
      };
      const createdEvent1 = await Event.create(mockEvent1);
      const createdEvent2 = await Event.create(mockEvent2);

      // Create a mock notification associated with the first event
      const mockNotification = {
        notificationName: 'Test Notification',
        notificationDescription: 'This is a test notification',
        eventId: createdEvent1._id,
        templateBody: 'Hello, {{name}}! This is a notification.',
        templateSubject: 'Notification Subject',
      };
      const createdNotification = await Notification.create(mockNotification);

      const response = await request(app)
        .patch(
          `/api/notifications/${createdNotification._id.toString()}/delete`,
        )
        .query({ eventId: createdEvent2._id.toString() });

      expect(response.status).toBe(status.NOT_FOUND);
    });
  });
});
