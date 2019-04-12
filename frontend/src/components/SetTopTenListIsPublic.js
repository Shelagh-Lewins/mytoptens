// Set whether the topTenList is public
// Note how the is_public is updated without making this into a React Component with state.
// By using props to populate the UI, we enable time travel and a direct connection with the store.

import React from 'react';

import './SetTopTenListIsPublic.scss';

const SetTopTenListIsPublic = props => {
	const topTenListId = props.topTenListId;
	const isPublic = props.isPublic ? 'public' : 'private';
	const tooltip = props.isPublic ? 'Public' : 'Private';


	function onChangeIsPublic(e) {
		// map from button data to true / false
		const value = e.target.dataset.ispublic === 'public' ? true : false;
		props.onChangeIsPublic({ 'id': e.target.dataset.toptenlistid, 'is_public': !value });
	}

	return (
		<div className="is-public">
			<button
				onClick={onChangeIsPublic}
				data-toptenlistid={topTenListId}
				data-ispublic={isPublic}
				className={`${isPublic} btn btn-default`}
				title={tooltip}
			>&nbsp;</button>
		</div>
	);
};

export default SetTopTenListIsPublic;
