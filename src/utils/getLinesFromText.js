/**
 * @param text {string}
 */
export default (text) =>
    text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
