const request = require('supertest');
const status = require('http-status');
const knex = require('../../../startup/knex');

let app;

describe('Events', () => {
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

  describe('addEvent', () => {
    it('should add a new event', async () => {
      const mockApplication = {
        appName: 'App1',
        appDescription: 'Description 1',
        isActive: true,
      };
      const [insertedApplication] = await knex('applications')
        .insert(mockApplication)
        .returning('*');

      const newEvent = {
        eventName: 'New Event',
        eventDescription: 'This is a new event description',
        applicationId: insertedApplication.id.toString(),
      };

      const response = await request(app).post('/api/events').send(newEvent);
      expect(response.status).toBe(status.OK);
      expect(response.body.eventName).toBe(newEvent.eventName);
      expect(response.body.eventDescription).toBe(newEvent.eventDescription);
      expect(response.body.applicationId.toString()).toBe(
        newEvent.applicationId,
      );
    });

    it('should handle invalid or inactive application', async () => {
      const newEvent = {
        eventName: 'New Event',
        eventDescription: 'This is a new event description',
        applicationId: '12',
      };

      const response = await request(app).post('/api/events').send(newEvent);

      expect(response.status).toBe(status.BAD_REQUEST);
    });

    it('should handle event name conflict', async () => {
      // Insert a mock application into the database
      const mockApplication = {
        appName: 'App1',
        appDescription: 'Description 1',
        isActive: true,
      };
      const [insertedApplication] = await knex('applications')
        .insert(mockApplication)
        .returning('*');

      // Insert an existing event with the same name
      const existingEvent = {
        eventName: 'Existing Event',
        eventDescription: 'This is an existing event description',
        applicationId: insertedApplication.id.toString(),
      };
      await knex('events').insert(existingEvent);

      const newEvent = {
        eventName: 'Existing Event',
        eventDescription: 'This is a new event description',
        applicationId: insertedApplication.id.toString(),
      };

      const response = await request(app).post('/api/events').send(newEvent);
      expect(response.status).toBe(status.CONFLICT);
    });
  });

  describe('listEvent', () => {
    it('should list events for a valid and active application', async () => {
      // Insert a mock application into the database
      const mockApplication = {
        appName: 'App1',
        appDescription: 'Description 1',
        isActive: true,
      };
      const [insertedApplication] = await knex('applications')
        .insert(mockApplication)
        .returning('*');

      // Insert some mock events associated with the application
      const mockEvents = [
        {
          eventName: 'Event 1',
          eventDescription: 'Description 1',
          applicationId: insertedApplication.id.toString(),
        },
        {
          eventName: 'Event 2',
          eventDescription: 'Description 2',
          applicationId: insertedApplication.id.toString(),
        },
        // Add more events here
      ];
      await knex('events').insert(mockEvents);

      const response = await request(app)
        .get('/api/events')
        .query({ applicationId: insertedApplication.id });

      expect(response.status).toBe(status.OK);
      // Assert the response body properties based on the inserted events
      expect(response.body.events.length).toBe(mockEvents.length);
      // Add more assertions here
    });

    it('should handle invalid or inactive application', async () => {
      const response = await request(app)
        .get('/api/events')
        .query({ applicationId: '21' });

      expect(response.status).toBe(status.BAD_REQUEST);
    });
  });

  describe('updateEvent', () => {
    it('should update an existing event', async () => {
      // Insert a mock application and event into the database
      const mockApplication = {
        appName: 'App1',
        appDescription: 'Description 1',
        isActive: true,
      };
      const [insertedApplication] = await knex('applications')
        .insert(mockApplication)
        .returning('*');

      const mockEvent = {
        eventName: 'Event 1',
        eventDescription: 'Description 1',
        applicationId: insertedApplication.id.toString(),
      };
      const [insertedEvent] = await knex('events')
        .insert(mockEvent)
        .returning('*');

      const updatedEvent = {
        eventName: 'Updated Event',
        eventDescription: 'Updated Description',
      };

      const response = await request(app)
        .put(`/api/events/${insertedEvent.id.toString()}/update`)
        .send(updatedEvent);

      expect(response.status).toBe(status.OK);
      // Assert the response body properties based on the updated event
      expect(response.body.eventName).toBe(updatedEvent.eventName);
      // Add more assertions here
    });

    it('should handle updating an event with conflicting event name', async () => {
      const mockApplication = {
        appName: 'App1',
        appDescription: 'Description 1',
        isActive: true,
      };
      const [insertedApplication] = await knex('applications')
        .insert(mockApplication)
        .returning('*');

      const mockEvent1 = {
        eventName: 'Event 1',
        eventDescription: 'Description 1',
        applicationId: insertedApplication.id.toString(),
      };
      const mockEvent2 = {
        eventName: 'Event 2',
        eventDescription: 'Description 2',
        applicationId: insertedApplication.id.toString(),
      };
      await knex('events').insert(mockEvent1);
      const [insertedEvent2] = await knex('events')
        .insert(mockEvent2)
        .returning('*');

      const updatedEvent = {
        eventName: 'Event 1',
        eventDescription: 'Updated Description',
      };

      const response = await request(app)
        .put(`/api/events/${insertedEvent2.id.toString()}/update`)
        .send(updatedEvent);
      expect(response.status).toBe(status.CONFLICT);
    });
  });

  describe('deleteEvent', () => {
    it('should delete an existing event', async () => {
      const mockApplication = {
        appName: 'App1',
        appDescription: 'Description 1',
        isActive: true,
      };
      const [insertedApplication] = await knex('applications')
        .insert(mockApplication)
        .returning('*');

      const mockEvent = {
        eventName: 'Event 1',
        eventDescription: 'Description 1',
        applicationId: insertedApplication.id.toString(),
      };
      const [insertedEvent] = await knex('events')
        .insert(mockEvent)
        .returning('*');

      const response = await request(app)
        .patch(`/api/events/${insertedEvent.id.toString()}/delete`)
        .query({ applicationId: insertedApplication.id.toString() });

      expect(response.status).toBe(status.OK);
      expect(response.body.isDeleted).toBe(true);
    });

    it('should handle deleting a non-existent event', async () => {
      const mockApplication = {
        appName: 'App1',
        appDescription: 'Description 1',
        isActive: true,
      };
      const [insertedApplication] = await knex('applications')
        .insert(mockApplication)
        .returning('*');

      const response = await request(app)
        .patch('/api/events/22/delete')
        .query({ applicationId: insertedApplication.id.toString() });

      expect(response.status).toBe(status.BAD_REQUEST);
    });

    it('should handle deleting an event not associated with the provided application', async () => {
      const mockApplication1 = {
        appName: 'App1',
        appDescription: 'Description 1',
        isActive: true,
      };
      const mockApplication2 = {
        appName: 'App2',
        appDescription: 'Description 2',
        isActive: true,
      };
      const [insertedApplication1, insertedApplication2] = await knex(
        'applications',
      )
        .insert([mockApplication1, mockApplication2])
        .returning('*');

      const mockEvent = {
        eventName: 'Event 1',
        eventDescription: 'Description 1',
        applicationId: insertedApplication1.id.toString(),
      };
      const [insertedEvent] = await knex('events')
        .insert(mockEvent)
        .returning('*');

      const response = await request(app)
        .delete(`/api/events/${insertedEvent.id.toString()}`)
        .query({ applicationId: insertedApplication2.id.toString() });

      expect(response.status).toBe(status.NOT_FOUND);
    });
  });
});
