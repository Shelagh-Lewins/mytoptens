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

import * as permissions from '../modules/permissions';

import './TopTenListSummary.scss';

const TopTenListSummary = (props) => {
	const { topTenList, onChangeIsPublic, showCreatedBy } = props;
	const canEdit = permissions.canEditTopTenList(topTenList.id);

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

				{showCreatedBy
					&& <div className="toptenlist-created-by" title="Top Ten List owner"><FontAwesomeIcon icon={['fas', 'user']} style={{ 'color': COLORS.REGULARTEXT }} size="1x" />{topTenList.created_by_username}</div>

				}
			</div>
		</Col>
	);
};

TopTenListSummary.propTypes = {
	'onChangeIsPublic': PropTypes.func.isRequired,
	'onDeleteTopTenList': PropTypes.func.isRequired,
	'showCreatedBy': PropTypes.bool.isRequired,
	'topTenList': PropTypes.objectOf(PropTypes.any).isRequired,
};

export default TopTenListSummary;
