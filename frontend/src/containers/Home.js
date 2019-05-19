// Home.js

import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Container, Row, Col } from 'reactstrap';
import { connect } from 'react-redux';
import * as topTenListReducer from '../modules/topTenList';
import * as pageReducer from '../modules/page';
import { getPublicTopTenLists, getMyGroupedTopTenLists } from '../modules/topTenList';

import FlashMessage from '../components/FlashMessage';
import Loading from '../components/Loading';
import TopTenListsPage from '../components/TopTenListsPage';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';
import * as permissions from '../modules/permissions';
import { PAGE_SIZE } from '../constants';

class Home extends Component {
	constructor(props) {
		super(props);

		props.dispatch(clearErrors());

		// which set of topTenLists to view
		// if logged in, default my-topTenLists
		// if not logged in, only show publictoptens
		let listset = 'publictoptens';
		if (props.auth.isAuthenticated) {
			const urlParams = new URLSearchParams(props.location.search);
			listset = urlParams.get('listset') || 'mytoptens';
		}

		this.setListSetURL(listset);

		this.state = {
			'selectedTab': listset,
			'topLevelTopTenListsOnly': true,
			'currentPage': 1,
		};

		this.onChangePage = this.onChangePage.bind(this);
		this.handleTopLevelTopTenListsChange = this.handleTopLevelTopTenListsChange.bind(this);
		this.handleTabClick = this.handleTabClick.bind(this);
	}

	componentDidMount() {
		this.fetchTopTenLists({});
	}

	componentDidUpdate(prevProps){
		// If the user's status has changed, refresh TopTenLists
		if(prevProps.auth.user.token !== this.props.auth.user.token){
			this.fetchTopTenLists({});
		}

		// user has just logged out
		if (prevProps.auth.isAuthenticated && !this.props.auth.isAuthenticated) {
			this.setState({
				'selectedTab': 'publictoptens',
			});

			this.setListSetURL('publictoptens');
		}
	}

	// refresh topTenLists based on user choices
	fetchTopTenLists({ listset = this.state.topTenListset, topLevelTopTenListsOnly = this.state.topLevelTopTenListsOnly, currentPage = this.state.currentPage }) {
		// use state values by default
		// however these may be passed in by functions that set state because setState is not synchronous
		this.props.dispatch(topTenListReducer.fetchTopTenLists({
			listset,
			topLevelTopTenListsOnly,
			'limit': PAGE_SIZE,
			'offset': (currentPage - 1) * PAGE_SIZE,
		}));
	}

	onChangePage(currentPage) {
		// update state with new page of topTenLists
		this.setState({ 'currentPage': currentPage });

		if (currentPage !== this.state.currentPage) {
			this.fetchTopTenLists({ currentPage });
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
		this.props.dispatch(topTenListReducer.setTopTenListIsPublic({ id, is_public }));
	}

	onDeleteTopTenList = ({ id, name }) => {
		if (confirm(`Are you sure you want to delete the topTenList ${name}`)) // eslint-disable-line no-restricted-globals
		{
			this.props.dispatch(topTenListReducer.deleteTopTenList(id));
		}
	}

	handleTopLevelTopTenListsChange() {
		const topLevelTopTenListsOnly = !this.state.topLevelTopTenListsOnly;
		this.setState({
			'topLevelTopTenListsOnly': topLevelTopTenListsOnly,
		});

		this.fetchTopTenLists({ topLevelTopTenListsOnly });
	}

	setListSetURL(listset) { // indicate current topTenList set in URL; depends on selected tab
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
			this.fetchTopTenLists({ 'listset': selectedTab });
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
				<TopTenListsPage
					auth={this.props.auth}
					myTopTenLists={this.props.myTopTenLists}
					publicTopTenLists={this.props.publicTopTenLists}
					canCreateTopTenList={permissions.canCreateTopTenList}
					onCreateTopTenList={this.onCreateTopTenList}
					onChangeIsPublic={this.onChangeIsPublic}
					onDeleteTopTenList={this.onDeleteTopTenList}
					isLoading={this.props.isLoading}
					topLevelTopTenListsOnly={this.state.topLevelTopTenListsOnly}
					handleTopLevelTopTenListsChange={this.handleTopLevelTopTenListsChange}
					handleTabClick={this.handleTabClick}
					selectedTab={this.state.selectedTab}
					count={this.props.count}
					pageSize={PAGE_SIZE}
					currentPage={this.state.currentPage}
					onChangePage={this.onChangePage}
				/>
			</div>
		);
	}
}

Home.propTypes = {
	'auth': PropTypes.object.isRequired,
	'errors': PropTypes.object.isRequired,
	'isLoading': PropTypes.bool.isRequired,
	'publicTopTenLists': PropTypes.array.isRequired,
	'myTopTenLists': PropTypes.object.isRequired,
	'count': PropTypes.number, // data may not yet be loaded
	'next': PropTypes.string, // there may be no 'next' page
	'previous': PropTypes.string, // there may be no 'previous' page
};

const mapStateToProps = (state) => ({
	'auth': state.auth,
	'errors': state.errors,
	'isLoading': state.topTenList.isLoading,
	'publicTopTenLists': getPublicTopTenLists(state),
	'myTopTenLists': getMyGroupedTopTenLists(state),
	'count': state.topTenList.count,
	'next': state.topTenList.next,
	'previous': state.topTenList.previous,
});

export default connect(mapStateToProps)(withRouter(Home));
