import React from 'react';
import { Input } from 'reactstrap';
import { Link } from 'react-router-dom';

const Search = props => {
	let	complete = 'not done';
	if (props.searchComplete) {
		complete = 'Complete';
	}

	let searchResults;
	
	if (props.searchComplete) {
		if (props.searchResults.length === 0) {
			searchResults = <div>{`no results found for ${props.searchTerm}`}</div>;
		} else {
			searchResults = <div className="results">
				{props.searchResults.map((result) => {
					let type = '';
					const url = `/list/${result.slug}`;

					if (result.type === 'List') {
						type = 'List';
					} else if (result.type === 'Item') {
						type = 'Item';
					}
					return (
						<div className="result" key={result.id}>
							<Link to={url}><span className="type">{type}: </span><span className="name">{result.name}</span>
							</Link>
						</div>
					);
				})}
			</div>;
		}
	}

	return(
		<div className="search">
			<Input className="form-control"
				onChange={props.onChange}
				type="text"
				placeholder={props.placeholder}
			/>
			{searchResults}
		</div>
	);
};

export default Search;
