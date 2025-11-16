const mongoose = require('mongoose');

const productVideosSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true
	},
	youtubeURL: {
		type: String,
		required: true
	}
});

const ProductVideos = mongoose.model('product_videos', productVideosSchema);

module.exports = ProductVideos;
