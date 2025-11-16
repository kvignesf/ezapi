const { parse } = require('expression-eval');

const expressionParser = (expr) => {
	const ast = parse(expr);
	return ast;
};
module.exports = expressionParser;
