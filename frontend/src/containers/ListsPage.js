// Page to display list of lists

import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';
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

	renderPublicLists() {
		const { publicLists, onIsPublicChange, onDeleteList } = this.props;

		return (
			<ListsList headerText="All public lists">
				{publicLists.map(list => 
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

			return (
				<div key={index}>
					{(listsByIsPublic.length > 0) && (
						<ListsList is_public={is_public} headerText={headerText}>
							{listsByIsPublic.map(list => 
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
				className="btn btn-primary"
				onClick={this.onAddList}
			>+ New list</button>);
		} else {
			createList = (<div>In order to create new lists, please verify your email address by clicking the link in the email you were sent when you registered. You can request a new verification email in your <Link to="/account">Account</Link> page.</div>);
		}


		return (
			<div className="lists-list">
				<Container>
					<Row>
						<Col sm="12" md="9">
							<div className="lists-list-header">
								<input className="form-control"
									onChange={this.onSearch}
									type="text"
									placeholder="Search..."
								/>
								{createList}
							</div>
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
