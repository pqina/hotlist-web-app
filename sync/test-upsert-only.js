const storage = {};

const loadStore = (key) => storage[key] || {};
const saveStore = (key, store) => (storage[key] = store);

/**
 * getId
 * @returns { string } Between 3 and 8 lowercase characters
 */
const getId = () => 'test';

/**
 * getName
 * @returns { string } Between 3 and 32 characters
 */
const getName = () => 'Test';

/**
 * getProps
 * @returns { { [key:string]: { label:string, value:string } } }
 */
const getProps = () => ({
    storeKey: {
        label: 'API Key',
        value: '',
    },
});

/**
 * Insert todo or update existing todo
 * @param { { [prop:string]: { label: string, value: string } } } props
 * @param { string|undefined } id
 * @param { text: string, completed?: boolean } data
 * @returns { Promise<{ id:string, url?: string } | boolean> }
 */
const upsertTodo = (props, id, data) => {
    if (!id) {
        console.log('insertTodo:', props, id, data);

        // insert todo
        const { storeKey = 'default' } = props;
        const remoteId = Date.now();
        const store = loadStore(storeKey);
        store[remoteId] = data;
        saveStore(storeKey, store);

        return { id: `${remoteId}`, url: 'https://test/foo/bar/' + remoteId };
    }

    console.log('updateTodo', props, id, data);

    // update todo
    const { storeKey = 'default' } = props;
    const store = loadStore(storeKey);

    // item not found
    if (!store[id]) return false;

    // update todo
    store[id].completed = data.completed;
    saveStore(storeKey, store);

    return true;
};
