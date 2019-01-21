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

import ValidatedForm from '../components/ValidatedForm.js';
import { MAX_ITEMS_IN_LIST } from '../constants';

class CreateList extends Component {
	constructor() {
		super();
		this.state = {
			'title': '',
			'description': '',
		};
		for (let i=1; i<=MAX_ITEMS_IN_LIST; i++) {
			this.state[`item${i}_title`] = '';
			this.state[`item${i}_description`] = '';
		}
		this.handleInputChange = this.handleInputChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.cancel = this.cancel.bind(this);
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
			'title': this.state.title,
			'description': this.state.description,
			'items': [],
		};

		
		for (let i=1; i<=MAX_ITEMS_IN_LIST; i++) {
			if (this.state[`item${i}`] !== '') {
				const newItem = {
					'title': this.state[`item${i}_title`],
					'description': this.state[`item${i}_description`],
					'order': i,
				};
				newList.items.push(newItem);
			}
		}

		//this.props.onCreateList(newList, this.props.history);
		this.onCreateList(newList);
	}

	onCreateList = (newList) => {
		this.props.dispatch(createList(newList, this.props.history));
	}


	componentDidMount() {

	}

	componentDidUpdate(prevProps){
		// If the user cannot create a list, redirect to Home
		if(!this.props.auth.canCreateList){
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
						<Col>
							<h3>Item {i}</h3>
							<Label for={`item${i}_title`}>Title</Label>
							<Input
								type="text"
								name={`item${i}_title`}
								id={`item${i}_title`}
								onChange={ this.handleInputChange }
								value={ this.state[`item${i}_title`] }
								placeholder="Title"
							/>
							<div className='invalid-feedback' />
						</Col>
					</Row>
					<Row>
						<Col>
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

	///////////////

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
					<Row>
						<Col>
							<div className="form-group">
								<Label for="email">Title</Label>
								<Input
									type="text"
									name="title"
									required={true}
									id="title"
									onChange={ this.handleInputChange }
									value={ this.state.title }
									placeholder="Enter the list title"
								/>
								<div className='invalid-feedback' />
								<small className='form-text text-muted'>
									<p>Title is required</p>
								</small>
							</div>
						</Col>
					</Row>
					<Row>
						<Col>
							<div className="form-group">
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
							</div>
						</Col>
					</Row>
					{this.renderItemInputs()}
					<Row>
						<Col>
							<button type="button" className="btn btn-secondary"onClick={this.cancel}>
								Cancel
							</button>
							<button type="submit" className="btn btn-primary">
								Save list
							</button>
						</Col>
					</Row>
	        <Row>
						<Col>
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
