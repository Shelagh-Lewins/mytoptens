// Top-level summary of a toptenlist

import React from 'react';
import { Col } from 'reactstrap';
import { Link } from 'react-router-dom';
// Note how the is_public is updated without making this into a React Component with state.
// By using props to populate the UI, we enable time travel and a direct connection with the store.

import SetTopTenListIsPublic from './SetTopTenListIsPublic';

import * as permissions from '../modules/permissions';

import './TopTenListSummary.scss';

const TopTenListSummary = props => {
	let canEdit = permissions.canEditTopTenList({ 'id': props.toptenlist.id });

	return (
		<Col sm="12" md="6">
			<div className="toptenlist-summary">
				<Link to={`/toptenlist/${props.toptenlist.id}`}>
					<div className="toptenlist-name">
						<div>{props.toptenlist.name}</div>
					</div>
				</Link>
				{canEdit && (
					<div className="toptenlist-summary-controls">
						<SetTopTenListIsPublic
							toptenlistId={props.toptenlist.id}
							isPublic={props.toptenlist.is_public}
							onChangeIsPublic={props.onChangeIsPublic}
						/>
						<button className="btn btn-danger" title="Delete" onClick={onDeleteTopTenList}>X</button>
					</div>
				)}
				<Link to={`/toptenlist/${props.toptenlist.id}`}>
					<div className="toptenlist-description">{props.toptenlist.description}</div>
				</Link>
				
				{props.showCreatedBy && 
					<div className="toptenlist-created-by">{props.toptenlist.created_by_username}</div>

				}
			</div>
		</Col>
	);

	function onDeleteTopTenList(e) {
		props.onDeleteTopTenList({ 'id': props.toptenlist.id, 'name': props.toptenlist.name });
	}
};

export default TopTenListSummary;
