import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import topTenListAsText from '../modules/topTenListAsText';
import './SaveTopTenListAsTextButton.scss';

import { COLORS } from '../constants';

class SaveTopTenListAsTextButton extends Component {
	constructor(props) {
		super();

		this.onClickButton = this.onClickButton.bind(this);
	}

	onClickButton = () => {
		const {
			id,
		} = this.props;

		const text = topTenListAsText(id);

		console.log('text', text);
	}

	render() {
		return (
			<div className="save-toptenlist-as-text">
				<button
					type="button"
					className="btn btn-default"
					onClick={this.onClickButton}
					color="link"
				>
					<span className="icon" title="Save this Top Ten List as a text file"><FontAwesomeIcon icon={['fas', 'file-download']} style={{ 'color': COLORS.REGULARTEXT }} size="1x" /></span>
				</button>
			</div>
		);
	}
}

SaveTopTenListAsTextButton.propTypes = {
	'id': PropTypes.string.isRequired,
};

export default SaveTopTenListAsTextButton;
