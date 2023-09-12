/* eslint-disable prettier/prettier */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table.string('notificationName', 100).notNullable();
    table.string('notificationDescription', 200).notNullable();
    table.timestamp('dateCreated').defaultTo(knex.fn.now());
    table.timestamp('dateUpdated').defaultTo(knex.fn.now());
    table.boolean('isDeleted').defaultTo(false);
    table
      .integer('eventId')
      .unsigned()
      .references('id')
      .inTable('events')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.string('templateSubject', 100).notNullable();
    table.string('templateBody', 1000).notNullable();
    table.string('createdBy');
    table.string('deletedBy');
    table.json('metadata'); // Storing metadata as JSON
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable('notifications', (t) => {
      t.dropForeign('eventId');
    })
    .dropTable('notifications');
};
