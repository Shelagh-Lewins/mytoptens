// Set whether the list is public
// Note how the is_public is updated without making this into a React Component with state.
// By using props to populate the UI, we enable time travel and a direct connection with the store.

import React from 'react';

import './SetListIsPublic.scss';

const SetListIsPublic = props => {
	const listId = props.listId;
	const isPublic = props.isPublic ? 'public' : 'private';
	const tooltip = props.isPublic ? 'Public' : 'Private';


	function onChangeIsPublic(e) {
		// map from button data to true / false
		const value = e.target.dataset.ispublic === 'public' ? true : false;
		props.onChangeIsPublic({ 'id': e.target.dataset.listid, 'is_public': !value });
	}

	return (
		<div className="is-public">
			<button
				onClick={onChangeIsPublic}
				data-listid={listId}
				data-ispublic={isPublic}
				className={`${isPublic} btn btn-default`}
				title={tooltip}
			>&nbsp;</button>
		</div>
	);
};

export default SetListIsPublic;
