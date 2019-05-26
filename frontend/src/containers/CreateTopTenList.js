import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withRouter, Link } from 'react-router-dom';
import { createTopTenList } from '../modules/topTenList';
import { Container, Row, Col, Label, Input } from 'reactstrap';

import FlashMessage from '../components/FlashMessage';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';
import * as permissions from '../modules/permissions';

import ValidatedForm from '../components/ValidatedForm.js';
import { MAX_TOPTENITEMS_IN_TOPTENLIST, COLORS } from '../constants';

import './CreateTopTenList.scss';

import * as reusableItemReducer from '../modules/reusableItem';
import Combobox from 'react-widgets/lib/Combobox';
import 'react-widgets/dist/css/react-widgets.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


class CreateTopTenList extends Component {
	constructor(props) {
		super(props);

		this.state = {
			'name': '',
			'description': '',
			'activeItemNameId': '',
		};
		for (let i=1; i<=MAX_TOPTENITEMS_IN_TOPTENLIST; i++) {
			this.state[`topTenItem${i}_name`] = '';
			this.state[`topTenItem${i}_description`] = '';
		}
		this.handleInputChange = this.handleInputChange.bind(this);
		this.onSelectItemName = this.onSelectItemName.bind(this);
		this.onChangeItemName = this.onChangeItemName.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.cancel = this.cancel.bind(this);

		props.dispatch(clearErrors());

		if (props.auth.isAuthenticated) {
			const urlParams = new URLSearchParams(props.location.search);
			this.state.parentTopTenItemId = urlParams.get('parent-topTenItem-id');
			this.state.parentTopTenItemName = urlParams.get('parent-topTenItem-name');
			this.state.parentTopTenListName = urlParams.get('parent-topTenList-name');
			this.state.parentTopTenListId = urlParams.get('parent-topTenList-id');
		}

		// use parent item name as default list name
		if (this.state.parentTopTenItemName) {
			this.state.name = this.state.parentTopTenItemName;
		}
	}

	handleInputChange(e) {
		this.setState({
			[e.target.name]: e.target.value
		});
	}

	// user types in an item name combobox.
	onChangeItemName(e, widgetId) {
		console.log('onChangeItemName ', e, widgetId);
		console.log('event type ', typeof e);
		this.setState({
			'activeItemNameId': widgetId,
		});
		clearTimeout(this.itemNameTimeout);
		this.itemNameTimeout = setTimeout(() => {
			if (typeof e === 'string') {
				// the combobox change function fires when an item is selected from the dropdown
				// and the passed event is the selected item - an object - not the entered text
				// so, only update the search string if the user has typed text
				// not if they have made a selection
				//console.log('suggest for ', e);

				// the dropdown list will be rebuilt.
				// We need to remove the selection from state to avoid confusion.
				// value must be selected from list.
				this.setState({
					[`${widgetId}`]: e, // use the entered text directly if the user hasn't made a selection
					[`${widgetId}_reusableItemId`]: undefined,
				});

				this.props.dispatch(reusableItemReducer.suggestReusableItems(e));
			}
		}, 300);
	}

	// user selects an item name from a dropdown list. This will be to either use or create a ReusableItem
	onSelectItemName(e, widgetId) {
		console.log('onSelectItemName', e);
		console.log('onSelectItemName typeof', typeof e);
		//console.log('selected item ', e.name, e.id);
		this.setState({
			[`${widgetId}`]: e.name,
		});

		switch (e.type) {
			case 'reusableItem':
				this.setState({
					[`${widgetId}_reusableItemId`]: e.id,
					[`${widgetId}_topTenItemId`]: undefined,
				});
				break;

			case 'topTenItem':
				this.setState({
					[`${widgetId}_reusableItemId`]: undefined,
					[`${widgetId}_topTenItemId`]: e.id,
				});
				break;

			default:
				this.setState({
					[`${widgetId}_reusableItemId`]: undefined,
					[`${widgetId}_topTenItemId`]: undefined,
				});
		}
	}

	cancel(e) {
		this.props.history.push('/');
	}

