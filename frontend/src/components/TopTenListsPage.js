// Page to display list of topTenLists

import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { Container, Row, Col, Label, Input } from 'reactstrap';
import TopTenListsList from '../components/TopTenListsList';
import TopTenListSummary from '../components/TopTenListSummary';
import './TopTenListsPage.scss';
import Pagination from '../components/Pagination';
//import Search from '../components/Search';

class TopTenListsPage extends Component {
	/*onSearch = e => {
		this.props.onSearch(e.target.value);
	} */

	onAddTopTenList = () => {
		this.props.history.push('/newtopTenList');
	}

	renderPublicTopTenLists() {
		const { publicTopTenLists, onChangeIsPublic, onDeleteTopTenList } = this.props;

		return (
			<TopTenListsList headerText="All public Top Ten lists">
				{publicTopTenLists.map(topTenList => 
					<TopTenListSummary
						key={topTenList.id}
						topTenList={topTenList}
						onChangeIsPublic={onChangeIsPublic}
						onDeleteTopTenList={onDeleteTopTenList}
						showCreatedBy={true}
					/>
				)}
			</TopTenListsList>
		);
	}

	renderMyTopTenLists() {
		const { myTopTenLists, onChangeIsPublic, onDeleteTopTenList } = this.props;

		return Object.keys(myTopTenLists).map((is_public, index) => {
			const topTenListsByIsPublic = myTopTenLists[is_public];
			let headerText = is_public === 'true' ? 'My public Top Ten lists' : 'My private Top Ten lists';

			return (
				<div key={index}>
					{(topTenListsByIsPublic.length > 0) && (
						<TopTenListsList is_public={is_public} headerText={headerText}>
							{topTenListsByIsPublic.map(topTenList => 
								<TopTenListSummary
									key={topTenList.id}
									topTenList={topTenList}
									onChangeIsPublic={onChangeIsPublic}
									onDeleteTopTenList={onDeleteTopTenList}
								/>
							)}
						</TopTenListsList>
					)}
				</div>
			);
		});
	}

	renderTabs() {
		return (
			<ul><li>
				<span
					className={this.props.selectedTab === 'mytoptens'? 'selected' : ''}
					id='mytoptens'
					onClick={this.props.handleTabClick}>My Top Ten lists
				</span>
				<span
					className={this.props.selectedTab === 'publictoptens'? 'selected' : ''}
					id='publictoptens'
					onClick={this.props.handleTabClick}>Public Top Ten lists
				</span>
			</li></ul>
		);
	}

	render() {
		let TopTenListsList;

		if (this.props.selectedTab === 'mytoptens') {
			TopTenListsList = this.renderMyTopTenLists();
		} else if (this.props.selectedTab === 'publictoptens') {
			TopTenListsList = this.renderPublicTopTenLists();
		}

		if (this.props.isLoading) {
			return (
				<div className="topTenLists-loading">
					Loading...
				</div>
			);
		}

		let createTopTenList;
		if (this.props.canCreateTopTenList()) {
			createTopTenList = (<button
				className="btn btn-primary create-toptenlist"
				onClick={this.onAddTopTenList}
			>+ New Top Ten list</button>);
		} else if (this.props.auth.isAuthenticated) {
			createTopTenList = (<div>In order to create new Top Ten lists, please verify your email address by clicking the link in the email you were sent when you registered. You can request a new verification email from your <Link to="/account">Account</Link> page.</div>);
		} else {
			createTopTenList = (<div>In order to create new Top Ten lists, please <Link to="/login">log in</Link> or <Link to="/register">register a My Top Tens account</Link>.</div>);
		}

		return (
			<div className="toptenlists-list">
				<Container>
					<Row>
						<Col  className="top-level-toptenlists-control">
							<Label check>
								<Input
									type="checkbox"
									defaultChecked={this.props.topLevelTopTenListsOnly}
									onChange={this.props.handleTopLevelListsChange}/>{' '}
								Show top level Top Ten lists only
							</Label>
						</Col>
					</Row>
					<Row>
						<Col>
							{createTopTenList}
						</Col>
					</Row>
				</Container>
				{this.props.auth.isAuthenticated && <div className="tabs">
					{this.renderTabs()}
					<div className="clearing"></div>
				</div>}
				<div className="topTenLists">
					{TopTenListsList}
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

export default withRouter(TopTenListsPage);
