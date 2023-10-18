/* eslint-disable prettier/prettier */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('events', (table) => {
    table.increments('id').primary();
    table.string('eventName', 100).notNullable();
    table.string('eventDescription', 200).notNullable();
    table.timestamp('dateCreated').defaultTo(knex.fn.now());
    table.timestamp('dateUpdated').defaultTo(knex.fn.now());
    table.boolean('isDeleted').defaultTo(false);
    table.boolean('isActive').defaultTo(true);
    table
      .integer('applicationId')
      .unsigned()
      .references('id')
      .inTable('applications')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.string('createdBy');
    table.string('updatedBy');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable('events', (t) => {
      t.dropForeign('applicationId');
    })
    .dropTable('events');
};
