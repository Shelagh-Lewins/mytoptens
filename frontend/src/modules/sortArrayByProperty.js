// sort an array of objects by a text property
// this can include ISO dates

const sortArrayByProperty = (arrayToSort, property) => {
	const myArray = [...arrayToSort];

	return myArray.sort(
		(a, b) => {
			// ignore case
			// and don't error on undefined value
			const textA = a[property].toUpperCase() || '';
			const textB = b[property].toUpperCase() || '';

			if (textA < textB) {
				return -1;
			}
			if (textA > textB) {
				return 1;
			}

			// values must be equal
			return 0;
		},
	);
};

export default sortArrayByProperty;
