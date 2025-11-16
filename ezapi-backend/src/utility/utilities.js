const capitalizeFirstLetter = (stringVal) => {
	if (typeof stringVal != 'string') {
		return '';
	}

	return stringVal.charAt(0).toUpperCase() + stringVal.slice(1);
};

// function resolveObjectFieldWithPath(path, obj = self, separator = '.') {
// 	var properties = Array.isArray(path) ? path : path.split(separator);
// 	return properties.reduce((prev, curr) => prev && prev[curr], obj);
// }

// Returns utc date in MMDDYY HH:MM::SS format
function getFormattedUtcDateTime() {
	let d = new Date();

	// Adds 0 to start for 1 digit number
	let padZero = (num) => {
		return ('00' + num).slice(-2);
	};

	let MM = padZero(d.getUTCMonth() + 1);
	let DD = padZero(d.getUTCDate());
	let YY = padZero(d.getUTCFullYear());
	let Hr = padZero(d.getUTCHours());
	let Min = padZero(d.getUTCMinutes());
	let Sec = padZero(d.getUTCSeconds());

	let formattedUtc = MM + '/' + DD + '/' + YY + ' ' + Hr + ':' + Min + ':' + Sec;
	return formattedUtc;
}

// Remove duplicate array item
function removeDuplicateItems(arr) {
	let seen = {};
	return arr.filter(function (item) {
		return seen.hasOwnProperty(item) ? false : (seen[item] = true);
	});
}

module.exports = {
	capitalizeFirstLetter,
	getFormattedUtcDateTime,
	removeDuplicateItems
};
