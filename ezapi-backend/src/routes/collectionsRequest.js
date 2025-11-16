const express = require('express');
const router = new express.Router();

const collectionsRequest = require('../models/collectionRequest');

router.post('/collectionsRequest/:userId/:id', async (req, res) => {
	try {
		const request = new collectionsRequest({
			id: req.params.id,
			userId: req.params.userId,
			request: req.body.request,
			response: req.body.response,
			name: req.body.name,
			onSave: req.body.onSave,
			parentFolderId: req.body.parentFolderId,
			isRecent: req.body.isRecent,
			createdAt: req.body.createdAt,
			modifiedAt: req.body.modifiedAt
		});
		const post = await request.save();
		res.status(200).send(post);
	} catch (err) {
		res.send(err);
	}
});

router.put('/collectionsRequest/:userId/:id', async (req, res) => {
	try {
		if (req.body.name) {
			await collectionsRequest.updateOne(
				{ userId: req.params.userId, id: req.params.id },
				{
					$set: {
						name: req.body.name
					}
				}
			);
		}
		if (req.body.request) {
			await collectionsRequest.updateOne(
				{ userId: req.params.userId, id: req.params.id },
				{
					$set: {
						request: req.body.request
					}
				}
			);
		}
		if (req.body.response) {
			await collectionsRequest.updateOne(
				{ userId: req.params.userId, id: req.params.id },
				{
					$set: {
						response: req.body.response
					}
				}
			);
		}
		if (req.body.parentFolderId) {
			await collectionsRequest.updateOne(
				{ userId: req.params.userId, id: req.params.id },
				{
					$set: {
						parentFolderId: req.body.parentFolderId
					}
				}
			);
		}
		if (req.body.onSave === true || req.body.onSave === false) {
			await collectionsRequest.updateOne(
				{ userId: req.params.userId, id: req.params.id },
				{
					$set: {
						onSave: req.body.onSave
					}
				}
			);
		}
		if (req.body.isRecent === true || req.body.isRecent === false) {
			await collectionsRequest.updateOne(
				{ userId: req.params.userId, id: req.params.id },
				{
					$set: {
						isRecent: req.body.isRecent
					}
				}
			);
		}
		if (req.body.modifiedAt) {
			await collectionsRequest.updateOne(
				{ userId: req.params.userId, id: req.params.id },
				{
					$set: {
						modifiedAt: req.body.modifiedAt
					}
				}
			);
		}
		const data = await collectionsRequest.findOne({
			id: req.params.id,
			userId: req.params.userId
		});
		res.status(200).send(data);
	} catch (err) {
		res.send(err);
	}
});

router.get('/collectionsRequest/:userId/:id', async (req, res) => {
	try {
		const data = await collectionsRequest.findOne({
			id: req.params.id,
			userId: req.params.userId
		});
		if (!data) {
			return res.status(404).send({ error: 'File not found' });
		} else {
			res.status(200).send(data);
		}
	} catch (err) {
		res.send(err);
	}
});

router.delete('/collectionsRequest/:userId/:id', async (req, res) => {
	try {
		const data = await collectionsRequest.findOneAndDelete({
			userId: req.params.userId,
			id: req.params.id
		});
		if (!data) {
			return res.status(404).send({ error: 'File is not present' });
		} else {
			res.status(200).send(data);
		}
	} catch (err) {
		res.send(err);
	}
});

router.get('/collectionsRequest/:userId', async (req, res) => {
	try {
		const data = await collectionsRequest.find({ userId: req.params.userId });

		if (!data) {
			res.send('Data not present');
		} else {
			res.status(200).send(data);
		}
	} catch (err) {
		res.send(err);
	}
});

module.exports = router;
