const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
	entry: './src/index.js', // The entry point of your application
	target: 'node', // Specify the target environment as Node.js
	output: {
		filename: 'bundle.js', // The name of the output bundle file
		path: path.resolve(__dirname, 'dist') // The output directory
	},
	module: {
		rules: [
			{
				test: /\.js$/, // Apply the loader to JavaScript files
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader', // Use babel-loader for transpiling
					options: {
						presets: ['@babel/preset-env'] // Use @babel/preset-env for configuring Babel
					}
				}
			}
		]
	},
	plugins: [
		new Dotenv() // Add the Dotenv plugin to load .env files
	]
};
