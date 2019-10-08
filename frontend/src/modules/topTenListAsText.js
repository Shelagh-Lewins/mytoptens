import store from '../store';

const topTenListAsText = (id) => {
	const state = store.getState();
	const topTenList = state.topTenList.things[id];

	let text = `Top Ten List: ${topTenList.name}`;

	return text;
};

export default topTenListAsText;
