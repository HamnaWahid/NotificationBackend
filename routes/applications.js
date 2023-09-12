/* eslint-disable import/no-dynamic-require */
const express = require('express');
const config = require('config');
const asyncError = require('../middleware/errorHandling');

const router = express.Router();
const dbName = config.get('db');
const {
  validateApp,
  validateUpdatingApp,
  validateAppPatch,
  validateGetApp,
} = require('../middleware/validation');

const {
  addApplication,
  listApplication,
  updateApplication,
  deleteApplication,
  deactivateApplication,
} = require(`../controllers/${dbName}/applicationController`);

router.get('/', validateGetApp, listApplication);

router.post('/', validateApp, addApplication);

router.put('/:app_id/update', validateUpdatingApp, updateApplication);

router.patch('/:app_id/delete', validateAppPatch, deleteApplication);

router.patch('/:app_id/deactivate', validateAppPatch, deactivateApplication);

module.exports = router;
