import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Input } from 'reactstrap';
import { Link } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { COLORS } from '../constants';

import './Search.scss';

class Search extends Component {
	constructor(props) {
		super(props);
		this.state = {
			'showDropdown': false,
		};

		this.closeDropdown = this.closeDropdown.bind(this);
		this.onFocus = this.onFocus.bind(this);
	}

	componentDidMount() {
		document.addEventListener('click', this.handleClick, false);
	}

	componentWillUnmount() {
		document.removeEventListener('click', this.handleClick, false);
	}

	onFocus() {
		this.setState({
			'showDropdown': true,
		});
	}

	handleClick = (e) => {
		// clicked inside component
		if (this.node.contains(e.target)) {
			return;
		}

		// clicked outside component
		this.closeDropdown();
	}

	closeDropdown() {
		this.setState({
			'showDropdown': false,
		});
	}

	render() {
		const {
			onChange,
			placeholder,
			searchComplete,
			searchResults,
			searchTerm,
		} = this.props;
		const { showDropdown } = this.state;

		let searchResultsElm;

		if (searchComplete) {
			if (searchResults.length === 0) {
				searchResultsElm = <div className="hint">{`no results found for ${searchTerm}`}</div>;
			} else {
				searchResultsElm = (
					<div className="results">
						<ul>
							{searchResults.map((result) => {
								let color;
								let detail;
								let iconName;
								let icon;
								let title;
								let url;

								switch (result.type) {
									case 'TopTenList':
										icon = 'list-ol';
										color = COLORS.TOPTENLIST;
										title = 'Top Ten List';
										url = `/toptenlist/${result.id}`;
										detail = (
											<span className="toptenlist detail"><FontAwesomeIcon icon={['fas', 'user']} style={{ 'color': COLORS.SECONDARYTEXT }} size="1x" />{result.created_by_username}</span>
										);
										break;

									case 'TopTenItem':
										icon = 'sticky-note';
										color = COLORS.TOPTENITEM;
										title = 'Top Ten Item';
										url = `/toptenlist/${result.topTenList_id}`;

										detail = (
											<React.Fragment>
												<span className="toptenitem detail"><FontAwesomeIcon icon={['fas', 'user']} style={{ 'color': COLORS.SECONDARYTEXT }} size="1x" />{result.created_by_username}</span>
												{result.description
												&& <span className="detail">{result.description}</span>}
											</React.Fragment>
										);
										break;

									case 'ReusableItem':
										icon = 'clone';
										color = COLORS.REUSABLEITEM;
										title = 'Reusable Item';
										url = `/reusableitem/${result.id}`;
										iconName = result.is_public ? 'lock-open' : 'lock';

										detail = (result.definition
											&& <span className="reusableitem detail"><FontAwesomeIcon icon={['fas', iconName]} style={{ 'color': COLORS.REGULARTEXT }} size="1x" />{result.definition}</span>
										);
										break;

									default:
										break;
								}

								return (
									<li className="result" key={result.id}>
										<Link to={url} onClick={this.closeDropdown}><span className="name"><span className="icon" title={title}><FontAwesomeIcon icon={['fas', icon]} style={{ 'color': color }} size="1x" /></span>{result.name}</span>
											{detail}
										</Link>
									</li>
								);
							})}
						</ul>
					</div>
				);
			}
		}

		return (
			<div className="search" ref={node => this.node = node}>
				<Input
					className="form-control"
					onChange={onChange}
					onFocus={this.onFocus}
					type="text"
					placeholder={placeholder}
				/>
				{showDropdown && searchResultsElm}
			</div>
		);
	}
}

Search.propTypes = {
	'searchComplete': PropTypes.bool.isRequired,
	'onChange': PropTypes.func.isRequired,
	'placeholder': PropTypes.string.isRequired,
	'searchResults': PropTypes.arrayOf(PropTypes.any).isRequired,
	'searchTerm': PropTypes.string.isRequired,
};

export default Search;