	handleSubmit(e) {
		e.preventDefault();

		let newTopTenList = {
			'name': this.state.name,
			'description': this.state.description,
			'topTenItem': [],
		};
		
		for (let i=1; i<=MAX_TOPTENITEMS_IN_TOPTENLIST; i++) {
			if (this.state[`topTenItem${i}`] !== '') {
				const newTopTenItem = {
					'name': this.state[`topTenItem${i}_name`],
					'description': this.state[`topTenItem${i}_description`],
					'reusableItem_id': this.state[`topTenItem${i}_name_reusableItemId`],
					'topTenItem_id': this.state[`topTenItem${i}_name_topTenItemId`],
					'definition': this.state[`topTenItem${i}_name_definition`],
					'link': this.state[`topTenItem${i}_name_link`],
					'order': i,
				};
				newTopTenList.topTenItem.push(newTopTenItem);
			}
		}

		if (this.state.parentTopTenItemId) {
			newTopTenList.parent_topTenItem = this.state.parentTopTenItemId;
		}

		this.onCreateTopTenList(newTopTenList);
	}

	onCreateTopTenList = (newTopTenList) => {
		//console.log('new list data', newTopTenList);
		this.props.dispatch(createTopTenList(newTopTenList, this.props.history));
	}

	componentDidUpdate(prevProps){
		// If the user cannot create a topTenList, redirect to Home
		if(!permissions.canCreateTopTenList() && !this.props.auth.isLoading){
			this.props.history.push('/');
		}
	}

	onCloseFlashMessage = () => {
		this.props.dispatch(clearErrors());
	}

	renderTopTenItemInputs() {
		const elements = [];

		const GroupHeading = ({ item }) => {
			switch(item) {
				case 'text':
					return <span>Use this text:</span>;

				case 'reusableItem':
					return <span>Reusable Items:</span>;


				case 'topTenItem':
					return <span>Top Ten Items:</span>;

				default:
					return null;
			}
		};

		const that = this;

		let ComboboxItem = ({ item }) => {
			let icon;
			let color;

			switch(item.type) {
				case 'text':
					icon = 'pencil-alt';
					color = COLORS.USETEXT;
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
		    {item.name}
		  </span>);
		};

		for (let i=1; i<=MAX_TOPTENITEMS_IN_TOPTENLIST; i++) {
			const widgetId = `topTenItem${i}_name`;

			// has the user selected an existing topTenItem?
			const topTenItemId = this.state[`topTenItem${i}_name_topTenItemId`];

			let topTenItem;
			if (topTenItemId) {
				topTenItem = this.props.reusableItemSuggestions.find(item => item.id === topTenItemId);
			}

			// has the user selected an existing reusableItem?
			const reusableItemId = this.state[`topTenItem${i}_name_reusableItemId`];

			let reusableItem;
			if (reusableItemId) {
				reusableItem = this.props.reusableItemSuggestions.find(item => item.id === reusableItemId);
			}

			elements.push(
				<div className="form-group" key={`topTenItem${i}`}>
					<Row>
						<Col lg="9" className="toptenitem-name">
							<Label for={`topTenItem${i}_name`}>Top Ten item {i}</Label>
							<Combobox
								name={widgetId}
								id={widgetId}
								data={widgetId === this.state.activeItemNameId ? this.props.reusableItemSuggestions : []}
								minLength={2}
      					filter='contains'
      					groupComponent={GroupHeading}
      					groupBy={item => item.type}
								valueField='id'
    						textField='name'
    						itemComponent={ComboboxItem}
								placeholder="Enter the Top Ten item name"
								onChange={(param) => this.onChangeItemName(param, widgetId)}
								onSelect={(param) => this.onSelectItemName(param, widgetId)}
								required={true}
							/>
							<div className='invalid-feedback' />
						</Col>
					</Row>

					{topTenItem && (
						<Row>
							<Col className="reusable-item">
								<div>
									<h3><span className="icon" title="New reusable item"><FontAwesomeIcon icon={['fas', 'sticky-note']} style={{ 'color': COLORS.TOPTENITEM }} size="1x" /></span>{topTenItem.name}</h3>
									<p>A new Reusable Item will be created with this name</p>
									<Label for={`topTenItem${i}_name_definition`}>Definition</Label>
									<Input
										type="text"
										name={`topTenItem${i}_name_definition`}
										id={`topTenItem${i}_name_definition`}
										onChange={ this.handleInputChange }
										value={ this.state[`topTenItem${i}_name_definition`] }
										placeholder="Enter a brief definition of the Reusable Item"
									/>
									<div className='invalid-feedback' />
									<Label for={`topTenItem${i}_name_link`}>Weblink</Label>
									<Input
										type="text"
										name={`topTenItem${i}_name_link`}
										id={`topTenItem${i}_name_link`}
										onChange={ this.handleInputChange }
										value={ this.state[`topTenItem${i}_name_link`] }
										placeholder="Enter a weblink that defines the Reusable Item"
									/>
									<div className='invalid-feedback' />
									<p className="hint">Reusable items are public and can be seen by anybody. However your list will be private unless you make it public</p>
								</div>
							</Col>
						</Row>
					)}

					{reusableItem && (
						<Row>
							<Col className="reusable-item">
								<div>
									<h3><span className="icon" title="Reusable item"><FontAwesomeIcon icon={['fas', 'clone']} style={{ 'color': COLORS.REUSABLEITEM }} size="1x" /></span>{reusableItem.name}</h3>
									<p>{reusableItem.definition}</p>
									<p>{reusableItem.link}</p>
								</div>
							</Col>
						</Row>
					)}
					<Row>
						<Col lg="9" className="toptenitem-description">
							<Label for={`topTenItem${i}_description`}>Top Ten item {i} description</Label>
							<Input
								type="textarea"
								name={`topTenItem${i}_description`}
								id={`topTenItem${i}_description`}
								onChange={ this.handleInputChange }
								value={ this.state[`topTenItem${i}_description`] }
								placeholder="Enter the description"
							/>
							<div className='invalid-feedback' />
						</Col>
					</Row>
				</div>);
		}
		return elements;
	}

