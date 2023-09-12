/* eslint-disable no-underscore-dangle */
const request = require('supertest');
const mongoose = require('mongoose');
const config = require('config');
const status = require('http-status');
const { Notification } = require('../../../models/notification');
const { Message } = require('../../../models/message');

let app;
describe('Messages', () => {
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
  describe('addMessages', () => {
    afterEach(async () => {
      await Notification.deleteMany();
      await Message.deleteMany();
    });

    it('should add a new message', async () => {
      // Create a mock notification in the test database
      const mockNotification = {
        notificationName: 'Test Notification',
        notificationDescription: 'This is a test notification',
        templateBody: 'Hello {party}, your event is at {time} at {VENUE}',
        templateSubject: 'Test Subject',
        metadata: ['party', 'time', 'VENUE'],
      };
      const createdNotification = await Notification.create(mockNotification);

      const newMessage = {
        email: 'recipient@example.com',
        metadata: {
          party: 'Birthday party',
          time: '2:00 PM',
          VENUE: 'My House',
        },
        notificationId: createdNotification._id.toString(),
      };

      const response = await request(app).post('/api/message').send(newMessage);
      expect(response.status).toBe(status.OK);
      expect(response.body.email).toBe(newMessage.email);
      // You can add more assertions here based on your needs

      // Check if the message was saved in the database
      const savedMessage = await Message.findById(response.body._id);

      expect(savedMessage).toBeDefined();
      expect(savedMessage.contents).toContain(
        'Hello Birthday party, your event is at 2:00 PM at My House',
      );
    });

    it('should handle invalid notification', async () => {
      const invalidNotificationId = new mongoose.Types.ObjectId();

      const newMessage = {
        email: 'recipient@example.com',
        metadata: {
          party: 'Birthday party',
          time: '2:00 PM',
          VENUE: 'My House',
        },
        notificationId: invalidNotificationId.toString(),
      };

      const response = await request(app).post('/api/message').send(newMessage);

      expect(response.status).toBe(status.BAD_REQUEST);
    });
    // names mismatch of message handle test case
    it('should handle metadata count mismatch', async () => {
      // Create a mock notification in the test database
      const mockNotification = {
        notificationName: 'Test Notification',
        notificationDescription: 'This is a test notification',
        templateBody: 'Hello {party}, your event is at {time} at {VENUE}',
        templateSubject: 'Test Subject',
        metadata: ['party', 'time', 'VENUE'],
      };
      const createdNotification = await Notification.create(mockNotification);

      const newMessage = {
        email: 'recipient@example.com',
        metadata: {
          party: 'Birthday party',
          time: '2:00 PM',
        },
        notificationId: createdNotification._id.toString(),
      };

      const response = await request(app).post('/api/message').send(newMessage);

      expect(response.status).toBe(status.BAD_REQUEST);
    });
  });

  describe('listMessages', () => {
    beforeEach(async () => {
      await Notification.deleteMany();
      await Message.deleteMany();
    });

    it('should list messages with pagination and filters', async () => {
      // Create a mock notification in the test database
      const mockNotification = {
        notificationName: 'Test Notification',
        notificationDescription: 'This is a test notification',
        templateBody: 'Hello {party}, your event is at {time} at {VENUE}',
        templateSubject: 'Test Subject',
        metadata: ['party', 'time', 'VENUE'],
      };
      const createdNotification = await Notification.create(mockNotification);

      // Assuming you've set up mock messages in your test database
      const mockMessages = [
        {
          email: 'recipient1@example.com',
          contents:
            'Hello Birthday party, your event is at 2:00 PM at My House',
          notificationId: createdNotification._id,
        },
        {
          email: 'recipient2@example.com',
          contents: 'Hello Anniversary party, your event is at 3:00 PM at Park',
          notificationId: createdNotification._id,
        },
      ];
      await Message.insertMany(mockMessages);

      const response = await request(app).get('/api/message').query({
        notificationId: createdNotification._id.toString(),
        page: 1,
        pageSize: 10,
        email: 'recipient1@example.com',
      });

      expect(response.status).toBe(status.OK);
      expect(response.body.messages).toHaveLength(1);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.totalPages).toBe(1);
      expect(response.body.pageSize).toBe(10);
      expect(response.body.totalMessages).toBe(1);
    });

    it('should list all messages without filters', async () => {
      // Create a mock notification in the test database
      const mockNotification = {
        notificationName: 'Test Notification',
        notificationDescription: 'This is a test notification',
        templateBody: 'Hello {party}, your event is at {time} at {VENUE}',
        templateSubject: 'Test Subject',
        metadata: ['party', 'time', 'VENUE'],
      };
      const createdNotification = await Notification.create(mockNotification);

      // Assuming you've set up mock messages in your test database
      const mockMessages = [
        {
          email: 'recipient1@example.com',
          contents:
            'Hello Birthday party, your event is at 2:00 PM at My House',
          notificationId: createdNotification._id.toString(),
        },
        {
          email: 'recipient2@example.com',
          contents: 'Hello Anniversary party, your event is at 3:00 PM at Park',
          notificationId: createdNotification._id.toString(),
        },
      ];
      await Message.insertMany(mockMessages);
      const response = await request(app).get('/api/message').query({
        email: 'recipient2@example.com',
        notificationId: createdNotification._id.toString(),
      });

      expect(response.status).toBe(status.OK);
    });
  });
});
