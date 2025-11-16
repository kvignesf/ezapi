const mongoose = require('mongoose');
const dbName = 'ezapi?authSource=admin';
const url = process.env.MONGO_CONNECTION + '/' + dbName;
//const url = 'mongodb://root:JRVvuh9D5V0IZxCW@34.66.45.162:27017' + '/' + dbName;
const dbConnect = () => {
	mongoose
		.connect(url, {
			useNewUrlParser: true,
			useCreateIndex: true, //allows to  quickly access data we need
			useUnifiedTopology: true,
			useFindAndModify: false
		})
		.then(() => console.log('Mongo Connected'))
		.catch((err) => console.log('Error Connecting to db', err));
};

module.exports = dbConnect;
