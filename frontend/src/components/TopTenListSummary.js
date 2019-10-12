// Top-level summary of a topTenList

import React from 'react';
import PropTypes from 'prop-types';
import { Col } from 'reactstrap';
import { Link } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { COLORS } from '../constants';
// Note how the is_public is updated without making this into a React Component with state.
// By using props to populate the UI, we enable time travel and a direct connection with the store.

import IsPublicIndicator from './IsPublicIndicator';
import './TopTenListSummary.scss';

const TopTenListSummary = (props) => {
	const { topTenList, onChangeIsPublic } = props;

	const { canEdit } = topTenList;

	const dateOptions = { 'year': 'numeric', 'month': 'short', 'day': 'numeric' };

	function onDeleteTopTenList() {
		props.onDeleteTopTenList({ 'id': props.topTenList.id, 'name': props.topTenList.name });
	}

	return (
		<Col sm="12" md="6">
			<div className="toptenlist-summary">
				<Link to={`/topTenList/${topTenList.id}`}>
					<div className="toptenlist-name">
						<div>{topTenList.name}</div>
					</div>
				</Link>
				{canEdit && (
					<div className="toptenlist-summary-controls">
						<IsPublicIndicator
							targetId={topTenList.id}
							isPublic={topTenList.is_public}
							onChangeIsPublic={onChangeIsPublic}
						/>
						<button type="button" className="btn btn-danger" title="Delete" onClick={onDeleteTopTenList}>X</button>
					</div>
				)}
				<Link to={`/toptenlist/${topTenList.id}`}>
					<div className="toptenlist-description">{topTenList.description}</div>
				</Link>

				<div className="toptenlist-created-by" title="Top Ten List owner"><FontAwesomeIcon icon={['fas', 'user']} style={{ 'color': COLORS.REGULARTEXT }} size="1x" />{topTenList.created_by_username}</div>

				<div className="toptenlist-modified-at" title="Date of last edit">
					<FontAwesomeIcon icon={['fas', 'edit']} style={{ 'color': COLORS.REGULARTEXT }} size="1x" />{new Date(topTenList.modified_at).toLocaleString('en-GB', dateOptions)}
				</div>
			</div>
		</Col>
	);
};

TopTenListSummary.propTypes = {
	'onChangeIsPublic': PropTypes.func.isRequired,
	'onDeleteTopTenList': PropTypes.func.isRequired,
	'topTenList': PropTypes.objectOf(PropTypes.any).isRequired,
};

export default TopTenListSummary;
