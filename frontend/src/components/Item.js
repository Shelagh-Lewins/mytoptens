// An individual item

import React from 'react';
import { Col } from 'reactstrap';
import EditableTextField from './EditableTextField';
import './Item.scss';

const Item = props => {
	return (
		<Col className="item-container">
			<div className="item-header">
				<span className="order">{props.item.order}:</span><EditableTextField
					name={`${props.item.order}_title`}
					required={true}
					labelText="Title"
					data-state={`${props.item.order}_title`}
					data-entityid={props.item.id} // database id of the item
					id={`${props.item.order}_title`} // id of the html element
					handleInputChange={props.handleInputChange}
					handleNewValue={props.handleNewValue}
					value={props.item.title}
					placeholder="Enter the item title"
				/>
			</div>
			<div className="item-body">
				<span>Description:</span>
				<EditableTextField
					name={`${props.item.order}_description`}
					required={true}
					labelText="Title"
					data-state={`${props.item.order}_description`}
					data-entityid={props.item.id} // database id of the item
					id={`${props.item.order}_description`} // id of the html element
					handleInputChange={props.handleInputChange}
					handleNewValue={props.handleNewValue}
					value={props.item.description}
					placeholder="Enter the item description"
				/>
			</div>
		</Col>
	);
	/*
	function onDeleteItem(e) {
		props.onDeleteItem({
			'itemId': props.item.id,
			'listId': props.list,
		});
	} */
};

export default Item;
