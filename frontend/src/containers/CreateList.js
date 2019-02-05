import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { createList } from '../modules/lists';
import { Container, Row, Col, Label, Input } from 'reactstrap';

import FlashMessage from '../components/FlashMessage';
import formatErrorMessages from '../modules/formatErrorMessages';
import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';
import * as permissions from '../modules/permissions';

import ValidatedForm from '../components/ValidatedForm.js';
import { MAX_ITEMS_IN_LIST } from '../constants';

import './CreateList.scss';

class CreateList extends Component {
	constructor(props) {
		super();
		this.state = {
			'name': '',
			'description': '',
		};
		for (let i=1; i<=MAX_ITEMS_IN_LIST; i++) {
			this.state[`item${i}_name`] = '';
			this.state[`item${i}_description`] = '';
		}
		this.handleInputChange = this.handleInputChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.cancel = this.cancel.bind(this);

		props.dispatch(clearErrors());
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

		let newList = {
			'name': this.state.name,
			'description': this.state.description,
			'items': [],
		};

		
		for (let i=1; i<=MAX_ITEMS_IN_LIST; i++) {
			if (this.state[`item${i}`] !== '') {
				const newItem = {
					'name': this.state[`item${i}_name`],
					'description': this.state[`item${i}_description`],
					'order': i,
				};
				newList.items.push(newItem);
			}
		}

		this.onCreateList(newList);
	}

	onCreateList = (newList) => {
		this.props.dispatch(createList(newList, this.props.history));
	}


	componentDidMount() {

	}

	componentDidUpdate(prevProps){
		// If the user cannot create a list, redirect to Home
		if(!permissions.canCreateList()){
			this.props.history.push('/');
		}
	}

	onCloseFlashMessage = () => {
		this.props.dispatch(clearErrors());
	}

	renderItemInputs() {
		let elements = [];

		for (let i=1; i<=MAX_ITEMS_IN_LIST; i++) {
			elements.push(
				<div className="form-group" key={`item${i}`}>
					<Row>
						<Col lg="9">
							<h3>Item {i}</h3>
							<Label for={`item${i}_name`}>Name</Label>
							<Input
								type="text"
								name={`item${i}_name`}
								id={`item${i}_name`}
								onChange={ this.handleInputChange }
								value={ this.state[`item${i}_name`] }
								placeholder="Name"
							/>
							<div className='invalid-feedback' />
						</Col>
					</Row>
					<Row>
						<Col lg="9">
							<Label for={`item${i}_description`}>Description</Label>
							<Input
								type="text"
								name={`item${i}_description`}
								id={`item${i}_description`}
								onChange={ this.handleInputChange }
								value={ this.state[`item${i}_description`] }
								placeholder="Description"
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
			<Container>
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
				<h2>Create a new list</h2>
				<ValidatedForm onSubmit={ this.handleSubmit }>
					<div className="form-group">
						<Row>
							<Col lg="9">
								<Label for="name">Name</Label>
								<Input
									type="text"
									name="name"
									required={true}
									id="name"
									onChange={ this.handleInputChange }
									value={ this.state.name }
									placeholder="Enter the list name"
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
							<Col lg="9">
								<Label for="username">Description</Label>
								<Input
									type="text"
									name="description"
									id="description"
									onChange={ this.handleInputChange }
									value={ this.state.description }
									placeholder="Enter the list description"
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
							{this.props.errors.lists && <div className="invalid-feedback " style={{ 'display': 'block' }}>{this.props.errors.lists}</div>}
						</Col>
					</Row>
	      </ValidatedForm>
			</Container>
		);
	}
}

CreateList.propTypes = {
	//'createList': PropTypes.func.isRequired,
	'auth': PropTypes.object.isRequired,
	'errors': PropTypes.object.isRequired
};

const mapStateToProps = state => ({
	'auth': state.auth,
	'errors': state.errors,
});

export default connect(mapStateToProps)(withRouter(CreateList));
