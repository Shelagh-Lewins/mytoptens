import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import topTenListAsText from '../modules/topTenListAsText';
import './downloadTopTenListButton.scss';

import { COLORS } from '../constants';

class downloadTopTenListButton extends Component {
	constructor(props) {
		super();

		this.onClickButton = this.onClickButton.bind(this);
	}

	onClickButton = () => {
		const {
			id,
		} = this.props;

		topTenListAsText(id);
	}

	render() {
		return (
			<div className="download-toptenlist">
				<button
					type="button"
					className="btn btn-default"
					onClick={this.onClickButton}
					color="link"
				>
					<span className="icon" title="Download this Top Ten List as a text file"><FontAwesomeIcon icon={['fas', 'file-download']} style={{ 'color': COLORS.REGULARTEXT }} size="1x" /></span>
				</button>
			</div>
		);
	}
}

downloadTopTenListButton.propTypes = {
	'id': PropTypes.string.isRequired,
};

export default downloadTopTenListButton;
