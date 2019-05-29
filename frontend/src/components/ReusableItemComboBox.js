import React from 'react';
import { COLORS } from '../constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Row, Col, Label } from 'reactstrap';

import Combobox from 'react-widgets/lib/Combobox';
import 'react-widgets/dist/css/react-widgets.css';
import ReusableItemFormControls from '../components/ReusableItemFormControls';
import './ReusableItemComboBox.scss';

// use when creating or editing a topTenItem, to create or edit a reusableItem

function ReusableItemComboBox(props) {
	// heading text for the combobox
	const GroupHeading = ({ item }) => {
		switch(item) {
			case 'text':
				return <span>Use this text:</span>;

			case 'newReusableItem':
				return <span>Create a new Reusable Item:</span>;

			case 'reusableItem':
				return <span>Reusable Items:</span>;


			case 'topTenItem':
				return <span>Top Ten Items:</span>;

			default:
				return null;
		}
	};

	let ComboboxItem = ({ item }) => {
		let icon;
		let color;

		switch(item.type) {
			case 'text':
				icon = 'pencil-alt';
				color = COLORS.USETEXT;
				break;

			case 'newReusableItem':
				icon = 'plus';
				color = COLORS.REUSABLEITEM;
				break;

			case 'reusableItem':
				icon = 'clone';
				color = COLORS.REUSABLEITEM;
				break;

			case 'topTenItem':
				icon = 'sticky-note';
				color = COLORS.TOPTENITEM;
				break;

			default:
				icon = '';
				break;
		}
		return (<span className="combobox-dropdown"><span className="icon"><FontAwesomeIcon icon={['fas', icon]} style={{ 'color': color }} size="1x" /></span>
	    <span className="name">{item.name}</span>
	    {item.definition && (<span className="definition">{item.definition}</span>)}
	  </span>);
	};

	return (
		<Row>
			<Col lg="9" className="toptenitem-name">
				<Label for={props.widgetId}>{props.labelText}</Label>
				<Combobox
					name={props.widgetId}
					id={props.widgetId}
					data={props.data}
					defaultValue={props.defaultValue}
					minLength={2}
					filter='contains'
					groupComponent={GroupHeading}
					groupBy={item => item.type}
					valueField='id'
					textField='name'
					itemComponent={ComboboxItem}
					placeholder="Enter the Top Ten item name"
					onChange={(param) => props.onChange(param, props.widgetId)}
					onSelect={(param) => props.onSelect(param, props.widgetId)}
				/>
				<div className='invalid-feedback' />

				<ReusableItemFormControls
					newReusableItem={props.newReusableItem}
					reusableItem={props.reusableItem}
					topTenItem={props.topTenItem}
					identifier={props.widgetId}
					onChange={props.onFormControlsChange}
				/>
			</Col>
		</Row>
	);
}

export default ReusableItemComboBox;
