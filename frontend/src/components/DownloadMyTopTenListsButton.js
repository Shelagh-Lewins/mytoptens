import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import sanitizeFilename from '../modules/sanitizeFilename';
import topTenListAsText from '../modules/topTenListAsText';
import downloadFile from '../modules/downloadFile';
import './DownloadMyTopTenListsButton.scss';

import { COLORS } from '../constants';

class DownloadMyTopTenListsButton extends Component {
	constructor(props) {
		super();

		this.onClickButton = this.onClickButton.bind(this);
	}

	// destructure nested properties
	// https://itnext.io/using-es6-to-destructure-nested-objects-in-javascript-avoid-undefined-errors-that-break-your-code-612ae67913e9
	onClickButton = () => {
		const {
			'auth': {
				'user': {
					username,
				},
			},
			myTopTenLists,
		} = this.props;

		let text = `Top Ten Lists owned by: ${username}\n`;
		text += `${new Date()}\n\n`;

		Object.keys(myTopTenLists).map((is_public) => {
			const topTenListsByIsPublic = myTopTenLists[is_public];

			if (topTenListsByIsPublic.length > 0) {
				const headerText = is_public === 'true'
					? `Public Top Ten lists (${topTenListsByIsPublic.length})`
					: `Private Top Ten lists (${topTenListsByIsPublic.length})`;

				text += `${headerText}`;
				text += '\n=======================\n';

				topTenListsByIsPublic.map((topTenList) => {
					text += topTenListAsText(topTenList.id);
					text += '\n-------------------------------\n';
				});
			}
		});

		const filename = `${sanitizeFilename(`toptenlists-${username}`)}.txt`;

		downloadFile(text, filename);

		console.log('text:', text);
	}

	render() {
		return (
			<div className="download-my-toptenlists">
				<button
					type="button"
					className="btn btn-default"
					onClick={this.onClickButton}
					color="link"
				>
					<span className="icon" title="Download all my Top Ten Lists as a text file"><FontAwesomeIcon icon={['fas', 'file-download']} style={{ 'color': COLORS.REGULARTEXT }} size="1x" /></span>Download my Top Ten Lists
				</button>
			</div>
		);
	}
}

DownloadMyTopTenListsButton.propTypes = {
	'auth': PropTypes.objectOf(PropTypes.any).isRequired,
	'myTopTenLists': PropTypes.objectOf(PropTypes.any).isRequired,
};

export default DownloadMyTopTenListsButton;
