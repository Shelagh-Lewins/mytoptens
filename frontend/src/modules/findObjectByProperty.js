export default function findObjectByProperty({ parentObject, property, value }) {
	// e.g. find a topTenList in the store based on its id
	// it feels like there ought to be a smarter way to do this!
	// but this does work, and stops once the object is found
	const keys = Object.keys(parentObject);

	for (let i=0; i<keys.length; i++) {
		let childObject = parentObject[keys[i]];
		if (childObject[property] === value) {
			return childObject;
		}
	}

	return;
}
