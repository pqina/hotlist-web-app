const FR_TYPE_MAP = {
    arraybuffer: 'readAsArrayBuffer',
    text: 'readAsText',
    binary: 'readAsBinaryString',
    dataurl: 'readAsDataURL',
};

export default (file, options) =>
    new Promise((resolve, reject) => {
        const { type = 'text' } = options || {};

        if (!FR_TYPE_MAP[type]) return reject('Invalid type');

        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr[FR_TYPE_MAP[type]](file);
    });
