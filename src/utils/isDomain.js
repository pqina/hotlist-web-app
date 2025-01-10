/**
 * @param {string} str
 * @returns {boolean}
 */
export default (str) => /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(str);
