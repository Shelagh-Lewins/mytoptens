// Home.js

import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Container, Row, Col } from 'reactstrap';
import { connect } from 'react-redux';
import * as topTenListReducer from '../modules/topTenList';
import * as pageReducer from '../modules/page';
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
		// if logged in, default mytoptens
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

	componentDidUpdate(prevProps) {
		const { auth } = this.props;
		// If the user's status has changed, refresh TopTenLists
		if (prevProps.auth.user.token !== auth.user.token) {
			this.fetchTopTenLists({});
		}

		// user has just logged out
		if (prevProps.auth.isAuthenticated && !auth.isAuthenticated) {
			this.setState({
				'selectedTab': 'publictoptens',
			});

			this.setListSetURL('publictoptens');
		}
	}

	onChangePage(newCurrentPage) {
		// update state with new page of topTenLists
		const { currentPage } = this.state;

		if (newCurrentPage !== currentPage) {
			this.setState({ 'currentPage': newCurrentPage });
			this.fetchTopTenLists({ 'currentPage': newCurrentPage });
		}
	}

	onSearch = (searchTerm) => {
		// wait until the user pauses in typing before searching
		clearTimeout(this.searchTimeout);
		const { dispatch } = this.props;

		this.searchTimeout = setTimeout(() => {
			dispatch(pageReducer.searchHome(searchTerm));
		}, 500);
	}

	onChangeIsPublic = ({ id, is_public }) => {
		const { dispatch } = this.props;

		dispatch(topTenListReducer.setTopTenListIsPublic({ id, is_public }));
	}

	onDeleteTopTenList = ({ id, name }) => {
		if (confirm(`Are you sure you want to delete the topTenList ${name}`)) { // eslint-disable-line no-restricted-globals
			const { dispatch } = this.props;

			dispatch(topTenListReducer.deleteTopTenList(id));
		}
	}

	setListSetURL(listset) { // indicate current topTenList set in URL; depends on selected tab
		const { location, history } = this.props;
		const URL = `${location.pathname}?listset=${listset}`;
		history.push(URL);
	}

	handleTabClick = (e) => {
		const selectedTab = e.target.id;
		const { newSelectedTab } = this.state;

		if (newSelectedTab !== selectedTab) {
			this.setState({
				'selectedTab': selectedTab,
			});

			this.setListSetURL(e.target.id);
			this.fetchTopTenLists({ 'listset': selectedTab });
		}
	}

	onCloseFlashMessage = () => {
		const { dispatch } = this.props;

		dispatch(clearErrors());
	}

	handleTopLevelTopTenListsChange() {
		const { topLevelTopTenListsOnly } = this.state;

		this.setState({
			'topLevelTopTenListsOnly': !topLevelTopTenListsOnly,
		});

		// use callback to avoid async issues
		// this.setState(prevState => ({ 'topLevelTopTenListsOnly': !prevState.topLevelTopTenListsOnly }));

		// this.fetchTopTenLists({ 'topLevelTopTenListsOnly': !topLevelTopTenListsOnly });
	}

	// refresh topTenLists based on user choices
	fetchTopTenLists({ listset = this.state.topTenListset, currentPage = this.state.currentPage }) { // eslint-disable-line react/destructuring-assignment
		// use state values by default
		// however these may be passed in by functions that set state because setState is not synchronous

		const { dispatch } = this.props;

		dispatch(topTenListReducer.fetchTopTenLists({
			listset,
			// topLevelTopTenListsOnly,
			'limit': PAGE_SIZE,
			'offset': (currentPage - 1) * PAGE_SIZE,
		}));
	}

	render() {
		const {
			auth,
			count,
			errors,
			isLoading,
			myTopTenLists,
			publicTopTenLists,
			topLevelPublicTopTenLists,
			topLevelmyTopTenLists,
		} = this.props;

		const {
			currentPage,
			selectedTab,
			topLevelTopTenListsOnly,
		} = this.state;
		return (
			<div>
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
				{isLoading && <Loading />}
				<TopTenListsPage
					auth={auth}
					myTopTenLists={topLevelTopTenListsOnly ? topLevelmyTopTenLists : myTopTenLists}
					publicTopTenLists={topLevelTopTenListsOnly ? topLevelPublicTopTenLists : publicTopTenLists}
					canCreateTopTenList={permissions.canCreateTopTenList}
					onCreateTopTenList={this.onCreateTopTenList}
					onChangeIsPublic={this.onChangeIsPublic}
					onDeleteTopTenList={this.onDeleteTopTenList}
					isLoading={isLoading}
					topLevelTopTenListsOnly={topLevelTopTenListsOnly}
					handleTopLevelTopTenListsChange={this.handleTopLevelTopTenListsChange}
					handleTabClick={this.handleTabClick}
					selectedTab={selectedTab}
					count={count}
					pageSize={PAGE_SIZE}
					currentPage={currentPage}
					onChangePage={this.onChangePage}
				/>
			</div>
		);
	}
}

Home.propTypes = {
	'auth': PropTypes.objectOf(PropTypes.any).isRequired,
	'dispatch': PropTypes.func.isRequired,
	'errors': PropTypes.objectOf(PropTypes.any).isRequired,
	'history': PropTypes.objectOf(PropTypes.any).isRequired,
	'isLoading': PropTypes.bool.isRequired,
	'location': PropTypes.objectOf(PropTypes.any).isRequired,
	'publicTopTenLists': PropTypes.arrayOf(PropTypes.any).isRequired,
	'myTopTenLists': PropTypes.objectOf(PropTypes.any).isRequired,
	'topLevelPublicTopTenLists': PropTypes.arrayOf(PropTypes.any).isRequired,
	'topLevelmyTopTenLists': PropTypes.objectOf(PropTypes.any).isRequired,
	'count': PropTypes.number, // data may not yet be loaded
	// 'next': PropTypes.string, // there may be no 'next' page
	// 'previous': PropTypes.string, // there may be no 'previous' page
};

const mapStateToProps = state => ({
	'auth': state.auth,
	'errors': state.errors,
	'isLoading': state.topTenList.isLoading,
	'publicTopTenLists': topTenListReducer.getPublicTopTenLists(state),
	'myTopTenLists': topTenListReducer.getMyGroupedTopTenLists(state),
	'topLevelPublicTopTenLists': topTenListReducer.getTopLevelPublicTopTenLists(state),
	'topLevelmyTopTenLists': topTenListReducer.getTopLevelMyGroupedTopTenLists(state),
	'count': state.topTenList.count,
	'next': state.topTenList.next,
	'previous': state.topTenList.previous,
});

export default connect(mapStateToProps)(withRouter(Home));
