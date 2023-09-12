const request = require('supertest');
const status = require('http-status');
const knex = require('../../../startup/knex');

let app;

describe('Messages', () => {
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

  describe('listMessages', () => {
    it('should list messages for a valid notification', async () => {
      const mockNotification = {
        notificationName: 'Notification1',
        notificationDescription: 'Description1',
        templateBody: 'i am temp bodyyy{help}',
        templateSubject: 'i am subject',
        isDeleted: false,
      };
      const [insertedNotification] = await knex('notifications')
        .insert(mockNotification)
        .returning('*');

      const mockMessages = [
        {
          email: 'user@example.com',
          contents: 'Message 1',
          notificationId: insertedNotification.id.toString(),
        },
        {
          email: 'user@example.com',
          contents: 'Message 2',
          notificationId: insertedNotification.id.toString(),
        },
      ];
      await knex('messages').insert(mockMessages);

      const response = await request(app).get(
        `/api/message/?notificationId=${insertedNotification.id.toString()}&email=user@example.com`,
      );
      expect(response.status).toBe(status.OK);
      expect(response.body.messages).toHaveLength(2);
    });

    it('should handle listing messages for an invalid notification', async () => {
      const response = await request(app).get(
        '/api/message/?notificationId=22&email=user@example.com',
      );

      expect(response.status).toBe(status.BAD_REQUEST);
    });
  });

  describe('addMessages', () => {
    it('should add a new message with valid data', async () => {
      // Insert a mock notification into the database
      const mockNotification = {
        notificationName: 'Notification1',
        notificationDescription: 'Description1',
        isDeleted: false,
        templateBody: 'Hello, {name}!',
        templateSubject: 'hi i am subject',
        metadata: [{ key: 'name' }],
      };
      // Stringify the metadata before inserting
      mockNotification.metadata = JSON.stringify(mockNotification.metadata);
      const [insertedNotification] = await knex('notifications')
        .insert(mockNotification)
        .returning('*');

      const requestBody = {
        notificationId: insertedNotification.id.toString(),
        email: 'user@example.com',
        metadata: [{ key: 'name', value: 'John' }],
      };

      const response = await request(app)
        .post('/api/message')
        .send(requestBody);

      expect(response.status).toBe(status.OK);
    });

    it('should handle adding a message with invalid notification', async () => {
      const requestBody = {
        notificationId: '22',
        email: 'user@example.com',
        metadata: [{ key: 'name', value: 'John' }],
      };

      const response = await request(app)
        .post('/api/message')
        .send(requestBody);

      expect(response.status).toBe(status.BAD_REQUEST);
    });
  });
});
