// Home.js

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Container, Row, Col } from 'reactstrap';
import { connect } from 'react-redux';
import ListsPage from './ListsPage';

import * as listReducer from '../modules/list';
import { getFilteredPublicLists, getMyGroupedAndFilteredLists } from '../modules/list';

import FlashMessage from '../components/FlashMessage';
import Loading from '../components/Loading';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';
import * as permissions from '../modules/permissions';

class Home extends Component {
	constructor(props) {
		super();
		
		props.dispatch(clearErrors());
	}

	componentDidMount() {
		this.props.dispatch(listReducer.fetchLists());
	}

	componentDidUpdate(prevProps){
		// If the user's status has changed, refresh Lists
		if(prevProps.auth.user.token !== this.props.auth.user.token){
			this.props.dispatch(listReducer.fetchLists());
		}
	}

	onSearch = searchTerm => {
		this.props.dispatch(listReducer.filterLists(searchTerm));
	}

	onIsPublicChange = ({ id, is_public }) => {
		this.props.dispatch(listReducer.setListIsPublic({ id, is_public }));
	}

	onDeleteList = ({ id, name }) => {
		if (confirm(`Are you sure you want to delete the list ${name}`)) // eslint-disable-line no-restricted-globals
		{
		  this.props.dispatch(listReducer.deleteList(id));
		}
	}

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
				{this.props.isLoading && <Loading />}
				<ListsPage
					auth={this.props.auth}
					myLists={this.props.myLists}
					publicLists={this.props.publicLists}
					canCreateList={permissions.canCreateList}
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
	'publicLists': PropTypes.array.isRequired,
	'myLists': PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
	'auth': state.auth,
	'errors': state.errors,
	'isLoading': state.list.isLoading,
	'publicLists': getFilteredPublicLists(state),
	'myLists': getMyGroupedAndFilteredLists(state),
});

export default connect(mapStateToProps)(Home);
