// download text to the user's local file system
// by creating a temporary anchor and using its download attribute

const downloadFile = (text, filename) => {
	const element = document.createElement('a');
	element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
};

export default downloadFile;
