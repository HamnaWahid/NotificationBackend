/* eslint-disable camelcase */
/* eslint-disable no-restricted-syntax */
const status = require('http-status');
const winston = require('winston/lib/winston/config');
const { Application } = require('../../models/application');

// const specificDate = new Date('2023-08-26T12:34:56');
const specificDate = new Date('2022-01-01T00:00:00.000Z');

// Function to add an application to MongoDB
async function addApplication(req, res) {
  const { appName, appDescription } = req.body;

  // Check if an application with the same name exists
  const existingApplication = await Application.findOne({ appName });

  if (existingApplication) {
    return res
      .status(status.CONFLICT)
      .send('An application with the same name already exists');
  }

  // Create and save the new application
  let application = new Application({
    appName,
    appDescription,
    createdBy: 'hamna', // Replace with actual username retrieval
  });

  application = await application.save();
  return res.status(status.OK).send(application);
}

async function listApplication(req, res) {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const sortBy = req.query.sortBy || 'appName'; // Default to sorting by appName
  const sortOrder = req.query.sortOrder || 'asc'; // Default to ascending order

  // Construct queryFilters without pageSize, page, sortBy, and sortOrder parameters
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
      } else if (key === 'appName') {
        queryFilters[key] = { $regex: value, $options: 'i' };
      } else {
        queryFilters[key] = value;
      }
    }
  }

  let totalApplications;
  let applications;

  queryFilters.isDeleted = false; // Add this condition to your existing queryFilters

  if (Object.keys(queryFilters).length === 0) {
    totalApplications = await Application.countDocuments(queryFilters);
    applications = await Application.find({})
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 }) // Apply sorting based on sortBy and sortOrder
      .skip((page - 1) * pageSize)
      .limit(pageSize);
  } else {
    totalApplications = await Application.countDocuments(queryFilters);
    applications = await Application.find(queryFilters)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 }) // Apply sorting based on sortBy and sortOrder
      .skip((page - 1) * pageSize)
      .limit(pageSize);
  }

  const totalPages = Math.ceil(totalApplications / pageSize);

  return res.json({
    applications,
    currentPage: page,
    totalPages,
    pageSize,
    totalApplications,
  });
}

async function updateApplication(req, res) {
  const { app_id } = req.params;
  const { appName, appDescription } = req.body;

  // Check if an application with the same name exists (excluding the current application)
  const existingApplication = await Application.findOne({
    _id: { $ne: app_id },
    appName,
  });

  if (existingApplication) {
    return res
      .status(status.CONFLICT)
      .send('An application with the same name already exists');
  }

  const updatedApplication = {
    appName,
    appDescription,
    dateUpdated: specificDate,
    // dateUpdated: Date.now(),
  };

  // Update the application
  const application = await Application.findByIdAndUpdate(
    app_id,
    updatedApplication,
    { new: true },
  );

  if (!application || application.isDeleted) {
    return res
      .status(status.NOT_FOUND)
      .send('The application with the given ID was not found.');
  }

  return res.send(application);
}

// delete a single application also add updatedBy
async function deleteApplication(req, res) {
  const application = await Application.findByIdAndUpdate(
    req.params.app_id,
    // { isDeleted: true, isActive: false, dateUpdated: Date.now() },
    // for testing
    { isDeleted: true, isActive: false, dateUpdated: specificDate },
    { new: true },
  );

  if (!application)
    return res
      .status(status.NOT_FOUND)
      .send('The application with the given ID was not found.');

  return res.send(application);
}

// toggle isActive also add updatedBy
async function deactivateApplication(req, res) {
  const applicationId = req.params.app_id;

  // Find the application by ID
  const application = await Application.findById(applicationId);

  if (!application || application.isDeleted) {
    return res
      .status(status.NOT_FOUND)
      .send('The application with the given ID was not found.');
  }

  // Toggle isActive field and save
  application.isActive = !application.isActive;
  application.dateUpdated = Date.now();
  await application.save();

  return res.send(application);
}

module.exports = {
  addApplication,
  listApplication,
  updateApplication,
  deleteApplication,
  deactivateApplication,
};
