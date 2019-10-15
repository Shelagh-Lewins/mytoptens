// Page to display list of topTenLists

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter, Link } from 'react-router-dom';
import {
	Container,
	Row,
	Col,
	Label,
	Input,
} from 'reactstrap';
import TopTenListsList from './TopTenListsList';
import TopTenListSummary from './TopTenListSummary';
import './TopTenListsPage.scss';
import Pagination from './Pagination';
import DownloadMyTopTenListsButton from './DownloadMyTopTenListsButton';

class TopTenListsPage extends Component {
	onAddTopTenList = () => {
		const { history } = this.props; // eslint-disable-line react/prop-types
		history.push('/newtopTenList');
	}

	renderPublicTopTenListsControls() {
		const {
			publicTopTenListsFilterBy,
			publicTopTenListsFilterTerm,
			onChangePublicTopTenListsFilterBy,
			onChangePublicTopTenListsFilterTerm,
		} = this.props;

		return (
			<Container key="publicTopTenListsControls">
				<Row key="publicTopTenListsControls">
					<Col className="public-toptenlists-controls">
						<Label check>
							Filter Top Ten Lists:
							<Input
								className="form-control"
								onChange={onChangePublicTopTenListsFilterTerm}
								type="text"
								value={publicTopTenListsFilterTerm}
								placeholder="Enter a filter term"
							/>
							<select className="form-control" onChange={onChangePublicTopTenListsFilterBy} value={publicTopTenListsFilterBy}>
								<option value="topTenListName">Name</option>
								<option value="username">Owner</option>
							</select>
						</Label>
					</Col>
				</Row>
			</Container>
		);
	}

	renderPublicTopTenLists() {
		const { publicTopTenLists, onChangeIsPublic, onDeleteTopTenList, publicTopTenListsFilterTerm } = this.props;

		const headerText = publicTopTenListsFilterTerm === '' ? 'All public Top Ten lists' : 'Filtered public Top Ten Lists';

		if (publicTopTenLists.length > 0) {
			return (
				<TopTenListsList headerText={headerText} key="publicTopTenLists">
					{publicTopTenLists.map(topTenList => (
						<TopTenListSummary
							key={topTenList.id}
							topTenList={topTenList}
							onChangeIsPublic={onChangeIsPublic}
							onDeleteTopTenList={onDeleteTopTenList}
						/>
					))}
				</TopTenListsList>
			);
		}
		return (
			<p key="publicTopTenLists">No Top Ten Lists match the current filter</p>
		);
	}

	// destructure nested properties
	// https://itnext.io/using-es6-to-destructure-nested-objects-in-javascript-avoid-undefined-errors-that-break-your-code-612ae67913e9
	renderMyTopTenListsControls() {
		const {
			'auth': {
				'user': {
					username,
				},
			},
			topLevelTopTenListsOnly,
			handleTopLevelTopTenListsChange,
			myTopTenLists,
		} = this.props;

		return (
			<React.Fragment key="myTopTenListsControls">
				<Container>
					<Row>
						<Col className="top-level-toptenlists-control">
							<Label check>
								<Input
									type="checkbox"
									defaultChecked={topLevelTopTenListsOnly}
									onChange={handleTopLevelTopTenListsChange}
								/>
								{' '}
								Show top level Top Ten Lists only
							</Label>
						</Col>
					</Row>
				</Container>
				<Container>
					<Row>
						<Col className="download-my-toptenlists">
							<DownloadMyTopTenListsButton
								username={username}
								myTopTenLists={myTopTenLists}
								topLevelTopTenListsOnly={topLevelTopTenListsOnly}
							/>
						</Col>
					</Row>
				</Container>
			</React.Fragment>
		);
	}

	renderMyTopTenLists() {
		const {
			myTopTenLists,
			onChangeIsPublic,
			onDeleteTopTenList,
		} = this.props;

		return Object.keys(myTopTenLists).map((is_public) => {
			const topTenListsByIsPublic = myTopTenLists[is_public];
			const headerText = is_public === 'true' ? 'My public Top Ten lists' : 'My private Top Ten lists';

			return (
				<div key={`${is_public}_lists`}>
					{(topTenListsByIsPublic.length > 0) && (
						<TopTenListsList is_public={is_public} headerText={headerText}>
							{topTenListsByIsPublic.map(topTenList => (
								<TopTenListSummary
									key={topTenList.id}
									topTenList={topTenList}
									onChangeIsPublic={onChangeIsPublic}
									onDeleteTopTenList={onDeleteTopTenList}
								/>
							))}
						</TopTenListsList>
					)}
				</div>
			);
		});
	}

