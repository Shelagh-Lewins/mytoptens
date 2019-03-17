// a single toptenlist to be displayed in the Organizer
// can be expanded to show items
// an item can be selected

import React, { Component } from 'react';
import { Row, Col } from 'reactstrap';

class OrganizerTopTenList extends Component {
	constructor(props) {
		super();
		//console.log('item props ', props);
		this.state = {
			'showItems': props.showItems,
		};

		this.onSelectItem = this.onSelectItem.bind(this);
		this.onShowItems = this.onShowItems.bind(this);
	}

	onShowItems() {
		this.setState({
			'showItems': !this.state.showItems,
		});
	}

	onSelectItem (e) {
		this.props.onSelectItem({ 'toptenlist': this.props.toptenlist, 'order': e.target.dataset.order, 'childTopTenListId': e.target.dataset.childtoptenlistid });
	}

	renderItems() {
		const selectedItemOrder = parseInt(this.props.selectedItemOrder); // element property is a string. Order should be a number.
		const toptenlistId = this.props.toptenlist.id;
		const selectedTopTenListId = this.props.selectedTopTenListId;

		return (
			<div className="items">
				{this.props.itemOrganizerData[toptenlistId].map((item) => { // eslint-disable-line array-callback-return
					const isSelectedItem = ((toptenlistId === selectedTopTenListId) && (item.order === selectedItemOrder));

					let childTopTenListElm;

					if (item.childTopTenListId) {
						const childTopTenList = this.props.toptenlistOrganizerData.find((toptenlist) => toptenlist.id === item.childTopTenListId);
						childTopTenListElm = (
							<span className="child-toptenlist">> {childTopTenList.name}</span>
						);
					}

					if (item.name) {
						return (<div key={item.id} className={`item ${isSelectedItem ? 'selected' : ''}`}>
							<span
								onClick={this.onSelectItem}
								data-order={item.order}
								data-childtoptenlistid={item.childTopTenListId}
							><span className="order">{item.order}:</span>{item.name}</span>{childTopTenListElm}
						</div>);
					}
				}
				)}
			</div>
		);
	}

	render() {
		const name = this.props.toptenlist.name;

		const isSelectedTopTenList = (this.props.toptenlist.id === this.props.selectedTopTenListId);

		let showItemsButtonText = '+';

		if (this.state.showItems) {
			showItemsButtonText = '-';
		}

		return (
			<Row className={`organizer-list ${isSelectedTopTenList ? 'selected' : ''}`}>
				<Col>
					<button className="btn btn-light show-items" onClick={this.onShowItems}>{showItemsButtonText}</button>
					<div className="name">{name}</div>
					{this.state.showItems && this.renderItems()}
				</Col>
			</Row>
		);
	}
}

export default OrganizerTopTenList;
