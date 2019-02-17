// a single list to be displayed in the Organizer
// can be expanded to show items
// an item can be selected

import React, { Component } from 'react';
import { Row, Col } from 'reactstrap';

class OrganizerList extends Component {
	constructor(props) {
		super();

		this.state = {
			'showItems': false,
		};
	}

	onShowItems() {
		this.setState({
			'showItems': !this.state.showItems,
		});
	}

	renderItems() {
		return (
			<div className="items">
				{this.props.items.map(item =>
					<div key={item.id}>
						{item.name}
					</div>
				)}
			</div>
		);
	}

	render() {
		let showItemsButtonText = '+';

		if (this.state.showItems) {
			showItemsButtonText = '-';
		}

		return (
			<Row className="organizer-list">
				<Col>
					<button className="btn btn-light show-items" onClick={this.onShowItems.bind(this)}>{showItemsButtonText}</button>
					<div className="name">{this.props.list.name}</div>
					{this.state.showItems && this.renderItems()}
				</Col>
			</Row>
		);
	}
}

export default OrganizerList;
