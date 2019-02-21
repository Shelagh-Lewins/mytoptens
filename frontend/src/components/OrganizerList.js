// a single list to be displayed in the Organizer
// can be expanded to show items
// an item can be selected

import React, { Component } from 'react';
import { Row, Col } from 'reactstrap';

class OrganizerList extends Component {
	constructor(props) {
		super();
		//console.log('item props ', props);
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
		this.props.onSelectItem({ 'list': this.props.list, 'order': e.target.dataset.order, 'childListId': e.target.dataset.childlistid });
	}

	renderItems() {
		const selectedItemOrder = parseInt(this.props.selectedItemOrder); // element property is a string. Order should be a number.
		const listId = this.props.list.id;
		const selectedListId = this.props.selectedListId;
		if (listId === selectedListId ) {
			console.log('selected list ', this.props.list.name);
			console.log('selected item order ', selectedItemOrder);
		}

		return (
			<div className="items">
				{this.props.itemOrganizerData[listId].map((item) => { // eslint-disable-line array-callback-return
					const isSelectedItem = ((listId === selectedListId) && (item.order === selectedItemOrder));

					let childListElm;

					if (item.childListId) {
						const childList = this.props.listOrganizerData.find((list) => list.id === item.childListId);
						childListElm = (
							<span className="child-list">> {childList.name}</span>
						);
					}

					if (item.name) {
						return (<div key={item.id} className={`item ${isSelectedItem ? 'selected' : ''}`}>
							<span
								onClick={this.onSelectItem.bind(this)}
								data-order={item.order}
								data-childlistid={item.childListId}
							><span className="order">{item.order}:</span>{item.name}</span>{childListElm}
						</div>);
					}
				}
				)}
			</div>
		);
	}

	render() {
		const name = this.props.list.name;

		let showItemsButtonText = '+';

		if (this.state.showItems) {
			showItemsButtonText = '-';
		}

		return (
			<Row className="organizer-list">
				<Col>
					<button className="btn btn-light show-items" onClick={this.onShowItems.bind(this)}>{showItemsButtonText}</button>
					<div className="name">{name}</div>
					{this.state.showItems && this.renderItems()}
				</Col>
			</Row>
		);
	}
}

export default OrganizerList;
