const { Router } = require('express');
const router = new Router();

const authenticate = require('../authentication/authentication');

const settings = require('../controllers/settingsController');

router
	.route('/settings')
	.get(authenticate, settings.getSettings)
	.put(authenticate, settings.putSettings);

module.exports = router;
