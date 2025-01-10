<script>
    import { getContext } from 'svelte';
    import FormRow from '../../components/FormRow.svelte';
    import createSyncWorker from '../../utils/createSyncWorker';
    import getUniqueId from '../../utils/getUniqueId';
    import readFile from '../../utils/readFile';

    // reference to settings store
    const settings = getContext('settings');

    // connection workers
    const connectionWorkers = getContext('connectionWorkers');

    // get options
    const syncWorkerFactoryOptions = getContext('syncWorkerFactoryOptions');

    // connection validators
    /**
     * @type { [string, (fn: any, state?:any) => Promise<any>, { required: boolean }][] }
     */
    const connectionSetupValidators = [
        [
            'getId',
            async (fn) => {
                const id = await fn();
                if (typeof id !== 'string' || id.length < 3 || id.length > 8 || !/[a-z]+/.test(id))
                    throw new Error(
                        `did not return a valid id, needs to be between 3 and 8 lowercase letters`
                    );
                return { id };
            },
            {
                required: true,
            },
        ],
        [
            'getName',
            async (fn) => {
                const name = await fn();

                if (typeof name !== 'string' || name.length < 3 || name.length > 32)
                    throw new Error(`did not return a name between 3 and 32 characters`);

                return { name };
            },
            {
                required: true,
            },
        ],
        [
            'getProps',
            async (fn) => {
                const props = await fn();

                if (!props || typeof props !== 'object')
                    throw new Error(
                        `did not return an object: { myProp: { label: 'MyLabel', value: '' }, ... }`
                    );

                // done!
                return { props };
            },
            {
                required: true,
            },
        ],
    ];

    /**
     * @type { [string, (fn: any, state?:any) => Promise<any>, { required: boolean }][] }
     */
    const connectionTestValidators = [
        [
            'insertTodo',
            async (fn, state) => {
                // insert
                const remote = await fn(state.props, { text: 'Hotlist test item' });

                if (typeof remote !== 'object')
                    throw new Error(
                        `'did not return an object when creating a new todo: { id, url? }`
                    );

                if (!remote.id) throw new Error(`object returned did not have "id" property`);

                if (typeof remote.id !== 'string')
                    throw new Error(`id property on returned object should be of type string`);

                // return
                return { remote };
            },
            {
                required: true,
            },
        ],
        [
            'updateTodo',
            async (fn, state) => {
                // update
                const success = await fn(state.props, state.remote.id, {
                    text: 'Hotlist test item update',
                    completed: true,
                });

                if (typeof success !== 'boolean')
                    throw new Error(`did not return update success response as boolean`);

                if (success !== true) throw new Error(`did not return true for successful update`);

                // try updating with non existing id
                const successShouldFail = await fn(state.props, `${Date.now()}${getUniqueId()}`, {
                    text: 'Hotlist test item update should fail',
                    completed: true,
                });

                if (typeof successShouldFail !== 'boolean')
                    throw new Error(
                        `did not return update success response as boolean when couldn't update`
                    );

                if (successShouldFail !== false)
                    throw new Error(`did not return false for failed update`);
            },
            {
                required: true,
            },
        ],
        [
            'deleteTodo',
            async (fn, state) => {
                // remove item with existing id
                const success = await fn(state.props, state.remote.id);

                if (typeof success !== 'boolean')
                    throw new Error(`did not return success response as boolean`);

                if (success !== true) throw new Error(`did not return true for successful removal`);

                // try removing with non existing id
                const successShouldFail = await fn(state.props, `${Date.now()}${getUniqueId()}`);

                if (typeof successShouldFail !== 'boolean')
                    throw new Error(
                        `did not return success response as boolean when couldn't remove`
                    );

                if (successShouldFail !== false)
                    throw new Error(`did not return false for failed removal`);
            },
            {
                required: false,
            },
        ],
    ];

    // sets up connector settings
    let connectorError;
    const handleSelectFile = async (e) => {
        // reset error
        connectorError = undefined;

        // get file
        const [file] = e.target.files;

        // reset input
        e.target.value = '';

        // Make sure a file was selected
        if (!file) {
            connectorError = 'A JavaScript file must be selected';
            return;
        }

        // make sure is JS file
        if (file.type !== 'text/javascript' && file.type !== 'application/x-javascript') {
            connectorError = 'File needs to be of type JavaScript';
            return;
        }

        // set connection to file source
        let src;
        try {
            src = await readFile(file);
        } catch (err) {
            connectorError = `Failed to read JavaScript file`;
        }

        // connection with this src already loaded
        if ($settings.connections.find((connection) => connection.src === src)) {
            throw new Error(`Plugin already loaded, first disconnect old plugin.`);
        }

        // quick check if all functions are defined
        for (const [functionName, , { required }] of [
            ...connectionSetupValidators,
            ...connectionTestValidators,
        ]) {
            // test if defined
            if (required && !src.includes(functionName)) {
                connectorError = `Function '${functionName}' is missing`;
                return;
            }
        }

        // create worker to test functions and infinite loops
        let syncWorker;
        try {
            syncWorker = await createSyncWorker(src, syncWorkerFactoryOptions);

            // thorough check if all functions are working
            const state = {};
            for (const [functionName, functionValidator] of connectionSetupValidators) {
                // try
                try {
                    const fn = syncWorker[functionName];
                    const res = await functionValidator(fn, state);
                    Object.assign(state, res);
                } catch (err) {
                    throw new Error(`${functionName}(): ${err}`);
                }
            }

            // test if already loaded this connection
            if ($settings.connections.find((connection) => connection.id === state.id)) {
                throw new Error(
                    `A plugin with the same id "${state.id}" is already loaded, first disconnect this plugin`
                );
            }

            // clean up worker
            syncWorker.destroy();
            syncWorker = undefined;

            // try to add
            const connection = {
                // used to set up the worker
                src,

                // for sync view
                id: state.id,
                name: state.name,
                props: { ...state.props },
            };

            // add connection
            $settings.connections = [...$settings.connections, connection];
        } catch (err) {
            connectorError = err;
            return;
        }
    };

    /**
     * @param {string} connectionId
     */
    const handleDisconnect = (connectionId) => {
        // have to actually disconnect
        connectionWorkers.update((syncWorkers) => {
            const syncWorker = syncWorkers[connectionId];
            syncWorker.destroy();
            delete syncWorkers[connectionId];
            return syncWorkers;
        });

        // remove connection from settings
        $settings.connections = $settings.connections.filter(
            (connection) => connection.id !== connectionId
        );
    };

    /**
     * @param {string} connectionId
     */
    let validationStatusTimeout;
    let validationProgress = '';
    let isValidating = false;

    const updateProgress = () => (validationProgress += '.');

    const handleTest = async (connectionId) => {
        validationProgress = '';

        isValidating = true;

        clearTimeout(validationStatusTimeout);

        let validationStatus;

        const connection = $settings.connections.find(
            (connection) => connection.id === connectionId
        );

        const { id, name, props, src } = connection;

        // test if all props have values
        const propsValid = Object.entries(props).every(([key, state]) => {
            updateProgress();

            return (
                (typeof state.value === 'string' && state.value.length) ||
                typeof state.value === 'number'
            );
        });

        if (!propsValid) {
            validationStatus = 'Not all required fields have a value';
        }

        if (!validationStatus) {
            // create worker to test functions and infinite loops
            let syncWorker;
            try {
                updateProgress();

                syncWorker = await createSyncWorker(src, syncWorkerFactoryOptions);

                updateProgress();

                // thorough check if all functions are working
                const state = { id, name, props };

                for (const [functionName, functionValidator] of connectionTestValidators) {
                    // skip optional functions
                    if (!src.includes(functionName)) continue;

                    updateProgress();

                    try {
                        const fn = syncWorker[functionName];
                        const res = await functionValidator(fn, state);
                        Object.assign(state, res);
                    } catch (err) {
                        throw new Error(`${functionName}(): ${err}`);
                    }
                }

                // clean up worker
                syncWorker.destroy();
                syncWorker = undefined;
            } catch (err) {
                validationStatus = err.message;
            }
        }

        // done validating
        isValidating = false;

        // validation result as bool
        const isValid = !validationStatus;

        // update connection status
        updateConnectionStatus(id, {
            success: isValid,
            message: isValid ? connection.name + ' validation successful' : validationStatus,
        });

        // clear status message after 2 seconds
        if (isValid) {
            validationStatusTimeout = setTimeout(() => {
                updateConnectionStatus(id, {
                    success: true,
                    message: undefined,
                });
                validationStatusTimeout = undefined;
            }, 4000);
        }
    };

    /**
     *
     * @param connectionId { string }
     * @param newValidationStatus { undefined | { success: boolean, message: string | undefined } }
     */
    const updateConnectionStatus = (connectionId, newValidationStatus) => {
        $settings.connections = $settings.connections.map((connection) => {
            if (connection.id === connectionId) {
                return {
                    ...connection,
                    validationStatus: newValidationStatus,
                };
            }
            return connection;
        });
    };

    /**
     * @param connectionId { string }
     * @param prop { string }
     * @param value { string }
     */
    const handleUpdateConnectionProp = (connectionId, prop, value) => {
        $settings.connections = $settings.connections.map((connection) => {
            if (connection.id === connectionId) {
                const props = {
                    ...connection.props,
                    [prop]: { ...connection.props[prop], value },
                };
                return {
                    ...connection,
                    props,
                };
            }

            return connection;
        });
    };
