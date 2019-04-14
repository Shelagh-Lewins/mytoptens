// Top-level summary of a topTenList

import React from 'react';
import { Col } from 'reactstrap';
import { Link } from 'react-router-dom';
// Note how the is_public is updated without making this into a React Component with state.
// By using props to populate the UI, we enable time travel and a direct connection with the store.

import SetTopTenListIsPublic from './SetTopTenListIsPublic';

import * as permissions from '../modules/permissions';

import './TopTenListSummary.scss';

const TopTenListSummary = props => {
	let canEdit = permissions.canEditTopTenList(props.topTenList.id);

	return (
		<Col sm="12" md="6">
			<div className="topTenList-summary">
				<Link to={`/topTenList/${props.topTenList.id}`}>
					<div className="topTenList-name">
						<div>{props.topTenList.name}</div>
					</div>
				</Link>
				{canEdit && (
					<div className="topTenList-summary-controls">
						<SetTopTenListIsPublic
							topTenListId={props.topTenList.id}
							isPublic={props.topTenList.is_public}
							onChangeIsPublic={props.onChangeIsPublic}
						/>
						<button className="btn btn-danger" title="Delete" onClick={onDeleteTopTenList}>X</button>
					</div>
				)}
				<Link to={`/topTenList/${props.topTenList.id}`}>
					<div className="topTenList-description">{props.topTenList.description}</div>
				</Link>
				
				{props.showCreatedBy && 
					<div className="topTenList-created-by">{props.topTenList.created_by_username}</div>

				}
			</div>
		</Col>
	);

	function onDeleteTopTenList(e) {
		props.onDeleteTopTenList({ 'id': props.topTenList.id, 'name': props.topTenList.name });
	}
};

export default TopTenListSummary;