	renderTabs() {
		const { selectedTab, handleTabClick } = this.props;
		return (
			<ul>
				<li>
					<button
						href="#"
						tabIndex="0"
						type="button"
						className={selectedTab === 'mytoptens' ? 'selected' : ''}
						id="mytoptens"
						onClick={handleTabClick}
					>
						My Top Ten lists
					</button>
				</li>
				<li>
					<button
						href="#"
						tabIndex="0"
						type="button"
						className={selectedTab === 'publictoptens' ? 'selected' : ''}
						id="publictoptens"
						onClick={handleTabClick}
					>
						Public Top Ten lists
					</button>
				</li>
			</ul>
		);
	}

	render() {
		let TopTenListsListElement;
		const {
			auth,
			count,
			selectedTab,
			isLoading,
			canCreateTopTenList,
			currentPage,
			onChangePage,
			pageSize,
		} = this.props;

		if (selectedTab === 'mytoptens') {
			TopTenListsListElement = [this.renderMyTopTenListsControls(), this.renderMyTopTenLists()];
		} else if (selectedTab === 'publictoptens') {
			TopTenListsListElement = [this.renderPublicTopTenListsControls(), this.renderPublicTopTenLists()];
		}

		if (isLoading) {
			return (
				<div className="topTenLists-loading">
					Loading...
				</div>
			);
		}

		let createTopTenList;
		if (canCreateTopTenList()) {
			createTopTenList = (
				<button
					type="button"
					className="btn btn-primary create-toptenlist"
					onClick={this.onAddTopTenList}
				>
				+ New Top Ten list
				</button>
			);
		} else if (auth.isAuthenticated) {
			createTopTenList = (
				<div>
				In order to create new Top Ten lists, please verify your email address by clicking the link in the email you were sent when you registered. You can request a new verification email from your <Link to="/account">Account</Link> page.
				</div>
			);
		} else {
			createTopTenList = (
				<div>
				In order to create new Top Ten lists, please <Link to="/login">log in</Link> or <Link to="/register">register a My Top Tens account</Link>.
				</div>
			);
		}

		return (
			<div className="toptenlists-list">
				<Container>
					<Row>
						<Col>
							{createTopTenList}
						</Col>
					</Row>
				</Container>
				{auth.isAuthenticated && (
					<div className="tabs">
						{this.renderTabs()}
						<div className="clearing" />
					</div>
				)}
				<div className="topTenLists">
					{TopTenListsListElement}
				</div>
				{selectedTab === 'publictoptens' && (
					<div className="container">
						<div className="text-center">
							<Pagination
								count={count}
								pageSize={pageSize}
								currentPage={currentPage}
								onChangePage={onChangePage}
							/>
						</div>
					</div>
				)}
			</div>
		);
	}
}

TopTenListsPage.propTypes = {
	'auth': PropTypes.objectOf(PropTypes.any).isRequired,
	'canCreateTopTenList': PropTypes.func.isRequired,
	'count': PropTypes.number,
	'currentPage': PropTypes.number.isRequired,
	// 'publicTopTenListsFilterBy': PropTypes.string.isRequired,
	// 'publicTopTenListsFilterTerm': PropTypes.string.isRequired,
	'handleTabClick': PropTypes.func.isRequired,
	'handleTopLevelTopTenListsChange': PropTypes.func.isRequired,
	'isLoading': PropTypes.bool.isRequired,
	'myTopTenLists': PropTypes.objectOf(PropTypes.any).isRequired,
	'onChangePublicTopTenListsFilterBy': PropTypes.func.isRequired,
	'onChangePublicTopTenListsFilterTerm': PropTypes.func.isRequired,
	'onChangeIsPublic': PropTypes.func.isRequired,
	'onChangePage': PropTypes.func.isRequired,
	'onDeleteTopTenList': PropTypes.func.isRequired,
	'pageSize': PropTypes.number.isRequired,
	'publicTopTenLists': PropTypes.arrayOf(PropTypes.any).isRequired,
	'publicTopTenListsFilterBy': PropTypes.string.isRequired,
	'publicTopTenListsFilterTerm': PropTypes.string.isRequired,
	'selectedTab': PropTypes.string.isRequired,
	'topLevelTopTenListsOnly': PropTypes.bool.isRequired,
};

export default withRouter(TopTenListsPage);
