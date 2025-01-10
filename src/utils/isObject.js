/**
 * Tests if value an object and not an array, string, or number
 * @param { any } v
 * @returns { boolean }
 */
export default (v) => v && typeof v === 'object' && !Array.isArray(v);
