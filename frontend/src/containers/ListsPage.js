// Page to display list of lists

import React, { Component } from 'react';
import { Container, Row, Col } from 'reactstrap';
import ListsList from '../components/ListsList';
import './ListsPage.scss';

class ListsPage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			'showNewCardForm': false,
			'title': '',
			'description': ''
		};
	}

	onSearch = e => {
		this.props.onSearch(e.target.value);
	}

	onTitleChange = (e) => {
		this.setState({ 'title': e.target.value });
	}

	onDescriptionChange = (e) => {
		this.setState({ 'description': e.target.value });
	}

	resetForm() {
		this.setState({
			'showNewCardForm': false,
			'title': '',
			'description': ''
		});
	}

	onCreateList = (e) => {
		e.preventDefault();
		this.props.onCreateList({
			'title': this.state.title,
			'description': this.state.description
		});
		this.resetForm();
	}

	onDeleteList = (id) => {
		this.props.onDeleteList(id);
	}

	toggleForm = () => {
		this.setState({ 'showNewCardForm': !this.state.showNewCardForm });
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
								<button
									className="btn btn-primary"
									onClick={this.toggleForm}
								>+ New list</button>
							</div>
						</Col>
					</Row>
				</Container>
				{this.state.showNewCardForm && (
					<Container>
						<form className="lists-list-form" onSubmit={this.onCreateList}>
							<input
								className="full-width-input"
								onChange={this.onTitleChange}
								value={this.state.title}
								type="text"
								placeholder="title"
							/>
							<input
								className="full-width-input"
								onChange={this.onDescriptionChange}
								value={this.state.description}
								type="text"
								placeholder="description"
							/>
							<button
								className="button"
								type="submit"
							>
									Save
							</button>
						</form>
					</Container>
				)}
				<div className="lists">
					{this.renderListsList()}
				</div>
			</div>
		);
	}
}

export default ListsPage;
