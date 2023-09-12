/* eslint-disable prettier/prettier */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('applications', (table) => {
    table.increments('id').primary();
    table.string('appName', 50).notNullable();
    table.string('appDescription', 50).notNullable();
    table.timestamp('dateCreated').defaultTo(knex.fn.now());
    table.timestamp('dateUpdated').defaultTo(knex.fn.now());
    table.boolean('isActive').defaultTo(true);
    table.boolean('isDeleted').defaultTo(false);
    table.string('createdBy');
    table.string('updatedBy');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('applications');
};
