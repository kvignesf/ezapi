const mongoose = require('mongoose');

const ordersShcema = new mongoose.Schema(
	{
		orderId: {
			type: String,
			unique: true,
			required: true
		},
		projectId: { type: String, required: true, ref: 'projects' },
		productName: { type: String, required: true },
		productVersion: { type: String, required: true },
		productPrice: { type: String, required: true },
		status: { type: String, default: 'initiated' },
		lastPaymentError: { type: String, default: '', required: false },
		paid: { type: Boolean, default: false, required: false },
		user: {
			type: String,
			required: true,
			ref: 'userdata' //creates a relationship to user document
		},
		paymentIntentId: { type: String, required: false }
	},
	{ timestamps: true }
);

//Virtual to populate project data
ordersShcema.virtual('projectData', {
	ref: 'projects',
	localField: 'projectId',
	foreignField: 'projectId',
	justOne: true // for many-to-1 relationships
});

ordersShcema.set('toObject', { virtuals: true });
ordersShcema.set('toJSON', { virtuals: true });

const Orders = mongoose.model('orders', ordersShcema);

module.exports = Orders;
