import { ajax } from './postDcloudServer.js';

/**
 *
 * @param {string} url AI_UPDATE_FEEDBACK_URL
 * @param {{ uni_ai_feedback_id: string, comment: string, status: boolean|string }} payload
 *
 * @returns {Promise<boolean>}
 */
export function sendFeedback(url, payload) {
	const data = {
		uni_ai_feedback_id: payload.uni_ai_feedback_id,
		comment: payload.comment,
		status: payload.status, // true: like, false: dislike, '': neutral
	};
	return ajax(url, 'post', data)
		.then(response => {
			if (response.errorCode === 0) {
				return true;
			} else {
				console.error('sendFeedback response error:', response.errorMsg);
				return false;
			}
		})
		.catch(error => {
			console.error('sendFeedback error:', error);
			return false;
		});
}
