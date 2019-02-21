// Page to display list of lists

import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { Container, Row, Col, Label, Input } from 'reactstrap';
import ListsList from '../components/ListsList';
import ListSummary from '../components/ListSummary';
import './ListsPage.scss';
import Pagination from '../components/Pagination';

class ListsPage extends Component {
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

	renderTabs() {
		return (
			<ul><li>
				<span
					className={this.props.selectedTab === 'my-lists'? 'selected' : ''}
					id='my-lists'
					onClick={this.props.handleTabClick}>My lists
				</span>
				<span
					className={this.props.selectedTab === 'public-lists'? 'selected' : ''}
					id='public-lists'
					onClick={this.props.handleTabClick}>Public lists
				</span>
			</li></ul>
		);
	}

	render() {
		let listsList;

		if (this.props.selectedTab === 'my-lists') {
			listsList = this.renderMyLists();
		} else if (this.props.selectedTab === 'public-lists') {
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
									defaultChecked={this.props.topLevelListsOnly}
									onChange={this.props.handleTopLevelListsChange}/>{' '}
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
				<div className="container">
					<div className="text-center">
						<Pagination
							count={this.props.count}
							pageSize={this.props.pageSize}
							currentPage={this.props.currentPage}
							onChangePage={this.props.onChangePage}
						/>
					</div>
				</div>
			</div>
		);
	}
}

export default withRouter(ListsPage);
