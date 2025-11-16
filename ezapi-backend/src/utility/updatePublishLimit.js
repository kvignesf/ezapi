const Projects = require('../models/projects');
const Products = require('../models/products');

async function updatePublishLimit(user) {
	user = user.toObject();
	let userId = user.user_id;
	const subscribedProduct = await Products.findOne(
		{ stripe_product_id: user.subscribedPlan },
		{ no_of_republish: 1, _id: 0 }
	).lean();
	await Projects.updateMany(
		{
			author: userId,
			isDeleted: false
		},
		{
			$set: { publishLimit: subscribedProduct.no_of_republish }
		}
	);
	return;
}

module.exports = {
	updatePublishLimit
};
