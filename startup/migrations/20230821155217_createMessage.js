/* eslint-disable prettier/prettier */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('messages', (table) => {
    table.increments('id').primary();
    table.string('contents');
    table.string('createdBy');
    table.timestamp('dateCreated').defaultTo(knex.fn.now());
    table.timestamp('dateUpdated').defaultTo(knex.fn.now());
    table.string('updatedBy');
    table
      .integer('notificationId')
      .unsigned()
      .references('id')
      .inTable('notifications')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.string('email').notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable('messages', (t) => {
      t.dropForeign('notificationId');
    })
    .dropTable('messages');
};
