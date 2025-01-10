/**
 * @param {string} url
 * @returns {string}
 */
export default (url) => (url.includes('://') ? url : 'https://' + url);
