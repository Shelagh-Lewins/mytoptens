import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withRouter, Link } from 'react-router-dom';
import { createTopTenList } from '../modules/topTenList';
import { Container, Row, Col, Label, Input } from 'reactstrap';

import FlashMessage from '../components/FlashMessage';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';
import * as permissions from '../modules/permissions';

import ValidatedForm from '../components/ValidatedForm.js';
import { MAX_TOPTENITEMS_IN_TOPTENLIST } from '../constants';

import './CreateTopTenList.scss';

class CreateTopTenList extends Component {
	constructor(props) {
		super(props);

		this.state = {
			'name': '',
			'description': '',
		};
		for (let i=1; i<=MAX_TOPTENITEMS_IN_TOPTENLIST; i++) {
			this.state[`topTenItem${i}_name`] = '';
			this.state[`topTenItem${i}_description`] = '';
		}
		this.handleInputChange = this.handleInputChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.cancel = this.cancel.bind(this);

		props.dispatch(clearErrors());

		if (props.auth.isAuthenticated) {
			const urlParams = new URLSearchParams(props.location.search);
			this.state.parentTopTenItemId = urlParams.get('parent-topTenItem-id');
			this.state.parentTopTenItemName = urlParams.get('parent-topTenItem-name');
			this.state.parentTopTenListName = urlParams.get('parent-topTenList-name');
			this.state.parentTopTenListId = urlParams.get('parent-topTenList-id');
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
			'topTenItem': [],
		};
		
		for (let i=1; i<=MAX_TOPTENITEMS_IN_TOPTENLIST; i++) {
			if (this.state[`topTenItem${i}`] !== '') {
				const newTopTenItem = {
					'name': this.state[`topTenItem${i}_name`],
					'description': this.state[`topTenItem${i}_description`],
					'order': i,
				};
				newTopTenList.topTenItem.push(newTopTenItem);
			}
		}

		if (this.state.parentTopTenItemId) {
			newTopTenList.parent_topTenItem = this.state.parentTopTenItemId;
		}

		this.onCreateTopTenList(newTopTenList);
	}

	onCreateTopTenList = (newTopTenList) => {
		this.props.dispatch(createTopTenList(newTopTenList, this.props.history));
	}


	componentDidMount() {

	}

	componentDidUpdate(prevProps){
		// If the user cannot create a topTenList, redirect to Home
		if(!permissions.canCreateTopTenList() && !this.props.auth.isLoading){
			this.props.history.push('/');
		}
	}

	onCloseFlashMessage = () => {
		this.props.dispatch(clearErrors());
	}

	renderTopTenItemInputs() {
		let elements = [];

		for (let i=1; i<=MAX_TOPTENITEMS_IN_TOPTENLIST; i++) {
			elements.push(
				<div className="form-group" key={`topTenItem${i}`}>
					<Row>
						<Col lg="9" className="topTenItem-name">
							<Label for={`topTenItem${i}_name`}>Top Ten item {i}</Label>
							<Input
								type="text"
								name={`topTenItem${i}_name`}
								id={`topTenItem${i}_name`}
								onChange={ this.handleInputChange }
								value={ this.state[`topTenItem${i}_name`] }
								placeholder="Enter the Top Ten item name"
							/>
							<div className='invalid-feedback' />
						</Col>
					</Row>
					<Row>
						<Col lg="9" className="topTenItem-description">
							<Label for={`topTenItem${i}_description`}>Top Ten item {i} description</Label>
							<Input
								type="textarea"
								name={`topTenItem${i}_description`}
								id={`topTenItem${i}_description`}
								onChange={ this.handleInputChange }
								value={ this.state[`topTenItem${i}_description`] }
								placeholder="Enter the description"
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
			<Container className="create-topTenList">
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
				<h2>Create a new topTenList</h2>
				{this.state.parentTopTenItemName && (
					<div className="parent-topTenItem"><Link to={`/topTenList/${this.state.parentTopTenListId}`}>{this.state.parentTopTenListName}</Link> > {this.state.parentTopTenItemName}</div>
				)}
				<ValidatedForm onSubmit={ this.handleSubmit }>
					<div className="form-group">
						<Row>
							<Col lg="9" className="topTenList-name">
								<Label for="name">Top Ten List name</Label>
								<Input
									type="text"
									name="name"
									required={true}
									id="name"
									onChange={ this.handleInputChange }
									value={ this.state.name }
									placeholder="Enter the topTenList name"
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
							<Col lg="9" className="topTenList-description">
								<Label for="username">Description</Label>
								<Input
									type="textarea"
									name="description"
									id="description"
									onChange={ this.handleInputChange }
									value={ this.state.description }
									placeholder="Enter the topTenList description"
								/>
								<div className='invalid-feedback' />
							</Col>
						</Row>
					</div>
					{this.renderTopTenItemInputs()}
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
							{this.props.errors.topTenLists && <div className="invalid-feedback " style={{ 'display': 'block' }}>{this.props.errors.topTenLists}</div>}
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
