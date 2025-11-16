const mongoose = require('mongoose');

const productsShcema = new mongoose.Schema({
	stripe_product_id: { type: String, required: false },
	plan_name: { type: String, required: true },
	currency: { type: String, required: true, default: 'usd' },
	isDisabled: { type: Boolean, required: false, default: false },
	designProjects: { type: Number, required: true },
	testProjects: { type: Number, required: true },
	noSpecNoDb: { type: Number, required: true },
	aggregateProjects: { type: Number, required: true },
	designProjectsYearly: { type: Number, required: true },
	testProjectsYearly: { type: Number, required: true },
	noSpecNoDbYearly: { type: Number, required: true },
	aggregateProjectsYearly: { type: Number, required: true },
	// no_of_projects: { type: Number, required: true },
	no_of_republish: { type: Number, required: true },
	no_of_creator_licenses: { type: Number, required: true },
	no_of_collaborators: { type: Number, required: true },
	no_of_testdata_gen: { type: Number, required: true },
	spec: { type: Boolean, required: true },
	code: { type: Boolean, required: true },
	mock: { type: Boolean, required: true },
	stripe: { type: Array, required: false, default: [] },
	test_data: { type: Boolean, required: true },
	functional_tests: { type: Boolean, required: true },
	performance_tests: { type: Boolean, required: true },
	security_tests: { type: Boolean, required: true },
	validity: { type: String, required: true, default: 'renewal' },
	connectors: {
		ms_sql: { type: Boolean, required: true },
		my_sql: { type: Boolean, required: true },
		postgres: { type: Boolean, required: true }
	},
	group: { type: Array, required: false }
});

const Products = mongoose.model('products', productsShcema);

module.exports = Products;
