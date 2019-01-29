// An individual item

import React from 'react';
import { Col } from 'reactstrap';
import EditableTextField from './EditableTextField.js';
import './Item.scss';

const Item = props => {
	return (
		<Col className="item-container">
			<div className="item-header">
				<span className="order">{props.item.order}:</span><EditableTextField
					canEdit={props.canEdit}
					name={`${props.item.order}_name`}
					label="Item name"
					placeholder="Click here to add an item"
					required={true}
					data-state={`${props.item.order}_name`}
					data-entityid={props.item.id} // database id of the item
					id={`${props.item.order}_name`} // id of the html element
					handleInputChange={props.handleInputChange}
					handleNewValue={props.handleNewValue}
					value={props.item.name}
				/>
			</div>
			{(props.item.name !== '') &&
				<div className="item-body">
					<EditableTextField
						canEdit={props.canEdit}
						name={`${props.item.order}_description`}
						placeholder="Click here to add a description"
						label="Item description"
						data-state={`${props.item.order}_description`}
						data-entityid={props.item.id} // database id of the item
						id={`${props.item.order}_description`} // id of the html element
						handleInputChange={props.handleInputChange}
						handleNewValue={props.handleNewValue}
						value={props.item.description}
					/>
				</div>
			}
		</Col>
	);
};

export default Item;
