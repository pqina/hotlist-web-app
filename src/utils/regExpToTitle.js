export default (str) => str.replace(/\/[a-z]+$/, '').replace(/[^ #A-Za-z0-9.]/g, '');
