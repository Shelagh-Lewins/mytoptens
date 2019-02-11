// Page to display list of lists

import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { Container, Row, Col, Label, Input } from 'reactstrap';
import ListsList from '../components/ListsList';
import ListSummary from '../components/ListSummary';
import './ListsPage.scss';

class ListsPage extends Component {
	constructor(props) {
		super(props);

		// which set of lists to view
		// if logged in, default my-lists
		// if not logged in, only show public-lists
		let listset = 'public-lists';
		if (props.auth.isAuthenticated) {
			const urlParams = new URLSearchParams(this.props.location.search);
			listset = urlParams.get('listset') || 'my-lists';
		}

		this.setListSetURL(listset);

		this.state = {
			'selectedTab': listset,
			'topLevelListsOnly': true,
		};
	}

	componentDidUpdate(prevProps) {
		// user has just logged out
		if (prevProps.auth.isAuthenticated && !this.props.auth.isAuthenticated) {
			this.setState({
				'selectedTab': 'public-lists',
			});

			this.setListSetURL('public-lists');
		}
	}

	onSearch = e => {
		this.props.onSearch(e.target.value);
	}

	onAddList = () => {
		this.props.history.push('/newlist');
	}

	getListsToShow = (listsList) => {
		let ListsToShow = [];

		// filter out lists that are not top level
		if (this.state.topLevelListsOnly) {
			listsList.map(list => {
				if (!list.parent_item) {
					ListsToShow.push(list);
				}
			});

			return ListsToShow;
		}

		return listsList;
	}

	renderPublicLists() {
		const { publicLists, onIsPublicChange, onDeleteList } = this.props;

		const listsToShow = this.getListsToShow(publicLists);

		return (
			<ListsList headerText="All public lists">
				{listsToShow.map(list => 
					<ListSummary
						key={list.id}
						list={list}
						onIsPublicChange={onIsPublicChange}
						onDeleteList={onDeleteList}
						showCreatedBy={true}
					/>
				)}
			</ListsList>
		);
	}

	renderMyLists() {
		const { myLists, onIsPublicChange, onDeleteList } = this.props;

		return Object.keys(myLists).map((is_public, index) => {
			const listsByIsPublic = myLists[is_public];
			let headerText = is_public === 'true' ? 'My public lists' : 'My private lists';

			const listsToShow = this.getListsToShow(listsByIsPublic);

			return (
				<div key={index}>
					{(listsToShow.length > 0) && (
						<ListsList is_public={is_public} headerText={headerText}>
							{listsToShow.map(list => 
								<ListSummary
									key={list.id}
									list={list}
									onIsPublicChange={onIsPublicChange}
									onDeleteList={onDeleteList}
								/>
							)}
						</ListsList>
					)}
				</div>
			);
		});
	}

	setListSetURL(listset) {
		let URL = `${this.props.location.pathname}?listset=${listset}`;
		this.props.history.push(URL);
	}

	handleTopLevelListsChange() {
		this.setState({
			'topLevelListsOnly': !this.state.topLevelListsOnly,
		});
	}

	handleTabClick = (e) => {
		if (this.state.selectedTab !== e.target.id) {
			this.setState({
				'selectedTab': e.target.id,
			});

			this.setListSetURL(e.target.id);
		}
	}

	renderTabs() {
		return (
			<ul><li>
				<span
					className={this.state.selectedTab === 'my-lists'? 'selected' : ''}
					id='my-lists'
					onClick={this.handleTabClick}>My lists
				</span>
				<span
					className={this.state.selectedTab === 'public-lists'? 'selected' : ''}
					id='public-lists'
					onClick={this.handleTabClick}>Public lists
				</span>
			</li></ul>
		);
	}

	render() {
		let listsList;

		if (this.state.selectedTab === 'my-lists') {
			listsList = this.renderMyLists();
		} else if (this.state.selectedTab === 'public-lists') {
			listsList = this.renderPublicLists();
		}

		if (this.props.isLoading) {
			return (
				<div className="lists-loading">
					Loading...
				</div>
			);
		}

		let createList;
		if (this.props.canCreateList()) {
			createList = (<button
				className="btn btn-primary create-list"
				onClick={this.onAddList}
			>+ New list</button>);
		} else if (this.props.auth.isAuthenticated) {
			createList = (<div>In order to create new lists, please verify your email address by clicking the link in the email you were sent when you registered. You can request a new verification email from your <Link to="/account">Account</Link> page.</div>);
		} else {
			createList = (<div>In order to create new lists, please <Link to="/login">log in</Link> or <Link to="/register">register a My Top Tens account</Link>.</div>);
		}


		return (
			<div className="lists-list">
				<Container>
					<Row>
						<Col  className="top-level-lists-control">
							<Label check>
								<Input
									type="checkbox"
									defaultChecked={this.state.topLevelListsOnly}
									onChange={this.handleTopLevelListsChange.bind(this)}/>{' '}
								Show top level lists only
							</Label>
						</Col>
					</Row>
					<Row>
						<Col sm="12" md="9">
							<div className="search">
								<Input className="form-control"
									onChange={this.onSearch}
									type="text"
									placeholder="Search..."
								/>
							</div>
						</Col>
					</Row>
					<Row>
						<Col>
							{createList}
						</Col>
					</Row>
				</Container>
				{this.props.auth.isAuthenticated && <div className="tabs">
					{this.renderTabs()}
					<div className="clearing"></div>
				</div>}
				<div className="lists">
					{listsList}
				</div>
			</div>
		);
	}
}

export default withRouter(ListsPage);
