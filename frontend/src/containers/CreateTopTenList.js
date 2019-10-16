import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withRouter, Link } from 'react-router-dom';
import { Container, Row, Col, Label, Input } from 'reactstrap';
import { createTopTenList } from '../modules/topTenList';

import FlashMessage from '../components/FlashMessage';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';
import * as permissions from '../modules/permissions';

import ValidatedForm from '../components/ValidatedForm';
import { MAX_TOPTENITEMS_IN_TOPTENLIST } from '../constants';

import './CreateTopTenList.scss';

import * as reusableItemReducer from '../modules/reusableItem';
import ReusableItemComboBox from '../components/ReusableItemComboBox';

class CreateTopTenList extends Component {
	constructor(props) {
		super(props);

		this.state = {
			'name': '',
			'description': '',
			'activeItemNameId': '',
		};

		for (let i = 1; i <= MAX_TOPTENITEMS_IN_TOPTENLIST; i += 1) {
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

		const { parentTopTenItemName } = this.state;
		// use parent item name as default list name
		if (parentTopTenItemName) {
			this.state.name = parentTopTenItemName;
		}
	}

	componentDidUpdate(prevProps) {
		// If the user cannot create a topTenList, redirect to Home
		const { auth, history } = this.props;
		if (!permissions.canCreateTopTenList() && !auth.isLoading) {
			history.push('/');
		}
	}

	// user types in an item name combobox.
	onChangeItemName(e, widgetId) {
		const { dispatch } = this.props;

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
				// console.log('suggest for ', e);

				// the dropdown list will be rebuilt.
				// We need to remove the selection from state to avoid confusion.
				// value must be selected from list.
				this.setState({
					[`${widgetId}`]: e, // use the entered text directly if the user hasn't made a selection
					[`${widgetId}_reusableItemId`]: undefined,
				});

				dispatch(reusableItemReducer.suggestReusableItems(e, widgetId));
			}
		}, 300);
	}

	// user selects an item name from a dropdown list. This will be to either use or create a ReusableItem
	onSelectItemName(e, widgetId) {
		// console.log('onSelectItemName', e);

		this.setState({
			[`${widgetId}`]: e.name,
		});

		switch (e.type) {
			case 'newReusableItem':
				this.setState({
					[`${widgetId}_newReusableItem`]: true,
					[`${widgetId}_reusableItemId`]: undefined,
					[`${widgetId}_topTenItemId`]: undefined,
				});
				break;

			case 'reusableItem':
				this.setState({
					[`${widgetId}_newReusableItem`]: undefined,
					[`${widgetId}_reusableItemId`]: e.id,
					[`${widgetId}_topTenItemId`]: undefined,
				});
				break;

			case 'topTenItem':
				this.setState({
					[`${widgetId}_newReusableItem`]: undefined,
					[`${widgetId}_reusableItemId`]: undefined,
					[`${widgetId}_topTenItemId`]: e.id,
				});
				break;

			default:
				this.setState({
					[`${widgetId}_newReusableItem`]: undefined,
					[`${widgetId}_reusableItemId`]: undefined,
					[`${widgetId}_topTenItemId`]: undefined,
				});
		}
	}

	onCreateTopTenList = (newTopTenList) => {
		// console.log('new list data', newTopTenList);
		const { dispatch, history } = this.props;

		dispatch(createTopTenList(newTopTenList, history));
	}

	onCloseFlashMessage = () => {
		const { dispatch } = this.props;

		dispatch(clearErrors());
	}

	cancel() {
		const { history } = this.props;

		history.push('/');
	}

	handleInputChange(e) {
		this.setState({
			[e.target.name]: e.target.value,
		});
	}

	handleSubmit(e) {
		e.preventDefault();

		const {
			description,
			name,
			parentTopTenItemId,
		} = this.state;

		const newTopTenList = {
			'name': name,
			'description': description,
			'topTenItem': [],
		};

		for (let i = 1; i <= MAX_TOPTENITEMS_IN_TOPTENLIST; i += 1) {
			if (this.state[`topTenItem${i}`] !== '') {
				const newTopTenItem = {
					'name': this.state[`topTenItem${i}_name`],
					'description': this.state[`topTenItem${i}_description`],
					'newReusableItem': this.state[`topTenItem${i}_name_newReusableItem`],
					'reusableItem_id': this.state[`topTenItem${i}_name_reusableItemId`],
					'topTenItem_id': this.state[`topTenItem${i}_name_topTenItemId`],
					'reusableItemDefinition': this.state[`topTenItem${i}_name_definition`],
					'reusableItemLink': this.state[`topTenItem${i}_name_link`],
					'order': i,
				};
				newTopTenList.topTenItem.push(newTopTenItem);
			}
		}

		if (parentTopTenItemId) {
			newTopTenList.parent_topTenItem = parentTopTenItemId;
		}

		this.onCreateTopTenList(newTopTenList);
	}

	renderTopTenItemInputs() {
		const { reusableItemSuggestions } = this.props;
		const { activeItemNameId } = this.state;

		const elements = [];

		for (let i = 1; i <= MAX_TOPTENITEMS_IN_TOPTENLIST; i += 1) {
			const widgetId = `topTenItem${i}_name`;

			// has the user selected an existing topTenItem?
			const topTenItemId = this.state[`${widgetId}_topTenItemId`];

			let newReusableItem;
			let topTenItem;
			let reusableItem;
			const reusableItemSuggestionsForWidget = reusableItemSuggestions[widgetId];

			// create a new reusableItem based on the name the user typed
			if (this.state[`${widgetId}_newReusableItem`]) {
				newReusableItem = { 'name': this.state[widgetId] };
			} else 	if (topTenItemId) { // create a new reusableItem to share with the selected topTenItem
				topTenItem = reusableItemSuggestionsForWidget.find(item => item.id === topTenItemId);
			} else {
				// use an existing reusableItem
				const reusableItemId = this.state[`${widgetId}_reusableItemId`];

				if (reusableItemId) {
					reusableItem = reusableItemSuggestionsForWidget.find(item => item.id === reusableItemId);
				}
			}

			const data = widgetId === activeItemNameId ? reusableItemSuggestionsForWidget : [];

			elements.push(
				<div className="form-group" key={`topTenItem${i}`}>
					<ReusableItemComboBox
						defaultValue=""
						widgetId={widgetId}
						labelText={`Top Ten item ${i}`}
						data={data}
						onChange={param => this.onChangeItemName(param, widgetId)}
						onSelect={param => this.onSelectItemName(param, widgetId)}
						newReusableItem={newReusableItem}
						reusableItem={reusableItem}
						topTenItem={topTenItem}
						onDetailsChange={this.handleInputChange}
					/>

					<Row>
						<Col lg="9" className="toptenitem-description">
							<Label for={`topTenItem${i}_description`}>Top Ten item {i} description</Label>
							<Input
								type="textarea"
								name={`topTenItem${i}_description`}
								id={`topTenItem${i}_description`}
								onChange={this.handleInputChange}
								value={this.state[`topTenItem${i}_description`]}
								placeholder="Enter the description"
							/>
							<div className="invalid-feedback" />
						</Col>
					</Row>
				</div>,
			);
		}
		return elements;
	}

	render() {
		const { errors } = this.props;
		const {
			description,
			name,
			parentTopTenItemName,
			parentTopTenListId,
			parentTopTenListName,
		} = this.state;

		return (
			<Container className="create-toptenlist">
				{!isEmpty(errors) && (
					<Container>
						<Row>
							<Col>
								<FlashMessage
									message={formatErrorMessages(errors)}
									type="error"
									onClick={this.onCloseFlashMessage}
								/>
							</Col>
						</Row>
					</Container>
				)}
				<h2>Create a new Top Ten list</h2>
				{parentTopTenItemName && (
					<div className="parent-topTenItem"><Link to={`/toptenlist/${parentTopTenListId}`}>{parentTopTenListName}</Link> &gt; {parentTopTenItemName}</div>
				)}
				<ValidatedForm onSubmit={this.handleSubmit}>
					<div className="form-group">
						<Row>
							<Col lg="9" className="toptenlist-name">
								<Label for="name">Top Ten List name</Label>
								<Input
									type="text"
									name="name"
									required={true}
									id="name"
									onChange={this.handleInputChange}
									value={name}
									placeholder="Enter the topTenList name"
								/>
								<div className="invalid-feedback" />
								<small className="form-text text-muted">
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
									onChange={this.handleInputChange}
									value={description}
									placeholder="Enter the topTenList description"
								/>
								<div className="invalid-feedback" />
							</Col>
						</Row>
					</div>
					{this.renderTopTenItemInputs()}
					<Row>
						<Col lg="9">
							<button type="button" className="btn btn-secondary" onClick={this.cancel}>
								Cancel
							</button>
							<button type="submit" className="btn btn-primary">
								Save list
							</button>
						</Col>
					</Row>
					<Row>
						<Col lg="9">
							{errors.topTenLists && <div className="invalid-feedback " style={{ 'display': 'block' }}>{errors.topTenLists}</div>}
						</Col>
					</Row>
				</ValidatedForm>
			</Container>
		);
	}
}

CreateTopTenList.propTypes = {
	'auth': PropTypes.objectOf(PropTypes.any).isRequired,
	'dispatch': PropTypes.func.isRequired,
	'history': PropTypes.objectOf(PropTypes.any).isRequired,
	'location': PropTypes.objectOf(PropTypes.any).isRequired,
	'errors': PropTypes.objectOf(PropTypes.any).isRequired,
	'reusableItemSuggestions': PropTypes.objectOf(PropTypes.any).isRequired,
};

const mapStateToProps = state => ({
	'auth': state.auth,
	'errors': state.errors,
	'reusableItemSuggestions': reusableItemReducer.getReusableItemList(state),
});

export default connect(mapStateToProps)(withRouter(CreateTopTenList));
