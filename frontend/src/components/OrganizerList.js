// a single list to be displayed in the Organizer
// can be expanded to show items
// an item can be selected

import React, { Component } from 'react';
import { Row, Col } from 'reactstrap';

class OrganizerList extends Component {
	constructor(props) {
		super();

		this.state = {
			'showItems': props.showItems,
		};
	}

	onShowItems() {
		this.setState({
			'showItems': !this.state.showItems,
		});
	}

	onSelectItem (e) {
		this.props.onSelectItem({ 'list': this.props.list, 'order': e.target.dataset.order });
	}

	renderItems() {
		const selectedItemOrder = this.props.selectedItemOrder;
		const listId = this.props.list.id;
		const selectedListId = this.props.selectedListId;

		return (
			<div className="items">
				{this.props.items.map((item, index) => { // eslint-disable-line array-callback-return
					const isSelectedItem = ((listId === selectedListId) && (index+1 === selectedItemOrder));

					if (item.name) {
						return (<div key={item.id} className={`item ${isSelectedItem ? 'selected' : ''}`}>
							<span
								onClick={this.onSelectItem.bind(this)}
								data-order={index+1}
							><span className="order">{index+1}:</span>{item.name}</span>
						</div>);
					}
				}
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
