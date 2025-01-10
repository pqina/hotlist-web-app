const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const store = new Map();

const db = {
    insert: (value) => {
        const id = `${Date.now()}${Math.round(Math.random() * 1000)}`;
        store.set(id, value);
        return id;
    },
    update: (id, value) => {
        if (!store.has(id)) throw new Error('Item not found');
        store.set(id, value);
    },
    delete: (id) => {
        if (!store.has(id)) throw new Error('Item not found');
        store.delete(id);
    },
};

/**
 * getId
 * @returns { string } Between 3 and 8 lowercase characters
 */
const getId = () => 'dummy';

/**
 * getName
 * @returns { string } Between 3 and 32 characters
 */
const getName = () => 'Dummy';

/**
 * getProps
 * @returns { { [key:string]: { label:string, value:string } } }
 */
const getProps = () => ({
    delay: {
        label: 'Request delay',
        type: 'text',
        value: 2000,
    },
});

/**
 * Insert todo
 * @param { { [prop:string]: { label: string, value: string } } } props
 * @param { text: string, completed?: boolean } data
 * @returns { Promise<{ id:string, url?: string } | boolean> }
 */
const insertTodo = async (props, data) => {
    console.log('insertTodo', props, data);

    // expected delay
    const { delay } = props;

    // fake busy
    await sleep(delay.value);

    // insert in the db
    const id = db.insert(JSON.stringify(data));

    // no response
    if (!id) throw new Error('Something went wrong');

    // any other problem states should also be thrown as Error

    // return id
    return { id /* url: 'https://website/todo/' */ };
};

/**
 * Update existing todo
 * @param { { [prop:string]: { label: string, value: string } } } props
 * @param { string } id
 * @param { text: string, completed?: boolean } data
 * @returns { Promise<boolean> }
 */
const updateTodo = async (props, id, data) => {
    console.log('updateTodo', props, id, data);

    // expected delay
    const { delay } = props;

    // fake busy
    await sleep(delay.value);

    // update in the db
    try {
        db.update(id, JSON.stringify(data));
    } catch (err) {
        // item not found should return false
        return false;
    }

    // any other problem states should be thrown as Error

    // successfully updated!
    return true;
};

/**
 * Update existing todo
 * @param { { [prop:string]: { label: string, value: string } } } props
 * @param { string } id
 * @returns { Promise<boolean> }
 */
const deleteTodo = async (props, id) => {
    console.log('deleteTodo', props, id);

    // expected delay
    const { delay } = props;

    // fake busy
    await sleep(delay.value);

    // update in the db
    try {
        db.delete(id);
    } catch (err) {
        // item not found should return false
        return false;
    }

    // any other problem states should be thrown as Error

    // successfully removed!
    return true;
};
