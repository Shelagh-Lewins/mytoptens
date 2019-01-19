// Home.js

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Container, Row, Col } from 'reactstrap';
import { connect } from 'react-redux';
import ListsPage from './ListsPage';

import * as lists from '../modules/lists';
import { getGroupedAndFilteredLists } from '../modules/lists';

import FlashMessage from '../components/FlashMessage';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';

class Home extends Component {
	componentDidMount() {
		this.props.dispatch(lists.fetchLists());
	}

	componentDidUpdate(prevProps){
		// If the user's status has changed, refresh Lists
		if(prevProps.auth.user.token !== this.props.auth.user.token){
			this.props.dispatch(lists.fetchLists());
		}
	}

	onSearch = searchTerm => {
		this.props.dispatch(lists.filterLists(searchTerm));
	}

	onCreateList = ({ title, description }) => {
		this.props.dispatch(lists.createList({ title, description }));
	}

	onIsPublicChange = ({ id, is_public }) => {
		this.props.dispatch(lists.setListIsPublic({ id, is_public }));
	}

	onDeleteList = (id) => {
		this.props.dispatch(lists.deleteList(id));
	}
	/*
	onCreateItem = (item) => {
		this.props.dispatch(items.createItem(item));
	}

	onDeleteItem = (item) => {
		this.props.dispatch(items.deleteItem(item));
	} */

	onCloseFlashMessage = () => {
		this.props.dispatch(clearErrors());
	}

	render() {
		return (
			<div>
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
				<ListsPage
					lists={this.props.lists}
					canCreateList={this.props.auth.canCreateList}
					onSearch={this.onSearch}
					onCreateList={this.onCreateList}
					onIsPublicChange={this.onIsPublicChange}
					onDeleteList={this.onDeleteList}
					isLoading={this.props.isLoading}
				/>
			</div>
		);
	}
}

Home.propTypes = {
	'auth': PropTypes.object.isRequired,
	'errors': PropTypes.object.isRequired,
	'isLoading': PropTypes.bool.isRequired,
	'lists': PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
	'auth': state.auth,
	'errors': state.errors,
	'isLoading': state.lists.isLoading,
	'lists': getGroupedAndFilteredLists(state),
});

export default connect(mapStateToProps)(Home);
