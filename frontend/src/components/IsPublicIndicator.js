// Set whether a topTenList or reusableItem is public
// Note how the is_public is updated without making this into a React Component with state.
// By using props to populate the UI, we enable time travel and a direct connection with the store.

import React from 'react';
import PropTypes from 'prop-types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './IsPublicIndicator.scss';

import { COLORS } from '../constants';

const IsPublicIndicator = (props) => {
	const { targetId, isPublic } = props;
	const isPublicData = isPublic ? 'public' : 'private';
	const iconName = isPublic ? 'lock-open' : 'lock';
	const tooltip = isPublic ? 'Public Top Ten List: click to make it private' : 'Private Top Ten List: click to make it public';

	function onChangeIsPublic(e) {
		// map from button data to true / false
		const value = (e.target.dataset.ispublic === 'public');
		props.onChangeIsPublic({ 'id': e.target.dataset.targetid, 'is_public': !value });
	}

	return (
		<div className="is-public">
			<button
				type="button"
				onClick={onChangeIsPublic}
				data-targetid={targetId}
				data-ispublic={isPublicData}
				className={`${isPublicData} btn btn-default`}
				title={tooltip}
			>
				<FontAwesomeIcon icon={['fas', iconName]} style={{ 'color': COLORS.REGULARTEXT }} size="1x" />
			</button>
		</div>
	);
};

IsPublicIndicator.propTypes = {
	'targetId': PropTypes.string.isRequired,
	'isPublic': PropTypes.bool.isRequired,
	'onChangeIsPublic': PropTypes.func.isRequired,
};

export default IsPublicIndicator;
