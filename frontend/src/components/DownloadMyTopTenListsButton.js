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

	onClickButton = () => {
		const {
			username,
			myReusableItems,
			myTopTenLists,
			topLevelTopTenListsOnly,
		} = this.props;

		if (!username) {
			return;
		}

		let text;

		// export Top Ten Lists
		if (topLevelTopTenListsOnly) {
			text = `Top level Top Ten Lists owned by: ${username}\nChild Top Ten Lists are not included\n`;
		} else {
			text = `All Top Ten Lists owned by: ${username}\nChild Top Ten LIsts are included\n`;
		}

		text += `${new Date()}\n\n`;

		Object.keys(myTopTenLists).forEach((is_public) => { // eslint-disable-line array-callback-return
			const topTenListsByIsPublic = myTopTenLists[is_public];

			if (topTenListsByIsPublic.length > 0) {
				const headerText = is_public === 'true'
					? `Public Top Ten lists (${topTenListsByIsPublic.length})`
					: `Private Top Ten lists (${topTenListsByIsPublic.length})`;

				text += `${headerText}`;
				text += '\n=======================\n';

				topTenListsByIsPublic.forEach((topTenList) => {
					text += topTenListAsText(topTenList.id);
					text += '\n-------------------------------\n';
				});
			}
		});

		// export Reusable Items
		if (myReusableItems.length > 0) {
			text += '\nReusableItems referenced by Top Ten Lists';
			text += '\n=======================\n';

			myReusableItems.forEach((reusableItem) => {
				if (reusableItem && reusableItem.name) {
					text += `Reusable Item: ${reusableItem.name}\n`;

					if (reusableItem.definition) {
						text += `Definition: ${reusableItem.definition}\n`;
					}

					if (reusableItem.link) {
						text += `Link: ${reusableItem.link}\n`;
					}

					text += '\n-------------------------------\n';
				}
			});
		}

		const filename = `${sanitizeFilename(`toptenlists-${username}`)}.txt`;

		downloadFile(text, filename);
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
					<span className="icon" title="Download all my Top Ten Lists as a text file"><FontAwesomeIcon icon={['fas', 'file-download']} style={{ 'color': COLORS.REGULARTEXT }} size="1x" /></span>
					Download my Top Ten Lists
				</button>
			</div>
		);
	}
}

DownloadMyTopTenListsButton.propTypes = {
	'username': PropTypes.string,
	'myTopTenLists': PropTypes.objectOf(PropTypes.any).isRequired,
	'topLevelTopTenListsOnly': PropTypes.bool.isRequired,
	'myReusableItems': PropTypes.arrayOf(PropTypes.any).isRequired,
};

export default DownloadMyTopTenListsButton;
