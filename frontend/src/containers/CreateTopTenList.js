import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withRouter, Link } from 'react-router-dom';
import { createTopTenList } from '../modules/toptenlist';
import { Container, Row, Col, Label, Input } from 'reactstrap';

import FlashMessage from '../components/FlashMessage';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';
import * as permissions from '../modules/permissions';

import ValidatedForm from '../components/ValidatedForm.js';
import { MAX_ITEMS_IN_TOPTENLIST } from '../constants';

import './CreateTopTenList.scss';

class CreateTopTenList extends Component {
	constructor(props) {
		super(props);

		this.state = {
			'name': '',
			'description': '',
		};
		for (let i=1; i<=MAX_ITEMS_IN_TOPTENLIST; i++) {
			this.state[`item${i}_name`] = '';
			this.state[`item${i}_description`] = '';
		}
		this.handleInputChange = this.handleInputChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.cancel = this.cancel.bind(this);

		props.dispatch(clearErrors());

		if (props.auth.isAuthenticated) {
			const urlParams = new URLSearchParams(props.location.search);
			this.state.parentItemId = urlParams.get('parent-item-id');
			this.state.parentItemName = urlParams.get('parent-item-name');
			this.state.parentTopTenListName = urlParams.get('parent-toptenlist-name');
			this.state.parentTopTenListId = urlParams.get('parent-toptenlist-id');
		}
	}

	handleInputChange(e) {
		this.setState({
			[e.target.name]: e.target.value
		});
	}

	cancel(e) {
		this.props.history.push('/');
	}

	handleSubmit(e) {
		e.preventDefault();

		let newTopTenList = {
			'name': this.state.name,
			'description': this.state.description,
			'toptenitem': [],
		};
		
		for (let i=1; i<=MAX_ITEMS_IN_TOPTENLIST; i++) {
			if (this.state[`item${i}`] !== '') {
				const newItem = {
					'name': this.state[`item${i}_name`],
					'description': this.state[`item${i}_description`],
					'order': i,
				};
				newTopTenList.toptenitem.push(newItem);
			}
		}

		if (this.state.parentItemId) {
			newTopTenList.parent_toptenitem = this.state.parentItemId;
		}

		this.onCreateTopTenList(newTopTenList);
	}

	onCreateTopTenList = (newTopTenList) => {
		this.props.dispatch(createTopTenList(newTopTenList, this.props.history));
	}


	componentDidMount() {

	}

	componentDidUpdate(prevProps){
		// If the user cannot create a toptenlist, redirect to Home
		if(!permissions.canCreateTopTenList() && !this.props.auth.isLoading){
			this.props.history.push('/');
		}
	}

	onCloseFlashMessage = () => {
		this.props.dispatch(clearErrors());
	}

	renderItemInputs() {
		let elements = [];

		for (let i=1; i<=MAX_ITEMS_IN_TOPTENLIST; i++) {
			elements.push(
				<div className="form-group" key={`item${i}`}>
					<Row>
						<Col lg="9" className="item-name">
							<Label for={`item${i}_name`}>Item {i}</Label>
							<Input
								type="text"
								name={`item${i}_name`}
								id={`item${i}_name`}
								onChange={ this.handleInputChange }
								value={ this.state[`item${i}_name`] }
								placeholder="Enter the item name"
							/>
							<div className='invalid-feedback' />
						</Col>
					</Row>
					<Row>
						<Col lg="9" className="item-description">
							<Label for={`item${i}_description`}>Item {i} description</Label>
							<Input
								type="textarea"
								name={`item${i}_description`}
								id={`item${i}_description`}
								onChange={ this.handleInputChange }
								value={ this.state[`item${i}_description`] }
								placeholder="Enter the item description"
							/>
							<div className='invalid-feedback' />
						</Col>
					</Row>
				</div>);
		}
		return elements;
	}

	render() {
		return (
			<Container className="create-toptenlist">
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
				<h2>Create a new toptenlist</h2>
				{this.state.parentItemName && (
					<div className="parent-item"><Link to={`/toptenlist/${this.state.parentTopTenListId}`}>{this.state.parentTopTenListName}</Link> > {this.state.parentItemName}</div>
				)}
				<ValidatedForm onSubmit={ this.handleSubmit }>
					<div className="form-group">
						<Row>
							<Col lg="9" className="toptenlist-name">
								<Label for="name">Top Ten List name</Label>
								<Input
									type="text"
									name="name"
									required={true}
									id="name"
									onChange={ this.handleInputChange }
									value={ this.state.name }
									placeholder="Enter the toptenlist name"
								/>
								<div className='invalid-feedback' />
								<small className='form-text text-muted'>
									<p>Name is required</p>
								</small>
							</Col>
						</Row>
					</div>
					<div className="form-group">
						<Row>
							<Col lg="9" className="toptenlist-description">
								<Label for="username">Description</Label>
								<Input
									type="textarea"
									name="description"
									id="description"
									onChange={ this.handleInputChange }
									value={ this.state.description }
									placeholder="Enter the toptenlist description"
								/>
								<div className='invalid-feedback' />
							</Col>
						</Row>
					</div>
					{this.renderItemInputs()}
					<Row>
						<Col lg="9">
							<button type="button" className="btn btn-secondary"onClick={this.cancel}>
								Cancel
							</button>
							<button type="submit" className="btn btn-primary">
								Save list
							</button>
						</Col>
					</Row>
	        <Row>
						<Col lg="9">
							{this.props.errors.toptenlists && <div className="invalid-feedback " style={{ 'display': 'block' }}>{this.props.errors.toptenlists}</div>}
						</Col>
					</Row>
	      </ValidatedForm>
			</Container>
		);
	}
}

CreateTopTenList.propTypes = {
	'auth': PropTypes.object.isRequired,
	'errors': PropTypes.object.isRequired
};

const mapStateToProps = state => ({
	'auth': state.auth,
	'errors': state.errors,
});

export default connect(mapStateToProps)(withRouter(CreateTopTenList));
