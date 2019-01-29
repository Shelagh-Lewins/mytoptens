// Page to display list of lists

import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';
import ListsList from '../components/ListsList';
import ListSummary from '../components/ListSummary';
import './ListsPage.scss';

class ListsPage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			'selectedTab': 'my-lists',
		};
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
			<ListsList>
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

	handleTabClick = (e) => {
		this.setState({
			'selectedTab': e.target.id,
		});
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
		return (
			<div className="lists-list">
				<Container>
					<Row>
						<Col sm="6">
							<div className="lists-list-header">
								<input className="form-control"
									onChange={this.onSearch}
									type="text"
									placeholder="Search..."
								/>
								{this.props.canCreateList && (
									<button
										className="btn btn-primary"
										onClick={this.onAddList}
									>+ New list</button>
								)}
							</div>
						</Col>
					</Row>
				</Container>
				<div className="tabs">
					{this.renderTabs()}
					<div className="clearing"></div>
				</div>
				<div className="lists">
					{listsList}
				</div>
			</div>
		);
	}
}

export default withRouter(ListsPage);
