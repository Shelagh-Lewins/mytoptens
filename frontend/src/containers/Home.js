// Home.js

import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Container, Row, Col } from 'reactstrap';
import { connect } from 'react-redux';
import * as listReducer from '../modules/list';
import * as pageReducer from '../modules/page';
import { getPublicLists, getMyGroupedLists } from '../modules/list';

import FlashMessage from '../components/FlashMessage';
import Loading from '../components/Loading';
import ListsPage from '../components/ListsPage';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';
import * as permissions from '../modules/permissions';
import { PAGE_SIZE } from '../constants';

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
			'currentPage': 1,
		};

		this.onChangePage = this.onChangePage.bind(this);
		this.handleTopLevelListsChange = this.handleTopLevelListsChange.bind(this);
		this.handleTabClick = this.handleTabClick.bind(this);
	}

	componentDidMount() {
		this.fetchLists({});
	}

	componentDidUpdate(prevProps){
		// If the user's status has changed, refresh Lists
		if(prevProps.auth.user.token !== this.props.auth.user.token){
			this.fetchLists({});
		}

		// user has just logged out
		if (prevProps.auth.isAuthenticated && !this.props.auth.isAuthenticated) {
			this.setState({
				'selectedTab': 'public-lists',
			});

			this.setListSetURL('public-lists');
		}
	}

	// refresh lists based on user choices
	fetchLists({ listset = this.state.listset, topLevelListsOnly = this.state.topLevelListsOnly, currentPage = this.state.currentPage }) {
		// use state values by default
		// however these may be passed in by functions that set state because setState is not synchronous
		this.props.dispatch(listReducer.fetchLists({
			listset,
			topLevelListsOnly,
			'limit': PAGE_SIZE,
			'offset': (currentPage - 1) * PAGE_SIZE,
		}));
	}

	onChangePage(currentPage) {
		// update state with new page of items
		this.setState({ 'currentPage': currentPage });

		if (currentPage !== this.state.currentPage) {
			this.fetchLists({ currentPage });
		}
	}

	onSearch = searchTerm => {
		// wait until the user pauses in typing before searching
		clearTimeout(this.searchTimeout);
		this.searchTimeout = setTimeout(() => {
			this.props.dispatch(pageReducer.searchHome(searchTerm));
		}, 500);
	}

	onChangeIsPublic = ({ id, is_public }) => {
		this.props.dispatch(listReducer.setListIsPublic({ id, is_public }));
	}

	onDeleteList = ({ id, name }) => {
		if (confirm(`Are you sure you want to delete the list ${name}`)) // eslint-disable-line no-restricted-globals
		{
			this.props.dispatch(listReducer.deleteList(id));
		}
	}

	handleTopLevelListsChange() {
		const topLevelListsOnly = !this.state.topLevelListsOnly;
		this.setState({
			'topLevelListsOnly': topLevelListsOnly,
		});

		this.fetchLists({ topLevelListsOnly });
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
			this.fetchLists({ 'listset': selectedTab });
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
					onCreateList={this.onCreateList}
					onChangeIsPublic={this.onChangeIsPublic}
					onDeleteList={this.onDeleteList}
					isLoading={this.props.isLoading}
					topLevelListsOnly={this.state.topLevelListsOnly}
					handleTopLevelListsChange={this.handleTopLevelListsChange}
					handleTabClick={this.handleTabClick}
					selectedTab={this.state.selectedTab}
					count={this.props.count}
					pageSize={PAGE_SIZE}
					currentPage={this.state.currentPage}
					onChangePage={this.onChangePage}
					//searchTerm={this.props.searchTerm}
					//searchComplete={this.props.searchComplete}
					//searchResults={this.props.searchResults}
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
	'count': PropTypes.number, // data may not yet be loaded
	'next': PropTypes.string, // there may be no 'next' page
	'previous': PropTypes.string, // there may be no 'previous' page
	//'searchTerm': PropTypes.string.isRequired,
	//'searchComplete': PropTypes.bool.isRequired,
	//'searchResults': PropTypes.array.isRequired,
};

const mapStateToProps = (state) => ({
	'auth': state.auth,
	'errors': state.errors,
	'isLoading': state.list.isLoading,
	'publicLists': getPublicLists(state),
	'myLists': getMyGroupedLists(state),
	'count': state.list.count,
	'next': state.list.next,
	'previous': state.list.previous,
	//'searchTerm': state.page.searchTerm,
	//'searchComplete': state.page.searchComplete,
	//'searchResults': state.page.searchResults,
});

export default connect(mapStateToProps)(withRouter(Home));
