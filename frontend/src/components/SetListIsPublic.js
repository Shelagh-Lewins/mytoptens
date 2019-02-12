// Set whether the list is public
// Note how the is_public is updated without making this into a React Component with state.
// By using props to populate the UI, we enable time travel and a direct connection with the store.

import React from 'react';
import { Label } from 'reactstrap';

import { LIST_IS_PUBLIC_TEXTS } from '../constants';

import './SetListIsPublic.scss';

const SetListIsPublic = props => {
	let id=`select-${props.list.id}`;
	let value = props.list.is_public ? 'Public' : 'Private';

	function onIsPublicChange(e) {
		// map from select options to true / false
		const value = e.target.value === 'Public' ? true : false;
		props.onIsPublicChange({ 'id': props.list.id, 'is_public': value });
	}

	return (
		<div className="list-status">
			<Label>Set list private/public status
				<select className="form-control" value={value} onChange={onIsPublicChange} id={id}>
					{LIST_IS_PUBLIC_TEXTS.map(is_public => (
						<option key={is_public} value={is_public}>{is_public}</option>
					))}
				</select>
			</Label>
		</div>
	);
};

export default SetListIsPublic;
