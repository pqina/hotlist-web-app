import keyIsModifier from './keyIsModifier';

const modifierEventMap = {
    command: 'metaKey',
    control: 'ctrlKey',
    alt: 'altKey',
    shift: 'shiftKey',
};

/**
 * @param { KeyboardEvent } e
 * @param { string } needle
 */
export default (e, needle) => {
    const { key } = e;

    if (keyIsModifier(needle)) {
        const eventProp = modifierEventMap[needle];
        return eventProp && e[eventProp];
    }

    return key.toLowerCase() === needle;
};
