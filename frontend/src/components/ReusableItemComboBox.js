import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Row, Col, Label } from 'reactstrap';

import Combobox from 'react-widgets/lib/Combobox';
import 'react-widgets/dist/css/react-widgets.css';
import ReusableItemFormControls from './ReusableItemFormControls';
import './ReusableItemComboBox.scss';
import { COLORS } from '../constants';

// use when creating or editing a topTenItem, to create or edit a reusableItem

function ReusableItemComboBox(props) {
	// heading text for the combobox
	const GroupHeading = ({ item }) => {
		switch (item) {
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

	const ComboboxItem = ({ item }) => {
		let icon;
		let color;

		switch (item.type) {
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
		return (
			<span className="combobox-dropdown">
				<span className="icon"><FontAwesomeIcon icon={['fas', icon]} style={{ 'color': color }} size="1x" /></span>
				<span className="name">{item.name}</span>
				{item.definition && (<span className="definition">{item.definition}</span>)}
			</span>
		);
	};

	const { widgetId, labelText, data, defaultValue, inputProps } = props;

	return (
		<Row>
			<Col lg="9" className="toptenitem-name">
				<Label for={widgetId}>{labelText}</Label>
				<Combobox
					name={widgetId}
					id={widgetId}
					data={data}
					defaultValue={defaultValue}
					minLength={2}
					filter="contains"
					groupComponent={GroupHeading}
					groupBy={item => item.type}
					valueField="id"
					textField="name"
					itemComponent={ComboboxItem}
					placeholder="Enter the Top Ten item name"
					onChange={param => props.onChange(param, widgetId)}
					onSelect={param => props.onSelect(param, widgetId)}
					inputProps={inputProps}
					autoFocus
				/>
				<div className="invalid-feedback" />

				<ReusableItemFormControls
					newReusableItem={props.newReusableItem}
					reusableItem={props.reusableItem}
					topTenItem={props.topTenItem}
					identifier={props.widgetId}
					onChange={props.onDetailsChange}
					data-entityid={props.inputProps ? props.inputProps['data-entityid'] : undefined}
				/>
			</Col>
		</Row>
	);
}

export default ReusableItemComboBox;
