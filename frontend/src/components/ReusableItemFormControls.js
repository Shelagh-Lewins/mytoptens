import React from 'react';
import { COLORS } from '../constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Row, Col, Label, Input } from 'reactstrap';

// use when creating or editing a topTenItem, to create or edit a reusableItem

function ReusableItemFormControls(props) {
	let reusableItemDetail;
	let showReusableItemDetail = false;

	const definitionLabel = 'Definition';
	const linkLabel = 'Weblink';
	const definitionPlaceholder = 'Enter a brief definition of the Reusable Item';
	const linkPlaceholder = 'Enter a weblink that defines the Reusable Item';
	const reusableItemHint = 'Reusable items are public and can be seen by anybody. Note: your list will be private unless you make it public.';
	// console.log('props', props);
	if (props.newReusableItem) {
		reusableItemDetail = (<div>
			<h3><span className="icon" title="New reusable item"><FontAwesomeIcon icon={['fas', 'plus']} style={{ 'color': COLORS.REUSABLEITEM }} size="1x" /></span>{props.newReusableItem.name}</h3>
			<p>Create a new Reusable Item</p>
			<Label for={`${props.identifier}_definition`}>{definitionLabel}</Label>
			<Input
				type="text"
				name={`${props.identifier}_definition`}
				id={`${props.identifier}_definition`}
				onChange={props.onChange}
				value={props.definition}
				placeholder={definitionPlaceholder}
			/>
			<div className='invalid-feedback' />
			<Label for={`${props.identifier}_link`}>{linkLabel}</Label>
			<Input
				type="text"
				name={`${props.identifier}_link`}
				id={`${props.identifier}_link`}
				onChange={props.onChange}
				value={props.link}
				placeholder={linkPlaceholder}
			/>
			<div className='invalid-feedback' />
			<p className="hint">{reusableItemHint}</p>
		</div>);
		showReusableItemDetail = true;
	} else if (props.reusableItem) {
		reusableItemDetail = (<div>
			<h3><span className="icon" title="Reusable item"><FontAwesomeIcon icon={['fas', 'clone']} style={{ 'color': COLORS.REUSABLEITEM }} size="1x" /></span>{props.reusableItem.name}</h3>
			{props.reusableItem.definition && <p>{props.reusableItem.definition}</p>}
			{props.reusableItem.link && <p>{props.reusableItem.link}</p>}
		</div>);
		showReusableItemDetail = true;
	} else if (props.topTenItem) {
		reusableItemDetail = (
			<div>
				<h3><span className="icon" title="New reusable item"><FontAwesomeIcon icon={['fas', 'sticky-note']} style={{ 'color': COLORS.TOPTENITEM }} size="1x" /></span>{props.topTenItem.name}</h3>
				<p>Create a Reusable Item from an existing Top Ten Item</p>
				<Label for={`${props.identifier}_definition`}>{definitionLabel}</Label>
				<Input
					type="text"
					name={`${props.identifier}_definition`}
					id={`${props.identifier}_definition`}
					onChange={props.onChange}
					value={props.definition}
					placeholder={definitionPlaceholder}
				/>
				<div className='invalid-feedback' />
				<Label for={`${props.identifier}_link`}>{linkLabel}</Label>
				<Input
					type="text"
					name={`${props.identifier}_link`}
					id={`${props.identifier}_link`}
					onChange={props.onChange}
					value={props.link}
					placeholder={linkPlaceholder}
				/>
				<div className='invalid-feedback' />
				<p className="hint">{reusableItemHint}</p>
			</div>
		);
		showReusableItemDetail = true;
	}
	return (showReusableItemDetail && (
		<Row>
			<Col lg="9" className="reusable-item">
				{reusableItemDetail}
			</Col>
		</Row>
	));
}

export default ReusableItemFormControls;
