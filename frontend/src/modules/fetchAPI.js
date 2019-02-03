// uses fetch to get or post data.
// passes up useful errors to the calling function.
// set useAuth to true for validating logged-in user: token will be sent in header
import store from '../store';
import formatErrorMessages from '../modules/formatErrorMessages';

function getCookie(name) {
	var cookieValue = null;
	if (document.cookie && document.cookie !== '') {
		var cookies = document.cookie.split(';');
		for (var i = 0; i < cookies.length; i++) {
			var cookie = cookies[i].trim();
			//var cookie = jQuery.trim(cookies[i]);
			// Does this cookie string begin with the name we want?
			if (cookie.substring(0, name.length + 1) === (name + '=')) {
				cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
				break;
			}
		}
	}
	return cookieValue;
}

export default function fetchAPI({ url, data, method = 'GET', useAuth = false, useCSRF = false, headers = {} }) {
	if (useAuth) {
		headers.Authorization = `Token ${store.getState().auth.user.token}`;
	}


	if (useCSRF) {
		headers['X-CSRFToken'] = getCookie('csrftoken');
		data = data || new FormData();
		data.append('csrfmiddlewaretoken', getCookie('csrftoken'));
	}

	return fetch(url, { headers, 'method': method, 'body': data })
		.then(response => {
			// fetch returns ok true / false in most situations
			// true is a successful response
			if (response.ok) {
				const contentType = response.headers.get('Content-Type') || '';

				if (contentType.includes('application/json')) {
					return response.json().catch(error => {
						return Promise.reject(new Error('Invalid JSON: ' + error.message));
					});
				}

				if (contentType.includes('text/html')) {
					return response.text().then(html => {
						return {
							'page_type': 'generic',
							'html': html
						};
					}).catch(error => {
						return Promise.reject(new Error('HTML error: ' + error.message));
					});
				}

				return;
			} else {
				// ok == false means some problem to display
				// even though no error was returned
				if (response.status === 404) {
					return Promise.reject(new Error('Page not found: ' + url));
				}

				if (response.status === 500) {
					return Promise.reject(new Error('Internal server error: ' + url));
				}

				return response.json().then(response => {
					// the server rejected the request, e.g. because of a wrong password, we want to display the reason
					// the information is contained in the json()
					// there may be more than one error, so join them into a single string.
					// multiline display would be more elegant but this will do for now and makes all errors consistent (one message string)

					return Promise.reject(new Error(formatErrorMessages(response))
					);
				});
			}
		}).catch(error => {
			// fetch returned an error
			return Promise.reject(new Error(error.message));
		});
};
