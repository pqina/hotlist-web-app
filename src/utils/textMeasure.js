let canvas;

const cache = new Map();

const measureWidth = (text, font) => {
    // no text no width
    if (!text || text.length === 0) return 0;

    // no measure element yet
    if (!canvas) canvas = document.createElement('canvas');

    // so we can store and restore from cache
    const uid = font + text;

    // return cached width
    if (cache.has(uid)) return cache.get(uid);

    // measure the size
    const context = canvas.getContext('2d');
    context.font = font;
    const width = context.measureText(text).width;

    // store for later time
    cache.set(uid, width);

    return width;
};

const FONT_STYLES = [
    ['font-weight', 'normal'],
    ['font-size', '16px'],
    ['font-family', 'Times New Roman'],
];

const getElementFontStyles = (element) => {
    return FONT_STYLES.map(
        ([prop, defaultValue]) =>
            window.getComputedStyle(element).getPropertyValue(prop) || defaultValue
    ).join(' ');
};

/**
 * @param { HTMLInputElement } element
 * @returns number
 */
export const getCaretPosition = (element) => {
    // get value
    const { value, selectionEnd } = element;

    // get relevant string
    const str = value.substring(0, selectionEnd);

    // calculate width of string
    return measureWidth(str, getElementFontStyles(element));
};

/**
 * @param { HTMLInputElement } element
 * @param { number } position
 * @returns void
 */
export const getCaretIndex = (element, position) => {
    // first index
    if (position === 0) return 0;

    // get value
    const { value } = element;

    // get styles
    const styles = getElementFontStyles(element);

    // calculate position
    let str = '';
    let widthPrev;
    for (let i = 0; i < value.length; i++) {
        str += value[i];
        const width = measureWidth(str, styles);

        if (width <= position) {
            widthPrev = width;
            continue;
        }

        if (width >= position) {
            // determine if previous closer or this one closer
            const distPrev = Math.abs(position - widthPrev);
            const distNow = Math.abs(position - width);
            if (distPrev < distNow) return str.length - 1;
            return str.length;
        }
    }

    return str.length;
};
