/**
 * getId
 * @returns { string } Between 3 and 8 lowercase characters
 */
const getId = () => 'wip';

/**
 * getName
 * @returns { string } Between 3 and 32 characters
 */
const getName = () => 'WIP';

/**
 * getProps
 * @returns { { [key:string]: { label:string, value:string } } }
 */
const getProps = () => ({
    apiKey: {
        label: 'API Key',
        type: 'password',
        value: '',
    },
});

/**
 * Runs GraphQL query
 * @param { { query: any, variables?: any } } body
 * @param { string } apiKey
 * @returns { Promise<any> }
 */
const graphQL = (query, apiKey) => {
    if (!apiKey.length) return;
    return fetch('https://wip.co/graphql', {
        method: 'POST',
        headers: {
            Authorization: `bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
    });
};

/**
 * Converts GraphQL error response in list of error messages
 * @param { { message:string, locations:{ line:number, column: number }[] }[] } errors
 * @returns { string }
 */
const listErrors = (errors) =>
    errors
        .map(
            (error) =>
                `${error.message} at ${error.locations
                    .map(({ line, column }) => `l:${line} c:${column}`)
                    .join(', ')}`
        )
        .join(', ');

/**
 * Insert todo
 * @param { { [prop:string]: { label: string, value: string } } } props
 * @param { text: string, completed?: boolean } data
 * @returns { Promise<{ id:string, url?: string } | boolean> }
 */
const insertTodo = async (props, data) => {
    console.log('insertTodo', props, data);

    // convert data to graphql
    const { text, completed = false } = data;
    const input = `{
        body: ${JSON.stringify(text)},
        completed_at: ${completed ? '"' + new Date().toISOString() + '"' : 'null'},
    }`;

    // insert
    const response = await graphQL(
        `mutation createTodo {
            createTodo(input: ${input}) {
                id
                url
                body
                completed_at
            }
        }`,
        props.apiKey.value
    );

    // no response
    if (!response) throw new Error(`No response`);

    // failed request
    if (!response.ok) throw new Error(`Request failed ${response.status} ${response.statusText}`);

    // received errors
    if (response.json.errors) throw new Error(`Request failed ${response.json.errors.join(', ')}`);

    // return object
    return { id: response.json.data.createTodo.id, url: response.json.data.createTodo.url };
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

    // convert data to graphql
    const { text, completed = false } = data;
    const input = `{
        body: ${JSON.stringify(text)}
    }`;

    const toggleCompleteState = completed
        ? `completeTodo(id: "${id}") { id }`
        : `uncompleteTodo(id: "${id}") { id }`;

    const response = await graphQL(
        `mutation updateTodo {
            updateTodoBody(id: "${id}", input: ${input}) {
                id
            }
            ${toggleCompleteState}
        }`,
        props.apiKey.value
    );

    // no response
    if (!response) throw new Error(`No response`);

    // item not found
    if (response.status === 404) return false;

    // failed request
    if (!response.ok) throw new Error(`Request failed ${response.status} ${response.statusText}`);

    // received errors
    if (response.json.errors) throw new Error(`Request failed ${listErrors(response.json.errors)}`);

    // success!
    return true;
};

/**
 * Delete existing todo
 * @param { { [prop:string]: { label: string, value: string } } } props
 * @param { string } id
 * @returns { Promise<boolean> }
 */
const deleteTodo = async (props, id) => {
    console.log('deleteTodo', props, id);

    // delete request
    const response = await graphQL(
        `mutation deleteTodo {
            deleteTodo(id: "${id}")
        }`,
        props.apiKey.value
    );

    // no response
    if (!response) throw new Error(`No response`);

    // item not found
    if (response.status === 404) return false;

    // failed request
    if (!response.ok) throw new Error(`Request failed ${response.status} ${response.statusText}`);

    // received errors
    if (response.json.errors) throw new Error(`Request failed ${listErrors(response.json.errors)}`);

    // success!
    return true;
};