	render() {
		return (
			<Container className="create-toptenlist">
				{!isEmpty(this.props.errors) && (<Container>
					<Row>
						<Col>
							<FlashMessage
								message={formatErrorMessages(this.props.errors)}
								type="error"
								onClick={this.onCloseFlashMessage}
							/>
						</Col>
					</Row>
				</Container>)}
				<h2>Create a new Top Ten list</h2>
				{this.state.parentTopTenItemName && (
					<div className="parent-topTenItem"><Link to={`/topTenList/${this.state.parentTopTenListId}`}>{this.state.parentTopTenListName}</Link> > {this.state.parentTopTenItemName}</div>
				)}
				<ValidatedForm onSubmit={ this.handleSubmit }>
					<div className="form-group">
						<Row>
							<Col lg="9" className="toptenlist-name">
								<Label for="name">Top Ten List name</Label>
								<Input
									type="text"
									name="name"
									required={true}
									id="name"
									onChange={ this.handleInputChange }
									value={ this.state.name }
									placeholder="Enter the topTenList name"
								/>
								<div className='invalid-feedback' />
								<small className='form-text text-muted'>
									<p>Name is required</p>
								</small>
							</Col>
						</Row>
					</div>
					<div className="form-group">
						<Row>
							<Col lg="9" className="toptenlist-description">
								<Label for="username">Description</Label>
								<Input
									type="textarea"
									name="description"
									id="description"
									onChange={ this.handleInputChange }
									value={ this.state.description }
									placeholder="Enter the topTenList description"
								/>
								<div className='invalid-feedback' />
							</Col>
						</Row>
					</div>
					{this.renderTopTenItemInputs()}
					<Row>
						<Col lg="9">
							<button type="button" className="btn btn-secondary"onClick={this.cancel}>
								Cancel
							</button>
							<button type="submit" className="btn btn-primary">
								Save list
							</button>
						</Col>
					</Row>
	        <Row>
						<Col lg="9">
							{this.props.errors.topTenLists && <div className="invalid-feedback " style={{ 'display': 'block' }}>{this.props.errors.topTenLists}</div>}
						</Col>
					</Row>
	      </ValidatedForm>
			</Container>
		);
	}
}

CreateTopTenList.propTypes = {
	'auth': PropTypes.object.isRequired,
	'errors': PropTypes.object.isRequired
};

const mapStateToProps = state => ({
	'auth': state.auth,
	'errors': state.errors,
	'reusableItemSuggestions': reusableItemReducer.getReusableItemList(state),
});

export default connect(mapStateToProps)(withRouter(CreateTopTenList));
