// Page to display list of lists

import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';
import ListsList from '../components/ListsList';
import './ListsPage.scss';

class ListsPage extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	componentDidUpdate(prevProps){

	}

	onSearch = e => {
		this.props.onSearch(e.target.value);
	}

	onDeleteList = (id) => {
		this.props.onDeleteList(id);
	}

	onAddList = () => {
		this.props.history.push('/newlist');
	}

	renderListsList() {
		const { lists, onIsPublicChange, onDeleteList } = this.props;

		return Object.keys(lists).map((is_public, index) => {
			const listsByIsPublic = lists[is_public];

			return (
				<div key={index}>
					{(listsByIsPublic.length > 0) && (
						<ListsList
							lists={listsByIsPublic}
							onIsPublicChange={onIsPublicChange}
							onDeleteList={onDeleteList}
							is_public={is_public}
							key={is_public}
						/>
					)}
				</div>
			);
		});
	}

	render() {
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
				<div className="lists">
					{this.renderListsList()}
				</div>
			</div>
		);
	}
}

export default withRouter(ListsPage);