</script>

{#each $settings.connections as connection}
    <FormRow borderPosition="none" paddingBottom="none">
        <fieldset disabled={isValidating}>
            <legend>{connection.name}</legend>
            <div>
                <div class="buttons">
                    {#if !isValidating && !validationStatusTimeout && !(connection.validationStatus && connection.validationStatus.success)}
                        <button
                            type="button"
                            title="Validate {connection.name}"
                            on:click={(e) => {
                                e.stopPropagation();
                                handleTest(connection.id);
                            }}
                        >
                            Validate
                        </button>
                    {/if}
                    <button
                        disabled={isValidating}
                        type="button"
                        title="Disconnect from {connection.name}"
                        on:click={(e) => {
                            e.stopPropagation();
                            handleDisconnect(connection.id);
                        }}
                    >
                        Disconnect
                    </button>
                </div>

                <ul>
                    {#each Object.entries(connection.props || {}) as [key, { label, value, type, required = true }]}
                        <li>
                            <label for={`connection-props-${key}`}>{label}</label>
                            <input
                                id={`connection-props-${key}`}
                                type={type || 'text'}
                                {value}
                                {required}
                                on:input={(e) =>
                                    handleUpdateConnectionProp(
                                        connection.id,
                                        key,
                                        /** @type { HTMLInputElement }*/ (e.target).value
                                    )}
                            />
                        </li>
                    {/each}
                </ul>

                {#if isValidating}
                    <pre class="busy">Validating {connection.name} plugin{validationProgress}</pre>
                {:else if connection.validationStatus && connection.validationStatus.message}
                    <pre class={connection.validationStatus.success ? 'success' : 'error'}>
                        {connection.validationStatus.message}
                    </pre>
                {/if}
            </div>
        </fieldset>
    </FormRow>
{/each}
{#if $settings.connections.length === 0}
    <div class="droparea">
        <span>Drop plugin script here, or <label for="connection">click to browse</label></span>
        <input id="connection" type="file" on:change={handleSelectFile} />
    </div>
{/if}
{#if connectorError}<pre class="error">{connectorError}</pre>{/if}

<style>
    fieldset,
    legend {
        margin: 0;
        padding: 0;
    }

    fieldset {
        padding-top: 30px;
        border: 0;
        position: relative;
    }

    input {
        color: rgb(var(--color-text));
    }

    pre {
        font-family: 'Input Mono', Monaco, Consolas, Lucida Console, Liberation Mono, monospace;
        font-size: 10px;
        white-space: normal;
        padding: 5px 10px;
        line-height: 20px;
        border-radius: 4px;
        margin: 15px 0 0 0;
        color: var(--status-color);
        background-color: var(--status-color-bright);
    }

    pre.busy {
        --status-color: rgba(var(--color-text), 0.5);
        --status-color-bright: rgba(0, 0, 0, 0);
        box-shadow: 0 0 0 1px var(--status-color);
    }

    pre.error {
        --status-color: rgb(var(--color-error));
        --status-color-bright: rgb(var(--color-error-bright));
    }

    pre.success {
        --status-color: rgb(var(--color-success));
        --status-color-bright: rgb(var(--color-success-bright));
    }

    :global(.Hotlist:not([data-theme='light']) pre:not(.busy)) {
        background-color: transparent;
        color: var(--status-color-bright);
        box-shadow: 0 0 0 1px var(--status-color-bright);
    }

    legend,
    label {
        color: rgb(var(--color-text));
        cursor: pointer;
        font-size: calc(var(--font-size) * 1px);
        transition: color var(--theme-transition);
    }

    legend {
        position: absolute;
        top: 0;
        font-weight: 700;
    }

    .buttons {
        position: absolute;
        right: 0;
        top: 0;
    }

    .buttons > * {
        margin-left: 10px;
    }

    button {
        background: none;
        padding: 0;
        margin: 0;
        border: 0;
        color: rgb(var(--color-text));
        cursor: pointer;
        padding: 6px 14px;
        margin: 0;
        border-radius: 99px;
        font-size: 12px;
        cursor: pointer;
        border: 0;
        color: rgb(var(--color-text));
        box-shadow: inset 0 0 0 1px rgba(var(--color-text), calc(var(--color-strength) * 0.05));
        background-color: rgba(var(--color-text), calc(var(--color-strength) * 0.05));
        transition: background-color var(--theme-transition), color var(--theme-transition);
    }

    button[disabled] {
        opacity: 0.5;
        cursor: wait;
    }

    input[type='email'],
    input[type='password'],
    input[type='text'] {
        --border-color: rgba(var(--color-text), calc(var(--color-strength) * 0.1));
        --border-width: 1px;
        -webkit-appearance: none;
        appearance: none;
        font-size: calc(var(--font-size) * 1px);
        font-family: inherit;
        font-weight: 400;
        margin: 0;
        padding: 5px;
        width: auto;
        box-shadow: 0 0 0 var(--border-width) var(--border-color);
        border: 0;
        border-radius: 4px;
        color: rgb(var(--color-text));
        outline: none;
        background-color: transparent;
        transition: color var(--theme-transition), box-shadow var(--theme-transition);
    }

    input[type='email']:focus,
    input[type='password']:focus,
    input[type='text']:focus {
        --border-color: rgb(var(--color-text));
        --border-width: 2px;
    }

    ul,
    li {
        margin: 0;
        padding: 0;
    }

    li {
        display: flex;
    }

    li label {
        flex: 0.35;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    li input {
        flex: 0.65;
    }

    li + li {
        margin-top: 15px;
    }

    ul {
        list-style: none;
    }

    ul {
        margin-top: 10px;
    }

    /* droparea */
    .droparea {
        margin: 0 -16px -16px;
        padding: 32px 0;
        border: 2px;
        text-align: center;
        position: relative;
    }

    .droparea span {
        pointer-events: none;
        color: rgba(var(--color-text), 0.75);
        font-size: calc(var(--font-size) * 1px);
        transition: color var(--theme-transition);
    }

    .droparea label {
        text-decoration: underline;
        text-decoration-color: rgba(var(--color-text), 0.25);
        text-decoration-thickness: 2px;
    }

    .droparea input {
        opacity: 0;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        cursor: pointer;
    }
</style>
