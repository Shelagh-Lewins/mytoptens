import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Row, Col, Label } from 'reactstrap';
import PropTypes from 'prop-types';

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

	const {
		data,
		defaultValue,
		inputProps,
		labelText,
		newReusableItem,
		onChange,
		onDetailsChange,
		onSelect,
		reusableItem,
		topTenItem,
		widgetId,
	} = props;

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
					onChange={param => onChange(param, widgetId)}
					onSelect={param => onSelect(param, widgetId)}
					inputProps={inputProps}
					autoFocus
				/>
				<div className="invalid-feedback" />

				<ReusableItemFormControls
					newReusableItem={newReusableItem}
					reusableItem={reusableItem}
					topTenItem={topTenItem}
					identifier={widgetId}
					onChange={onDetailsChange}
					data-entityid={inputProps ? inputProps['data-entityid'] : undefined}
				/>
			</Col>
		</Row>
	);
}

ReusableItemComboBox.propTypes = {
	'data': PropTypes.arrayOf(PropTypes.any),
	'defaultValue': PropTypes.string.isRequired,
	'inputProps': PropTypes.objectOf(PropTypes.any).isRequired,
	'labelText': PropTypes.string.isRequired,
	'newReusableItem': PropTypes.objectOf(PropTypes.any),
	'onChange': PropTypes.func.isRequired,
	'onDetailsChange': PropTypes.func.isRequired,
	'onSelect': PropTypes.func.isRequired,
	'reusableItem': PropTypes.objectOf(PropTypes.any),
	'topTenItem': PropTypes.objectOf(PropTypes.any),
	'widgetId': PropTypes.string.isRequired,
};

export default ReusableItemComboBox;
