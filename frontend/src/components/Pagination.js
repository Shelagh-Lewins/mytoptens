import React from 'react';
import PropTypes from 'prop-types';
// adapted from http://jasonwatmore.com/post/2017/03/14/react-pagination-example-with-logic-like-google
// major changes to render only pagination controls, not data
// replaced <a> with <button> for accessibility
 
class Pagination extends React.Component {
	constructor(props) {
		super(props);
		this.state = { 'pager': {} };
	}
 
	componentDidMount() {
		// set page if items array isn't empty
		if (this.props.count) {
			this.setPage(this.props.initialPage);
		}
	}
 
	componentDidUpdate(prevProps, prevState) {
		console.log('Pagination update');
		console.log('prevProps count ', prevProps.count);
		console.log('props count ', this.props.count);
		// reset page if items array has changed
		if (this.props.count !== prevProps.count) {
			this.setPage(this.props.initialPage);
		}
	}
 
	setPage(pageNumber) {
		var { count, pageSize } = this.props;
		var pager = this.state.pager;
 

		// get new pager object for specified page
		pager = this.getPager(count, pageNumber, pageSize);

		if (pageNumber < 1 || pageNumber > pager.totalPages) {
			return;
		}
		console.log('setPage. count ', count);
		console.log('pager.totalPages ', pager.totalPages);

		pageNumber = Math.min(pageNumber, pager.totalPages);

		console.log('pageNumber after ', pageNumber);
 
		// update state
		this.setState({ 'pager': pager });
 
		this.props.onChangePage(pageNumber);
	}
 
	getPager(totalItems, currentPage, pageSize) {
		// default to first page
		currentPage = currentPage || 1;
 
		// default page size is 10
		pageSize = pageSize || 10;
 
		// calculate total pages
		var totalPages = Math.ceil(totalItems / pageSize);
 
		var startPage, endPage;
		if (totalPages <= 10) {
			// less than 10 total pages so show all
			startPage = 1;
			endPage = totalPages;
		} else {
			// more than 10 total pages so calculate start and end pages
			if (currentPage <= 6) {
				startPage = 1;
				endPage = 10;
			} else if (currentPage + 4 >= totalPages) {
				startPage = totalPages - 9;
				endPage = totalPages;
			} else {
				startPage = currentPage - 5;
				endPage = currentPage + 4;
			}
		}
 
		// calculate start and end item indexes
		var startIndex = (currentPage - 1) * pageSize;
		var endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);
 
		// create an array of pages to ng-repeat in the pager control
		var pages = [...Array((endPage + 1) - startPage).keys()].map(i => startPage + i);
 
		// return object with all pager properties required by the view
		return {
			'totalItems': totalItems,
			'currentPage': currentPage,
			'pageSize': pageSize,
			'totalPages': totalPages,
			'startPage': startPage,
			'endPage': endPage,
			'startIndex': startIndex,
			'endIndex': endIndex,
			'pages': pages
		};
	}
 
	render() {
		var pager = this.state.pager;
 
		if (!pager.pages || pager.pages.length <= 1) {
			// don't display pager if there is only 1 page
			return null;
		}
 
		return (
			<ul className="pagination">
				<li className={pager.currentPage === 1 ? 'disabled' : ''}>
					<button type="button" className="btn pagination first" onClick={() => this.setPage(1)}>First</button>
				</li>
				<li className={pager.currentPage === 1 ? 'disabled' : ''}>
					<button type="button" className="btn pagination previous" onClick={() => this.setPage(pager.currentPage - 1)}>Previous</button>
				</li>
				{pager.pages.map((page, index) =>
					<li key={index} className={pager.currentPage === page ? 'active' : ''}>
						<button type="button" className="btn pagination page" onClick={() => this.setPage(page)}>{page}</button>
					</li>
				)}
				<li className={pager.currentPage === pager.totalPages ? 'disabled' : ''}>
					<button type="button" className="btn pagination next" onClick={() => this.setPage(pager.currentPage + 1)}>Next</button>
				</li>
				<li className={pager.currentPage === pager.totalPages ? 'disabled' : ''}>
					<button type="button" className="btn pagination last" onClick={() => this.setPage(pager.totalPages)}>Last</button>
				</li>
			</ul>
		);
	}
}

Pagination.propTypes = {
	'count': PropTypes.number,
	'onChangePage': PropTypes.func.isRequired,
	'initialPage': PropTypes.number,
	'pageSize': PropTypes.number
};

Pagination.defaultProps = {
	'count': 0,
	'initialPage': 1,
	'pageSize': 10
};

export default Pagination;
