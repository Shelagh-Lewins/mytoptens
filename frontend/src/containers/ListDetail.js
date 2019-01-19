import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { Container, Row, Col, Label, Input } from 'reactstrap';

import * as lists from '../modules/lists';
import * as items from '../modules/items';

import FlashMessage from '../components/FlashMessage';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';
import ItemsPage from './ItemsPage';
import { sortedItems } from '../modules/items';

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

	onCreateItem = (item) => {
		this.props.dispatch(items.createItem(item));
	}

	onDeleteItem = (item) => {
		this.props.dispatch(items.deleteItem(item));
	}

	onCloseFlashMessage = () => {
		this.props.dispatch(clearErrors());
	}

	componentDidUpdate(prevProps){
	}

	///////////////

	render() {
		return(
			<Container>
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
						<h2>{this.props.list.title}</h2>
						<p>Description: {this.props.list.description}</p>
						{this.props.items && (
							<ItemsPage
								items={this.props.items}
								list={this.props.list.id}
								onCreateItem={this.onCreateItem}
								onDeleteItem={this.onDeleteItem}
							/>
						)}
					</div>
				)}
			</Container>
		);
	}
}

ListDetails.propTypes = {
	'auth': PropTypes.object.isRequired,
	'errors': PropTypes.object.isRequired,
	'lists': PropTypes.object.isRequired,
	'items': PropTypes.array.isRequired,
};

const mapStateToProps = (state, ownProps) => {
	const lists = state.lists.things;
	const list = lists[Object.keys(lists)[0]];

	return ({
		'auth': state.auth,
		'errors': state.errors,
		'lists': lists,
		'list': list,
		'items': sortedItems(state),
	});
};

export default connect(mapStateToProps)(withRouter(ListDetails));
