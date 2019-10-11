import store from '../store';
import sanitizeFilename from './sanitizeFilename';
import { MAX_TOPTENITEMS_IN_TOPTENLIST } from '../constants';

const topTenListAsText = (id) => {
	const state = store.getState();
	const topTenLists = state.topTenList.things;
	const topTenList = topTenLists[id];
	const filename = `${sanitizeFilename(topTenList.name)}.txt`;

	let text = `Top Ten List: ${topTenList.name}`;
	text += '\n';
	text += topTenList.description;
	text += '\n';

	for (let i = 0; i < MAX_TOPTENITEMS_IN_TOPTENLIST; i += 1) {
		const topTenItem = state.topTenItem.things[topTenList.topTenItem[i]];

		if (topTenItem && topTenItem.name !== '') {
			text += `\n${i + 1}: ${topTenItem.name}`;
			text += '\n';

			const childTopTenList = Object.values(topTenLists).find(topTenListObj => topTenListObj.parent_topTenItem === topTenList.topTenItem[i]);

			if (childTopTenList) {
				text += `Child Top Ten List: ${childTopTenList.name}`;
				text += '\n';
			}

			if (topTenItem.description !== '') {
				text += topTenItem.description;
				text += '\n';
			}
		}
	}

	const element = document.createElement('a');
	element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
};

export default topTenListAsText;
