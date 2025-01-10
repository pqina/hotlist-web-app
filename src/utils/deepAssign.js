import isObject from './isObject.js';

/**
 * Merges source into target
 * @param { Object } target
 * @param { Object[] } sources
 * @returns { Object } target
 */
const deepAssign = (target, ...sources) => {
    sources.forEach((source) => {
        for (const [key, value] of Object.entries(source)) {
            if (isObject(value)) {
                if (!isObject(target[key])) target[key] = value;
                else deepAssign(target[key], value);
            } else {
                Object.assign(target, { [key]: value });
            }
        }
    });
    return target;
};

export default deepAssign;
