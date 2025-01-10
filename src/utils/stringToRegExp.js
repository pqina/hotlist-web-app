/**
 * @param str { string }
 */
export default (str) => {
    if (!str || str.length < 2 || !str.startsWith('/')) return;
    try {
        const reg = (str.match(/\/(.+)\/[a-z+]*$/) || [])[1];
        const opts = (str.match(/\/([a-z+])$/i) || [])[1];
        if (!reg) return;
        return new RegExp(reg, opts);
    } catch (err) {
        return;
    }
};
