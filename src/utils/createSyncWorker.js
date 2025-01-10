const WORKER_INIT_TIME_LIMIT = 500;
const WORKER_POST_TIME_LIMIT = 10000;

// to generate unique id's used for messages to and from web worker
let uid = 1;

/**
 * @param { string } src
 * @param { { transformWorkerSrc?: (str:string) => string, onWorkerMessage?:(...args: any) => Promise<any> } } options
 */
export default (src, options) =>
    new Promise((resolve, reject) => {
        const { transformWorkerSrc = (str) => str, onWorkerMessage = undefined } = options || {};

        // worker source code
        const workerSrc = transformWorkerSrc(`
// posts a message to main
let _uid = 1;
const _post = (cmd, ...args) => new Promise((resolve, reject) => {
    const postId = _uid++;
    
    _message_routes.set(postId, (err, res) => {
        // Received error
        if (err) return reject(err);

        // done!
        resolve(res);
    });

    postMessage(['message', postId, cmd, ...args]);
});

// message routing from worker to 
const _message_routes = new Map();

// Routes hotlist sync commands
let _hotlist_routes;

// Scope sync src
const getId = () => undefined;
const getName = () => undefined;
const getProps = () => undefined;
const insertTodo = () => undefined;
const updateTodo = () => undefined;
const deleteTodo = () => undefined;
{
    ${src}

    // Only export routes
    _hotlist_routes = {
        getId,
        getName,
        getProps,
        insertTodo,
        updateTodo,
        deleteTodo,
    };
}

// Handle replies to messages
const _handleReply = (e) => {
    const [messageType, messageId, err, res] = e.data;

    if (!_message_routes.has(messageId)) return;

    // run reply handler
    _message_routes.get(messageId)(err, res);
    
    // clean up route
    _message_routes.delete(messageId);
}

// Handle messages
const _handleMessage = async (e) => {
    const [messageType, messageId, command, ...args] = e.data;

    let res;
    try {
        res = await _hotlist_routes[command](...args);
    }
    catch(err) {
        postMessage(['reply', messageId, err])
    }

    // return result to main
    postMessage(['reply', messageId, undefined, res]);
}

// Handle incoming messages from main
onmessage = async (e) => {
    const [messageType] = e.data;
    if (messageType === 'message') return _handleMessage(e)
    if (messageType === 'reply') return _handleReply(e)
};

// Let main know we're ready
postMessage('ready');
`);

        // create blob
        const workerBlob = new Blob([workerSrc], {
            type: 'application/javascript',
        });

        // create URL
        const workerURL = URL.createObjectURL(workerBlob);

        // create worker
        const syncWorker = new Worker(workerURL);

        // Clean up sync worker
        const destroy = () => {
            syncWorker.terminate();
            syncWorker.removeEventListener('message', handleMessage);
            URL.revokeObjectURL(workerURL);
        };

        const handleMessage = (e) => {
            // no message routing necessary
            if (!onWorkerMessage) return;

            // check if is our message
            const [messageType, messageId, command, ...args] = e.data;

            if (messageType !== 'message') return;

            // handle message
            onWorkerMessage(command, ...args)
                .then((res) => {
                    syncWorker.postMessage(['reply', messageId, undefined, res]);
                })
                .catch((err) => {
                    syncWorker.postMessage(['reply', messageId, err]);
                });
        };

        syncWorker.addEventListener(
            'message',
            (e) => {
                // Didn't crash on load
                clearTimeout(initTimeoutId);

                // Test if worker returned ready state
                if (e.data !== 'ready')
                    return reject('Failed to create SyncWorker, ready state not received');

                // listen for messages
                syncWorker.addEventListener('message', handleMessage);

                // No ready to receive messages
                resolve({
                    /**
                     * Get connection name
                     * @returns { Promise<string> }
                     */
                    getId: () => post('getId'),

                    /**
                     * Get connection name
                     * @returns { Promise<string> }
                     */
                    getName: () => post('getName'),

                    /**
                     * Get connection props
                     * @returns { Promise<{ [prop:string]: { label: string, value: string } }> }
                     */
                    getProps: () => post('getProps'),

                    /**
                     * Create a new Todo
                     * @param { { [prop:string]: { label: string, value: string } } } props
                     * @param { { text: string, complete?:boolean } } data
                     * @returns { Promise<{ id: string, url?: string}> }
                     */
                    insertTodo: (props, data) => post('insertTodo', props, data),

                    /**
                     * Create a new Todo
                     * @param { { [prop:string]: { label: string, value: string } } } props
                     * @param { string } id
                     * @param { { text: string, complete?:boolean } } data
                     * @returns { Promise<boolean> }
                     */
                    updateTodo: (props, id, data) => post('updateTodo', props, id, data),

                    /**
                     * Remove an existing todo
                     * @param { { [prop:string]: { label: string, value: string } } } props
                     * @param { string } id
                     * @returns { Promise<boolean> }
                     */
                    deleteTodo: (props, id) => post('deleteTodo', props, id),

                    destroy,
                });
            },
            { once: true }
        );

        syncWorker.addEventListener('error', (err) => {
            reject(`Failed to create SyncWorker. ${err.message}`);
        });

        // If ready state not received within x ms exit
        const initTimeoutId = setTimeout(() => {
            destroy();
            reject(`Failed to initialize SyncWorker within ${WORKER_INIT_TIME_LIMIT}ms`);
        }, WORKER_INIT_TIME_LIMIT);

        /**
         * Post a message
         * @param { string } cmd
         * @param  {...any} args
         * @returns { Promise<any> }
         */
        const post = (cmd, ...args) =>
            new Promise((resolve, reject) => {
                // handles worker response
                const handleMessage = (e) => {
                    // check if is our message
                    const [messageType, messageId, err, res] = e.data;

                    if (messageType !== 'reply' || messageId !== postId) return;

                    // clean up
                    clearTimeout(postTimeoutId);

                    syncWorker.removeEventListener('message', handleMessage);

                    if (err) return reject(new Error(`Failed to run "${cmd}", ${err}`));

                    resolve(res);
                };

                syncWorker.addEventListener('message', handleMessage);

                // wait x seconds, if no response, kill worker
                const postTimeoutId = setTimeout(() => {
                    // Worker timed out, maybe due to infinite loop
                    const err = new Error('SyncWorker timed out');

                    // remove listener
                    syncWorker.removeEventListener('message', handleMessage);

                    // Clean up
                    destroy();

                    // We done!
                    reject(err);
                }, WORKER_POST_TIME_LIMIT);

                // so we know if the response is for us
                const postId = uid++;

                syncWorker.postMessage(['message', postId, cmd, ...args]);
            });
    });
