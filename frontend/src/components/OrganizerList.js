// a single list to be displayed in the Organizer
// can be expanded to show items
// an item can be selected

import React, { Component } from 'react';

class OrganizerList extends Component {
	constructor(props) {
		super();

		this.state = {
			'showItems': false,
		};
	}

	render() {
		return (
			<div>{this.props.list.name}
			</div>
		);
	}
}

export default OrganizerList;
