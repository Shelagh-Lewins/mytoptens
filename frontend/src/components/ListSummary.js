// An individual list

import React from 'react';
import { Col } from 'reactstrap';
import { Link } from 'react-router-dom';
// Note how the is_public is updated without making this into a React Component with state.
// By using props to populate the UI, we enable time travel and a direct connection with the store.

import { LIST_IS_PUBLIC_TEXTS } from '../constants';

import * as permissions from '../modules/permissions';

const ListSummary = props => {
	let id=`select-${props.list.id}`;
	let value = props.list.is_public ? 'Public' : 'Private';
	let canEdit = permissions.canEditList({ 'id': props.list.id });

	return (
		<Col sm="3" md="4" className="list-container">
			<Link to={`/list/${props.list.slug}`}>
				<div className="list-header">
					<div>{props.list.name}</div>
				</div>
				<div className="list-body">{props.list.description}</div>
			</Link>
			<div className="list-status">
				<label>Set list private/public status
					<select className="form-control" value={value} onChange={onIsPublicChange} id={id}>
						{LIST_IS_PUBLIC_TEXTS.map(is_public => (
							<option key={is_public} value={is_public}>{is_public}</option>
						))}
					</select>
				</label>
			</div>
			{canEdit &&
				<button className="btn btn-danger" onClick={onDeleteList}>Delete</button>
			}
			{props.showCreatedBy && 
				<div className="list-created-by">Created by: {props.list.created_by_username}</div>

			}
			
		</Col>
	);

	function onIsPublicChange(e) {
		// map from select options to true / false
		const value = e.target.value === 'Public' ? true : false;
		props.onIsPublicChange({ 'id': props.list.id, 'is_public': value });
	}

	function onDeleteList(e) {
		props.onDeleteList({ 'id': props.list.id, 'name': props.list.name });
	}
};

export default ListSummary;
