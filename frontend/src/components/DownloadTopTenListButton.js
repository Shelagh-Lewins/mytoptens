import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import sanitizeFilename from '../modules/sanitizeFilename';
import topTenListAsText from '../modules/topTenListAsText';
import downloadFile from '../modules/downloadFile';
import './DownloadTopTenListButton.scss';

import { COLORS } from '../constants';

class DownloadTopTenListButton extends Component {
	constructor(props) {
		super();

		this.onClickButton = this.onClickButton.bind(this);
	}

	onClickButton = () => {
		const {
			id,
			name,
		} = this.props;

		const text = topTenListAsText(id);
		const filename = `${sanitizeFilename(name)}.txt`;

		downloadFile(text, filename);
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

DownloadTopTenListButton.propTypes = {
	'id': PropTypes.string.isRequired,
	'name': PropTypes.string.isRequired,
};

export default DownloadTopTenListButton;
