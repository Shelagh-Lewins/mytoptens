import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { withFormik, Field } from 'formik';

// ChangeRequestForm is wrapped in PureComponent so that the DOM only updates when properties have changed.
// Otherwise the inputs are reset on every store update even if there is no change to properties.

import {
	Button,
	Label,
	Input,
	Row,
	Col,
} from 'reactstrap';

import './ChangeRequestForm.scss';

class BasicChangeRequestForm extends PureComponent {
	render() {
		const {
			touched,
			errors,
			handleSubmit,
			isSubmitting,
			onCancel,
			reusableItemUsersCount,
		} = this.props;

		return (
			<Row>
				<Col className="change-request-form">
					<form onSubmit={handleSubmit}>
						<h3>{reusableItemUsersCount === 0 ? 'Edit' : 'Create a change request'}</h3>
						{reusableItemUsersCount > 0 && (
							<p className="hint">Other users who reference this Reusable Item in their Top Ten Lists will vote on your change request.</p>
						)}
						<Label for="name">Name</Label>
						<Input
							type="text"
							name="name"
							tag={Field}
							component="input"
						/>
						{errors.name && touched.name && <div className="invalid-feedback">{errors.name}</div>}
						<Label for="definition">Definition</Label>
						<Input
							type="text"
							name="definition"
							tag={Field}
							component="input"
						/>
						<Label for="name">Link</Label>
						<Input
							type="text"
							name="link"
							tag={Field}
							component="input"
						/>
						<Button type="button" color="secondary" onClick={onCancel}>Cancel</Button>
						<Button type="submit" color="primary" disabled={isSubmitting}>Done</Button>
					</form>
				</Col>
			</Row>
		);
	}
}

const EnhancedChangeRequestForm = withFormik({
	'mapPropsToValues': (props: Props) => ({
		'name': props.data.name, 'definition': props.data.definition, 'link': props.data.link,
	}),

	// Custom sync validation
	'validate': (values) => {
		const errors = {};

		if (!values.name || values.name === '') {
			errors.name = 'Name is required';
		}

		return errors;
	},

	// note how to upack onSubmit from props in the FormikBag parameter
	'handleSubmit': (values, { setSubmitting, 'props': { onSubmit, closeForm } }) => {
		onSubmit(values);
		setTimeout(() => {
			setSubmitting(false);
			closeForm();
		}, 1000);
	},

	'displayName': 'ChangeRequestForm',
})(BasicChangeRequestForm);

export default EnhancedChangeRequestForm;

BasicChangeRequestForm.propTypes = {
	'errors': PropTypes.objectOf(PropTypes.any).isRequired,
	'handleSubmit': PropTypes.func.isRequired,
	'isSubmitting': PropTypes.bool.isRequired,
	'onCancel': PropTypes.func.isRequired,
	'reusableItemUsersCount': PropTypes.number.isRequired,
	'touched': PropTypes.objectOf(PropTypes.any).isRequired,
};
