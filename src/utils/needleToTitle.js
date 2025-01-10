import regExpToTitle from './regExpToTitle';
import stringToRegExp from './stringToRegExp';

/**
 * @param str {string}
 */
export default (str) => {
    if (stringToRegExp(str)) return regExpToTitle(str);
    return str.split(',').shift().trim();
};
