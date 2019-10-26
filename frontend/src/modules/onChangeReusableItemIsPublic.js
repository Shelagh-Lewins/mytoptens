import { connect } from 'react-redux';
import * as reusableItemReducer from './reusableItem';

function onChangeReusableItemIsPublic({
	id,
	is_public,
	reusableItem,
	dispatch,
}) {
	// const { reusableItem } = this.props;
	const currentIsPublic = reusableItem.is_public;

	let text = 'This is a private Reusable Item; only you can see it. If you make it public, other people will be able to use it in their lists and suggest changes to it. Do you want to continue?';

	if (currentIsPublic) {
		text = 'This is a public Reusable Item. This action will make a private copy of it which your Top Ten Items will reference instead. Do you want to continue?';
	}

	if (confirm(text)) { // eslint-disable-line no-restricted-globals
		// const { dispatch } = this.props;

		dispatch(reusableItemReducer.setReusableItemIsPublic({ id, is_public }));
	}
}

export default onChangeReusableItemIsPublic;
