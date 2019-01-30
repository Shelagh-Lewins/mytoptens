import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';

import FlashMessage from '../components/FlashMessage';
import EditableTextField from '../components/EditableTextField.js';
import ItemsPage from '../components/ItemsPage';

import * as lists from '../modules/lists';
import * as permissions from '../modules/permissions';
import formatErrorMessages from '../modules/formatErrorMessages';import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';
import { sortedItems } from '../modules/items';

import './ListDetails.scss';


class ListDetails extends Component {
	constructor(props) {
		super();

		// to start with all we know is the slug. We have to find the list id, and then the list details and items can be loaded
		const slug = props.match.params.slug;

		this.state = {
			// find the list slug from the url
			slug,
		};

		props.dispatch(lists.fetchListBySlug(slug));
	}

	handleInputChange = (e) => {
		this.setState({
			[e.target.dataset.state]: e.target.value
		});
	}

	handleNewValue = (element) => {
		const listId = element.dataset.entityid;

		// the list field to update is coded in the 'state' data e.g. 'list_name'
		// we want to keep item name and list name clearly separate
		const identifiers = element.dataset.state.split('_');
		const propertyName = identifiers[1];
		const value = element.value;

		this.props.dispatch(lists.updateList(listId, propertyName, value));
	}

	onCloseFlashMessage = () => {
		this.props.dispatch(clearErrors());
	}

	componentDidUpdate(prevProps) {
		if (prevProps.isLoading && !this.props.isLoading) {
			// just finished loading; need to check if user should view this list
			this.setState({
				'canView': permissions.canViewList({ 'slug': this.state.slug }),
				'canEdit': permissions.canEditList({ 'slug': this.state.slug }),
				'list_name': this.props.list.name,
				'list_description': this.props.list.description,
			});
		}
	}

	renderItemsPage() {
		return <div>
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
			{this.props.list && (
				<div>
					<Container>
						<Row>
							<Col className="list-name">
								<EditableTextField
									canEdit={this.state.canEdit}
									required={true}
									name={'list_name'}
									placeholder="Click here to add a name for the list"
									label="Item name"
									data-state={'list_name'} // this.state property
									data-entityid={this.props.list.id} // database id of the item
									id='list_name' // id of the html element
									handleInputChange={this.handleInputChange}
									handleNewValue={this.handleNewValue}
									value={this.state.list_name}
								/>
							</Col>
						</Row>
						<Row>
							<Col className="list-description">
								<EditableTextField
									canEdit={this.state.canEdit}
									name={'list_description'}
									placeholder="Click here to add a description for the list"
									label="Item description"
									data-state={'list_description'} // this.state property
									data-entityid={this.props.list.id} // database id of the item
									id='list_description' // id of the html element
									handleInputChange={this.handleInputChange}
									handleNewValue={this.handleNewValue}
									value={this.state.list_description}
								/>
							</Col>
						</Row>
					</Container>
					<Container>
						{this.props.items && (
							<ItemsPage
								items={this.props.items}
								list={this.props.list.id}
								canEdit={this.state.canEdit}
							/>
						)}
					</Container>
				</div>
			)}
		</div>;
	}

	///////////////

	render() {
		let content;

		if (this.state.canView) {
			content = this.renderItemsPage();
		} else {
			content = <p>Either this list does not exist or you do not have permission to view it</p>;
		}
		return(
			<div>
				{ content }
			</div>
		);
	}
}

ListDetails.propTypes = {
	'auth': PropTypes.object.isRequired,
	'errors': PropTypes.object.isRequired,
	'isLoading': PropTypes.bool.isRequired,
	'lists': PropTypes.object.isRequired,
	'items': PropTypes.array.isRequired,
};

const mapStateToProps = (state, ownProps) => {
	const lists = state.lists.things;
	const list = lists[Object.keys(lists)[0]];

	return ({
		'auth': state.auth,
		'errors': state.errors,
		'isLoading': state.lists.isLoading,
		'lists': lists,
		'list': list,
		'items': sortedItems(state),
	});
};

export default connect(mapStateToProps)(withRouter(ListDetails));
