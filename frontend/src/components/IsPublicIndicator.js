// Set whether the topTenList is public
// Note how the is_public is updated without making this into a React Component with state.
// By using props to populate the UI, we enable time travel and a direct connection with the store.

import React from 'react';
import PropTypes from 'prop-types';

import './IsPublicIndicator.scss';

const IsPublicIndicator = (props) => {
	const { topTenListId, isPublic } = props;
	const isPublicData = isPublic ? 'public' : 'private';
	const tooltip = isPublic ? 'Public' : 'Private';


	function onChangeIsPublic(e) {
		// map from button data to true / false
		const value = (e.target.dataset.ispublic === 'public');
		props.onChangeIsPublic({ 'id': e.target.dataset.toptenlistid, 'is_public': !value });
	}

	return (
		<div className="is-public">
			<button
				type="button"
				onClick={onChangeIsPublic}
				data-toptenlistid={topTenListId}
				data-ispublic={isPublicData}
				className={`${isPublicData} btn btn-default`}
				title={tooltip}
			>
			&nbsp;
			</button>
		</div>
	);
};

IsPublicIndicator.propTypes = {
	'topTenListId': PropTypes.string.isRequired,
	'isPublic': PropTypes.bool.isRequired,
	'onChangeIsPublic': PropTypes.func.isRequired,
};

export default IsPublicIndicator;