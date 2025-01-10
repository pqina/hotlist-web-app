/**
 * @param {string} str
 * @returns {boolean}
 */
export default (str) => {
    if (!str || !str.length) return false;

    let url;

    try {
        url = new URL(str);
    } catch (err) {
        return false;
    }

    return url.protocol === 'http:' || url.protocol === 'https:';
};
