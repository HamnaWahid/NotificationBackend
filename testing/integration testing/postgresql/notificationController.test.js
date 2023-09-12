const request = require('supertest');
const status = require('http-status');
const knex = require('../../../startup/knex');

let app;

describe('Notification', () => {
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

  describe('listNotification', () => {
    it('should list notifications for a valid event', async () => {
      // Insert a mock event and notifications into the database
      const mockEvent = {
        eventName: 'Event1',
        eventDescription: 'Description1',
        isDeleted: false,
      };
      const [insertedEvent] = await knex('events')
        .insert(mockEvent)
        .returning('*');

      const mockNotifications = [
        {
          notificationName: 'Notification1',
          notificationDescription: 'Description1',
          templateBody: 'hi i am template{boyd}',
          templateSubject: 'hi i am subject',
          eventId: insertedEvent.id.toString(),
        },
        {
          notificationName: 'Notification2',
          notificationDescription: 'Description2',
          templateBody: 'hi i am template{boyd}',
          templateSubject: 'hi i am subject',
          eventId: insertedEvent.id.toString(),
        },
      ];
      await knex('notifications').insert(mockNotifications);

      const response = await request(app).get(
        `/api/notifications?eventId=${insertedEvent.id.toString()}`,
      );

      expect(response.status).toBe(status.OK);
      expect(response.body.notifications.length).toBe(mockNotifications.length);
      // Add more assertions here
    });

    it('should handle listing notifications for a non-existent event', async () => {
      const response = await request(app).get('/api/notifications?eventId=22');

      expect(response.status).toBe(status.BAD_REQUEST);
    });

    it('should handle listing notifications for a deleted event', async () => {
      const mockEvent = {
        eventName: 'Event1',
        eventDescription: 'Description1',
        isDeleted: true,
      };
      const [insertedEvent] = await knex('events')
        .insert(mockEvent)
        .returning('*');

      const response = await request(app).get(
        `/api/notifications?eventId=${insertedEvent.id.toString()}`,
      );

      expect(response.status).toBe(status.BAD_REQUEST);
    });
  });

  describe('addNotification', () => {
    it('should add a notification to a valid event', async () => {
      // Insert a mock event into the database
      const mockEvent = {
        eventName: 'Event1',
        eventDescription: 'Description1',
        isDeleted: false,
      };
      const [insertedEvent] = await knex('events')
        .insert(mockEvent)
        .returning('*');

      const mockNotification = {
        notificationName: 'Notification1',
        notificationDescription: 'Description1',
        eventId: insertedEvent.id.toString(),
        templateBody: 'Notification template body',
        templateSubject: 'Notification subject',
      };

      const response = await request(app)
        .post('/api/notifications')
        .send(mockNotification);

      expect(response.status).toBe(status.OK);
      expect(response.body.notificationName).toBe(
        mockNotification.notificationName,
      );
    });

    it('should handle adding a notification to a non-existent event', async () => {
      const mockNotification = {
        notificationName: 'Notification1',
        notificationDescription: 'Description1',
        eventId: '22',
        templateBody: 'Notification template body',
        templateSubject: 'Notification subject',
      };

      const response = await request(app)
        .post('/api/notifications')
        .send(mockNotification);

      expect(response.status).toBe(status.BAD_REQUEST);
    });
  });

  describe('updateNotification', () => {
    it('should update an existing notification', async () => {
      const mockEvent = {
        eventName: 'Event1',
        eventDescription: 'Description1',
        isDeleted: false,
      };
      const [insertedEvent] = await knex('events')
        .insert(mockEvent)
        .returning('*');
      const mockNotification = {
        notificationName: 'Notification1',
        notificationDescription: 'Description1',
        eventId: insertedEvent.id,
        templateBody: 'Notification template body',
        templateSubject: 'Notification subject',
      };

      const [insertedNotification] = await knex('notifications')
        .insert(mockNotification)
        .returning('*');

      const updatedNotification = {
        notificationName: 'Updated Notification',
        notificationDescription: 'Updated Description',
        templateBody: 'Updated template body',
        templateSubject: 'Updated subject',
      };

      const response = await request(app)
        .put(
          `/api/notifications/${insertedNotification.id.toString()}/update?eventId=${insertedEvent.id.toString()}`,
        )
        .send(updatedNotification);

      expect(response.status).toBe(status.OK);
      expect(response.body.notificationName).toBe(
        updatedNotification.notificationName,
      );
    });

    it('should handle updating a non-existent notification', async () => {
      const updatedNotification = {
        notificationName: 'Updated Notification',
        notificationDescription: 'Updated Description',
        templateBody: 'Updated template body',
        templateSubject: 'Updated subject',
      };

      const response = await request(app)
        .put('/api/notifications/12/update?eventId=1')
        .send(updatedNotification);

      expect(response.status).toBe(status.BAD_REQUEST);
    });
  });

  describe('deleteNotification', () => {
    it('should delete an existing notification', async () => {
      const mockEvent = {
        eventName: 'Event1',
        eventDescription: 'Description1',
        isDeleted: false,
      };
      const [insertedEvent] = await knex('events')
        .insert(mockEvent)
        .returning('*');

      const mockNotification = {
        notificationName: 'Notification1',
        notificationDescription: 'Description1',
        eventId: insertedEvent.id.toString(),
        templateBody: 'Notification template body',
        templateSubject: 'Notification subject',
        isDeleted: false,
      };
      const [insertedNotification] = await knex('notifications')
        .insert(mockNotification)
        .returning('*');

      const response = await request(app).patch(
        `/api/notifications/${insertedNotification.id.toString()}/delete?eventId=${insertedEvent.id.toString()}`,
      );

      expect(response.status).toBe(status.OK);
      expect(response.body.isDeleted).toBe(true);
    });

    it('should handle deleting a non-existent notification', async () => {
      const response = await request(app).patch(
        '/api/notifications/22/delete?eventId=1',
      );

      expect(response.status).toBe(status.BAD_REQUEST);
    });
  });
});
