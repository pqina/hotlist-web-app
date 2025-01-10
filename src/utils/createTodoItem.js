import getUniqueId from './getUniqueId';

/**
 * Creates Todo item
 * @param { { key?: string, value?: string, isDone?: boolean, isNew?: boolean, placeholder?: string, focus?: boolean | { char: number } | { x: number } , remote?: { [key:string]: { id: string | number, url: string|undefined } } } } options
 * @returns { { key: string, value: string, focus: boolean | { char: number } | { x: number }, isDone: boolean, isNew: boolean, placeholder: string, remote: undefined | { [key:string]: { id: string | number, url: string|undefined } } }
 */
export default (options) => {
    const {
        key = getUniqueId(),
        value = '',
        focus = false,
        isDone = false,
        isNew = false,
        placeholder = '',
        remote = undefined,
    } = options || {};

    return {
        key,
        value,
        focus,
        placeholder,
        isDone,
        isNew,
        remote,
    };
};
