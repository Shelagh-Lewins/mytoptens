// Top-level summary of a list

import React from 'react';
import { Col } from 'reactstrap';
import { Link } from 'react-router-dom';
// Note how the is_public is updated without making this into a React Component with state.
// By using props to populate the UI, we enable time travel and a direct connection with the store.

import SetListIsPublic from './SetListIsPublic';

import * as permissions from '../modules/permissions';

import './ListSummary.scss';

const ListSummary = props => {
	let canEdit = permissions.canEditList({ 'id': props.list.id });

	return (
		<Col sm="12" md="6">
			<div className="list-summary">
				<Link to={`/list/${props.list.id}`}>
					<div className="list-name">
						<div>{props.list.name}</div>
					</div>
				</Link>
				{canEdit && (
					<div className="list-summary-controls">
						<SetListIsPublic
							listId={props.list.id}
							isPublic={props.list.is_public}
							onChangeIsPublic={props.onChangeIsPublic}
						/>
						<button className="btn btn-danger" title="Delete" onClick={onDeleteList}>X</button>
					</div>
				)}
				<Link to={`/list/${props.list.id}`}>
					<div className="list-description">{props.list.description}</div>
				</Link>
				
				{props.showCreatedBy && 
					<div className="list-created-by">{props.list.created_by_username}</div>

				}
			</div>
		</Col>
	);

	function onDeleteList(e) {
		props.onDeleteList({ 'id': props.list.id, 'name': props.list.name });
	}
};

export default ListSummary;
