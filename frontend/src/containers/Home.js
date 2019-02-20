// Home.js

import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
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
		super(props);
		
		props.dispatch(clearErrors());

		// which set of lists to view
		// if logged in, default my-lists
		// if not logged in, only show public-lists
		let listset = 'public-lists';
		if (props.auth.isAuthenticated) {
			const urlParams = new URLSearchParams(props.location.search);
			listset = urlParams.get('listset') || 'my-lists';
		}

		this.setListSetURL(listset);

		this.state = {
			'selectedTab': listset,
			'topLevelListsOnly': true,
		};
	}

	componentDidMount() {
		this.props.dispatch(listReducer.fetchLists({ 'topLevelListsOnly': true }));
	}

	componentDidUpdate(prevProps){
		// If the user's status has changed, refresh Lists
		if(prevProps.auth.user.token !== this.props.auth.user.token){
			this.props.dispatch(listReducer.fetchLists());
		}

		// user has just logged out
		if (prevProps.auth.isAuthenticated && !this.props.auth.isAuthenticated) {
			this.setState({
				'selectedTab': 'public-lists',
			});

			this.setListSetURL('public-lists');
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

	// refresh lists based on user choices
	fetchLists({ listset, topLevelListsOnly }) {
		this.props.dispatch(listReducer.fetchLists({ listset, topLevelListsOnly }));
	}

	handleTopLevelListsChange() {
		const topLevelListsOnly = !this.state.topLevelListsOnly;
		this.setState({
			'topLevelListsOnly': topLevelListsOnly,
		});

		this.fetchLists({ 'listset': this.state.selectedTab, topLevelListsOnly });
	}

	setListSetURL(listset) { // indicate current list set in URL; depends on selected tab
		let URL = `${this.props.location.pathname}?listset=${listset}`;
		this.props.history.push(URL);
	}

	handleTabClick = (e) => {
		const selectedTab = e.target.id;

		if (this.state.selectedTab !== selectedTab) {
			this.setState({
				'selectedTab': selectedTab,
			});

			this.setListSetURL(e.target.id);
			this.fetchLists({ 'listset': selectedTab, 'topLevelListsOnly': this.state.topLevelListsOnly });
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
					topLevelListsOnly={this.state.topLevelListsOnly}
					handleTopLevelListsChange={this.handleTopLevelListsChange.bind(this)}
					handleTabClick={this.handleTabClick.bind(this)}
					selectedTab={this.state.selectedTab}
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

export default connect(mapStateToProps)(withRouter(Home));
