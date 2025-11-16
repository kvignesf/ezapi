const express = require('express');

const router = new express.Router();

const expressionParser = require('../utility/rawExpressionParse');

router.post('/rawExpressionParse', async (req, res) => {
	const { expr } = req.body;
	if (!expr) return res.status(400).json({ message: 'expr is required..' });
	const jsonObject = expressionParser(expr);
	return res.send(jsonObject);
});

module.exports = router;
