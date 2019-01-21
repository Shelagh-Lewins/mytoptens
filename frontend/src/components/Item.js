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
					id={`${props.item.order}_title`}
					handleInputChange={ props.handleInputChange }
					value={ props.item.title }
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
					id={`${props.item.order}_description`}
					handleInputChange={ props.handleInputChange }
					value={ props.item.description }
					placeholder="Enter the item description"
				/>
			</div>
		</Col>
	);

	function onDeleteItem(e) {
		props.onDeleteItem({
			'itemId': props.item.id,
			'listId': props.list,
		});
	}
};

export default Item;
