import eventMatchesKey from './eventMatchesKey';

/**
 * @param { KeyboardEvent } e
 * @param { string[] } shortcut
 */
export default (e, shortcut) => shortcut.every((key) => eventMatchesKey(e, key));
