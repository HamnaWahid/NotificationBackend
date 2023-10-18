/* eslint-disable no-restricted-syntax */
const status = require('http-status');

const knex = require('../../startup/knex');

async function addApplication(req, res) {
  const db = knex; // Get the shared database instance

  let { appName, appDescription } = req.body;
  appName = appName.trim();
  appDescription = appDescription.trim();

  // Check if an application with the same name already exists
  const existingApplication = await db('applications')
    .where('appName', appName)
    .first();

  if (existingApplication) {
    return res
      .status(status.CONFLICT)
      .send('An application with the same name already exists.');
  }

  const application = await db('applications')
    .insert({
      appName: req.body.appName,
      appDescription: req.body.appDescription,
      createdBy: 'hamna', // Replace with the actual username later
    })
    .returning('*');
  return res.send(application[0]);
}

async function listApplication(req, res) {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const sortBy = req.query.sortBy || 'appName'; // Default to sorting by appName
  const sortOrder = req.query.sortOrder || 'asc'; // Default to ascending order

  const queryFilters = {};
  for (const [key, value] of Object.entries(req.query)) {
    if (
      key !== 'page' &&
      key !== 'pageSize' &&
      key !== 'sortBy' &&
      key !== 'sortOrder'
    ) {
      if (key === 'isActive' || key === 'isDeleted') {
        queryFilters[key] = value === 'true';
      } else {
        queryFilters[key] = value;
      }
    }
  }

  const db = knex;

  let query = db('applications')
    .select('*')
    .where('isDeleted', false) // Add this line to filter out deleted applications
    .orderBy(sortBy, sortOrder) // Apply sorting based on sortBy and sortOrder
    .offset((page - 1) * pageSize)
    .limit(pageSize);

  if (Object.keys(queryFilters).length > 0) {
    for (const [key, value] of Object.entries(queryFilters)) {
      if (key === 'isActive') {
        query = query.where(key, value);
      } else {
        query = query.where(key, 'ilike', `%${value}%`);
      }
    }
  }

  let totalApplicationsQuery = db('applications')
    .where('isDeleted', false) // Add this line to count only non-deleted applications
    .count('* as total');

  if (Object.keys(queryFilters).length > 0) {
    for (const [key, value] of Object.entries(queryFilters)) {
      if (key === 'isActive') {
        totalApplicationsQuery = totalApplicationsQuery.where(key, value);
      } else {
        totalApplicationsQuery = totalApplicationsQuery.where(
          key,
          'ilike',
          `%${value}%`,
        );
      }
    }
  }

  const [{ total }] = await totalApplicationsQuery;

  const applications = await query;
  const totalPages = Math.ceil(total / pageSize);

  return res.json({
    applications,
    currentPage: page,
    totalPages,
    pageSize,
    totalApplications: total,
  });
}

async function updateApplication(req, res) {
  const db = knex; // Get the shared database instance

  const applicationId = req.params.app_id;
  const { appName } = req.body;

  // Check if an application with the same name already exists
  const existingApplication = await db('applications')
    .where('appName', appName)
    .andWhereNot('id', applicationId)
    .first();

  if (existingApplication) {
    return res
      .status(status.CONFLICT)
      .send('An application with the same name already exists.');
  }

  const updatedApplication = await db('applications')
    .where('id', applicationId)
    .update({
      appName: req.body.appName,
      appDescription: req.body.appDescription,
      dateUpdated: new Date(),
    })
    .returning('*');

  if (!updatedApplication[0]) {
    return res
      .status(status.NOT_FOUND)
      .send('The application with the given ID was not found.');
  }

  return res.send(updatedApplication[0]);
}

async function deleteApplication(req, res) {
  const db = knex; // Get the shared database instance

  const applicationId = req.params.app_id;
  const deletedApplication = await db('applications')
    .where('id', applicationId)
    .update({
      isDeleted: true,
      isActive: false,
      dateUpdated: new Date(),
    })
    .returning('*');

  if (!deletedApplication[0]) {
    return res
      .status(status.NOT_FOUND)
      .send('The application with the given ID was not found.');
  }

  return res.send(deletedApplication[0]);
}

async function deactivateApplication(req, res) {
  const db = knex; // Get the shared database instance

  const applicationId = req.params.app_id;

  // Find the application by ID
  const application = await db('applications')
    .where('id', applicationId)
    .first();

  if (!application || application.isDeleted) {
    return res
      .status(status.NOT_FOUND)
      .send('The application with the given ID was not found.');
  }

  // Toggle isActive field and update
  const newIsActive = !application.isActive;
  const updatedApplication = await db('applications')
    .where('id', applicationId)
    .update({
      isActive: newIsActive,
      dateUpdated: new Date(),
    })
    .returning('*');

  return res.send(updatedApplication[0]);
}

module.exports = {
  addApplication,
  listApplication,
  updateApplication,
  deleteApplication,
  deactivateApplication,
};
