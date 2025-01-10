<svelte:options accessors={true} />

<script>
    import { writable } from 'svelte/store';
    import { createEventDispatcher, getContext, setContext } from 'svelte';
    import TodoList from './pages/TodoList.svelte';
    import Settings from './pages/Settings.svelte';
    import createTodoItem from './utils/createTodoItem';
    import mediaQueryStore from './utils/mediaQueryStore';
    import needleToTitle from './utils/needleToTitle';
    import stringToRegExp from './utils/stringToRegExp';
    import arrayEqual from './utils/arrayEqual';
    import isNumber from './utils/isNumber';
    import Panel from './components/Panel.svelte';
    import createSyncWorker from './utils/createSyncWorker';
    import deepAssign from './utils/deepAssign';

    // initial items
    export let items = undefined;

    // options
    export let settings = {};

    // state
    export let visible = true;
    export let enableAnimations = true;
    export let activePage = 'todolist';

    export let transformSyncSrc = undefined;
    export let onSyncMessage = undefined;

    // root element
    let root;

    // routes events to parent
    const dispatch = createEventDispatcher();

    // settings
    const defaultSettings = {
        theme: 'auto',
        itemPlaceholders: [],
        itemCompleteAction: 'none',
        itemLimit: 8,
        itemTags: [],
        itemGroupByTag: false,
        itemTagsColorPalette: [
            'red',
            'orange',
            'yellow',
            'green',
            'aqua',
            'blue',
            'purple',
            'fuchsia',
        ],
        shortcutToggleHotlist: [],
        shortcutMoveItemUp: ['alt', 'arrowup'],
        shortcutMoveItemDown: ['alt', 'arrowdown'],
        shortcutToggleItemDone: ['command', 'enter'],
        shortcutRemoveItem: ['command', 'backspace'],
        shortcutSyncItem: ['command', 's'],
        connections: [],
    };
    const currentSettings = writable();
    setContext('settings', currentSettings);
    $: currentSettings.set({ ...defaultSettings, ...settings });

    // document visibility
    const documentIsVisible = writable();
    const syncDocumentVisibility = () => documentIsVisible.set(!document.hidden);
    document.addEventListener('visibilitychange', syncDocumentVisibility);
    syncDocumentVisibility();

    // system animation preference
    const prefersReducedMotion = mediaQueryStore('(prefers-reduced-motion)');

    // system theme preference
    const prefersDarkMode = mediaQueryStore('(prefers-color-scheme:dark)');

    // app ready state
    const isAnimated = writable(enableAnimations);
    $: isAnimated.set(enableAnimations && !$prefersReducedMotion && $documentIsVisible);
    setContext('enableAnimations', isAnimated);

    // app theme
    const activeTheme = writable();
    $: activeTheme.set(
        $currentSettings.theme === 'auto'
            ? $prefersDarkMode
                ? 'dark'
                : 'light'
            : $currentSettings.theme
    );
    // styles
    const appCustomProperties = [
        // pages
        '--color-text',
        '--color-background',
        '--page-padding',
        '--page-shadow-size',
        '--page-shadow-color',
        '--page-border-radius',

        // components
        '--checkbox-size',
    ];

    // App style properties
    const styles = writable({});
    const parseStyles = (styles) =>
        appCustomProperties.reduce((res, prop) => {
            const value = styles.getPropertyValue(prop).trim();
            res[prop] = /[0-9]+/.test(value) ? parseInt(value) : value;
            return res;
        }, {});
    $: elementComputedStyles = root && window.getComputedStyle(root);
    $: elementComputedStyles && styles.set(parseStyles(elementComputedStyles));
    setContext('styles', styles);

    const flattenTodo = (item) => ({
        value: item.value,
        isDone: item.isDone,
        remote: Object.entries(item.remote || {}).reduce((res, [key, entry]) => {
            const { busy, ...props } = entry;
            res[key] = props;
            return res;
        }, {}),
    });

    // Public API
    export const getItems = () => todoItems.filter(Boolean).map(flattenTodo);

    export const getState = () => ({
        // current items
        items: getItems().filter((item) => item.value.length),
        // current settings
        settings: { ...$currentSettings },
    });
    export const isHidden = () => elementComputedStyles.opacity === '0';
    //#region Helper functions

    // todo item creator
    let placeholderIndex = 0;
    /**
     * @param {{char:number} | {x:number} | boolean} focus
     * @param {string} placeholder
     */
    const createEmptyTodoItem = (focus = false, placeholder = '') => {
        placeholderIndex =
            placeholderIndex + 1 > $currentSettings.itemPlaceholders.length - 1
                ? 0
                : placeholderIndex + 1;
        placeholder = $currentSettings.itemPlaceholders[placeholderIndex] || placeholder;
        return createTodoItem({ focus, placeholder, isNew: true });
    };

    /**
     * @param key {string}
     */
    const getItemByKey = (key) => todoItems.find((item) => item.key === key);

    /**
     * @param key {string}
     */
    const getItemIndexByKey = (key) => todoItems.findIndex((item) => item.key === key);

    /**
     * @param tag { { needle: string, title?: string } }
     */
    const getTagTitle = ({ needle, title }) => {
        if (title && title.length) return title;
        return needleToTitle(needle);
    };

    const hasRemote = (todoItem) => {
        if (!todoItem.remote) return false;
        return !!Object.values(todoItem.remote).find((remoteTodo) => {
            return remoteTodo.id !== undefined;
        });
    };

    //#endregion

    // initial app state
    let todoItems = [];
    const prepareInitialTodoItems = (items = []) => {
        // cleaned up empty items
        const newItemsClean = items.filter(Boolean).filter((item) => item.value.length);

        // no items added? return empty todo item
        if (!newItemsClean.length) {
            todoItems = [createEmptyTodoItem(true, $currentSettings.itemPlaceholders[0])];
            return;
        }

        // existing items
        const relevantTodoItems = todoItems.filter((item) => item.value.length);

        // items were added, we don't have any relevant items yet, let's create a new list
        if (!relevantTodoItems.length) {
            todoItems = newItemsClean.map(({ value, isDone, remote }, index) =>
                createTodoItem({ value, focus: index === newItemsClean.length - 1, isDone, remote })
            );
            return;
        }

        // items were added and we already have items, so we need to merge them
        const merge = [];
        for (const item of newItemsClean) {
            const existingItem = todoItems.find(
                (todoItem) =>
                    todoItem.value === item.value &&
                    !merge.some((pushedItem) => pushedItem === todoItem)
            );
            if (existingItem) {
                // if is existing item, update
                existingItem.isDone = item.isDone;
                existingItem.focus = item.focus;
                existingItem.focussed = item.focussed;

                // remember we updated this item
                merge.push(existingItem);
            } else {
                // create new todo item
                merge.push(
                    createTodoItem({ value: item.value, focus: false, isDone: item.isDone })
                );
            }
        }

        todoItems = merge;
    };

    // so we know when limit reached
    $: atMaxItems = todoItems.length >= $currentSettings.itemLimit;

    // sync when new items set to items prop
    $: prepareInitialTodoItems(items);

    // sync list state, we remember previously synced todo items so we don't sync when is same
    let syncedState;
    const syncState = (state) => {
        let stateStr = JSON.stringify(state);
        if (syncedState === stateStr) return;
        syncedState = stateStr;
        dispatch('sync', state);
    };

    let currentItems = [];
    $: if (todoItems) {
        const todoItemsClean = getItems();
        if (JSON.stringify(currentItems) !== JSON.stringify(todoItemsClean)) {
            currentItems = todoItemsClean;
        }
    }

    $: syncState({
        // current items
        items: currentItems,

        // current settings
        settings: $currentSettings,
    });

    // page change
    $: dispatch('page', activePage);

    // dispatch current size when updated and when toggling visibility
    let pageHeight;
    $: if (isNumber(pageHeight) && visible) {
        // dispatch next frame so can be listened to the resize event on the app instance
        requestAnimationFrame(() => dispatch('resize', { height: pageHeight }));
    }

    const handleResize = (e) => (pageHeight = e.detail.height);

    // focus first element in active page
    let itemFocus;
    const restoreFocus = () => {
        // no items to focus
        if (todoItems.length <= 1) return;

        // no item to focus on show
        if (!itemFocus) {
            itemFocus = {
                key: todoItems[0].key,
                focus: true,
            };
        }

        // focus first element on page
        todoItems = todoItems.map((item) => {
            if (item.key === itemFocus.key) {
                return {
                    ...item,
                    focus: itemFocus.focus,
                };
            }
            return item;
        });
    };
    const storeFocus = () => {
        // store last focussed item
        const el = document.activeElement;
        if (el.nodeName !== 'INPUT') return (itemFocus = undefined);

        const elementListItem = /** @type {HTMLElement}*/ (el.closest('li[data-key]'));
        if (!elementListItem) return;

        itemFocus = {
            key: elementListItem.dataset.key,
            focus: { char: /** @type {HTMLInputElement}*/ (el).selectionStart },
        };
    };
    $: if (root && visible) restoreFocus();
    $: if (root && !visible) storeFocus();

    const handleBlurItem = (e) => {
        itemFocus = e.detail;
    };

    //#region event handlers
    const handleOpenURL = (e) => dispatch('url', { url: e.detail.url });

    const handlePasteLines = (e) => {
        const { key, lines } = e.detail;

        const newItems = lines.map((line, index) => {
            const shouldFocus = index === lines.length - 1;

            // current value
            let value = /^(?:-[\s]+)?\[(?:v|x| )\]/.test(line)
                ? (line.match(/^(?:-\s+)?\[(?:v|x| )\] (.+)/) || ['', line])[1]
                : line;

            // checked state
            const isDone = /^(?:-[\s]+)?\[(?:v|x)\]/.test(line);

            // handle remote state
            let remoteMatch = line.match(/ \[([A-Z0-9 -]+)\]\((.+) "(.+) @ ([a-z]+)"\)$/);
            let remote;

            // try id only
            if (!remoteMatch) {
                const remoteIdMatch = line.match(/ "(.+) @ ([a-z]+)"$/);
                if (remoteIdMatch) {
                    remoteMatch = [
                        remoteIdMatch[0],
                        undefined,
                        undefined,
                        remoteIdMatch[1],
                        remoteIdMatch[2],
                    ];
                }
            }

            if (remoteMatch) {
                const [match, , url, id, connectionId] = remoteMatch;

                // remove remote url from value
                value = value.substring(0, value.length - match.length);

                // set new remote
                remote = {
                    [connectionId]: {
                        id,
                        url,
                    },
                };
            }

            return createTodoItem({ value, focus: shouldFocus, isDone, remote });
        });

        // update from key position
        if (key) {
            const index = getItemIndexByKey(key);

            const maxNewItems =
                $currentSettings.itemLimit -
                (todoItems.length - (todoItems[index].value.length ? 0 : 1));

            // limit new items to the amount of room we have
            newItems.length = Math.min(maxNewItems, newItems.length);

            todoItems.splice(index + (todoItems[index].value.length ? 1 : 0), 1, ...newItems);

            todoItems.length = Math.min(todoItems.length, $currentSettings.itemLimit);

            todoItems = todoItems;
        }
        // just replace
        else {
            todoItems = newItems;
        }
    };

    const handleInsertBefore = (e) => {
        const { key } = e.detail;
        const index = getItemIndexByKey(key);
        const newItems = [
            ...todoItems.slice(0, index),
            createEmptyTodoItem(),
            ...todoItems.slice(index),
        ];
        todoItems = newItems;
    };

    const handleSplit = (e) => {
        const { key, selectionStart } = e.detail;

        // can't exceed max
        if (atMaxItems) return;

        const item = getItemByKey(key);
        const index = getItemIndexByKey(key);
        const valueA = item.value.substring(0, selectionStart).trim();
        const valueB = item.value.substring(selectionStart).trim();

        const itemThatWasSplit = createTodoItem({
            value: valueA,
            isDone: item.isDone,
            focus: false,
            remote: item.remote,
        });

        const itemThatSplitOf = createTodoItem({
            value: valueB,
            isDone: item.isDone,
            isNew: true,
            focus: { char: 0 },
        });

        todoItems = [
            // before
            ...todoItems.slice(0, index),

            // item that was split
            itemThatWasSplit,

            // item that was split off
            itemThatSplitOf,

            // rest
            ...todoItems.slice(index + 1),
        ];

        // async push changes to remote (if has remote)
        hasRemote(itemThatWasSplit) && upsertRemoteTodo(itemThatWasSplit);

        // insert new item
        hasRemote(itemThatWasSplit) && upsertRemoteTodo(itemThatSplitOf);
    };

    const handleInsertAfter = (e) => {
        const { key } = e.detail;
        // can't exceed max
        if (atMaxItems) return;

        // let's add
        const index = getItemIndexByKey(key);

        // exit when is last item and has no value!
        if (todoItems[index].value.length === 0 && index === todoItems.length - 1) {
            // remove if is not last item
            if (todoItems.length > 1) {
                todoItems = todoItems.filter((item) => item.key !== key);
            }

            return dispatch('hide');
        }

        // insert new item
        todoItems = [
            ...todoItems.slice(0, index + 1),
            createEmptyTodoItem(true),
            ...todoItems.slice(index + 1),
        ];
    };

    const handleMove = (e) => {
        const { key, direction, selectionStart } = e.detail;

        // can't move one item
        if (todoItems.length === 1) return;

        // the item matching the key
        const item = getItemByKey(key);

        // index of item matching key
        let index = getItemIndexByKey(key);

        let indexNew = direction === 'up' ? index - 1 : index + 1;

        // can't move further up or down
        if (indexNew < 0 || indexNew > todoItems.length - 1) return;

        const newItems = [...todoItems];
        newItems.splice(index, 1);
        newItems.splice(indexNew, 0, item);

        item.focus = { char: selectionStart };

        todoItems = newItems;
    };

    const handleToggleItemDone = (e) => {
        const { key } = e.detail;
        todoItems = todoItems.map((item) => {
            if (item.key === key) {
                // new item object
                const updatedItem = {
                    ...item,
                    isDone: !item.isDone,
                };

                // async push changes to remote (if has remote)
                hasRemote(updatedItem) && syncRemoteTodo(updatedItem, upsertTodo);

                // done
                return updatedItem;
            }
            return item;
        });
    };

    const handleRemove = (e) => {
        const { key, smart } = e.detail;

        // the item matching the key
        const itemToRemove = getItemByKey(key);

        // clear last item if has value
        if (todoItems.length === 1) {
            // clear list
            todoItems = [
                createTodoItem({
                    isNew: false,
                    value: '',
                    focus: true,
                    placeholder: 'Exercise',
                }),
            ];

            // remove remote, but only if not completed
            !itemToRemove.isDone && hasRemote(itemToRemove) && deleteRemoteTodo(itemToRemove);

            // we done!
            return;
        }

        // index of item matching key
        let index = getItemIndexByKey(key);

        // if still has value, check if possible attempt to remove previous field
        if (smart && itemToRemove.value.length > 0) {
            const prevRef = todoItems[index - 1];

            // exit
            if (!prevRef) return;

            // previous doesn't have a value, remove
            if (!prevRef.value.length) {
                todoItems = todoItems.filter((item) => item.key !== prevRef.key);
                return;
            }

            // previous field has a value, let's merge
            let updatedItem;
            todoItems = todoItems
                .map((todoItem) => {
                    if (todoItem.key === prevRef.key) {
                        //
                        // if previous item has remote vs if original item has remote
                        //
                        updatedItem = {
                            ...todoItem,
                            focus: {
                                char: todoItem.value.length,
                            },
                            value: todoItem.value + '' + itemToRemove.value,
                            remote: todoItem.remote || itemToRemove.remote,
                        };
                        return updatedItem;
                    }

                    return todoItem;
                })
                .filter((item) => item.key !== key);

            // if has own remote, delete from remote
            if (updatedItem) {
                // both have remote, remove original, update target
                if (hasRemote(updatedItem) && hasRemote(itemToRemove)) {
                    deleteRemoteTodo(itemToRemove);
                    upsertRemoteTodo(updatedItem);
                }

                // target has remote, update target
                else if (hasRemote(updatedItem)) {
                    upsertRemoteTodo(updatedItem);
                }
            }

            return;
        }

        // remove self and focus previous item
        const nextFocusIndex = Math.max(0, index - 1);
        todoItems = todoItems
            .filter((item) => item.key !== key)
            .map((item, index) => {
                if (index === nextFocusIndex) {
                    return { ...item, focus: true };
                }
                return item;
            });

        // remove from remote if wasn't completed
        !itemToRemove.isDone && hasRemote(itemToRemove) && deleteRemoteTodo(itemToRemove);
    };

    const handleClear = () => {
        todoItems = [createEmptyTodoItem(true)];
    };

    //#endregion

    //#region sync
    const connectionWorkers = writable({});
    setContext('connectionWorkers', connectionWorkers);
    setContext('syncWorkerFactoryOptions', {
        transformWorkerSrc: transformSyncSrc,
        onWorkerMessage: onSyncMessage,
    });

    const syncConnection = async (connection) => {
        // check if already connected
        if ($connectionWorkers[connection.id] !== undefined) return;

        // busy loading this connection
        $connectionWorkers[connection.id] = false;

        // get options
        const options = getContext('syncWorkerFactoryOptions');

        // set up connection
        const syncWorker = await createSyncWorker(connection.src, options);

        // add new worker
        $connectionWorkers = {
            ...$connectionWorkers,
            [connection.id]: syncWorker,
        };
    };

    const syncConnections = async (connections) => {
        for (const connection of connections) {
            await syncConnection(connection);
        }
    };

    const getConnectionById = (connectionId) =>
        $currentSettings.connections.find((connection) => connection.id === connectionId);

    const updateTodoRemoteStateByKey = (key, remote) => {
        todoItems = todoItems.map((item) => {
            if (item.key === key) {
                const itemClone = { ...item };
                deepAssign(itemClone, { remote });
                return itemClone;
            }
            return item;
        });
    };

    const detachRemoteByKey = (key, remoteId) => {
        todoItems = todoItems.map((item) => {
            if (item.key === key) {
                const itemClone = { ...item };
                delete itemClone.remote[remoteId];
                return itemClone;
            }
            return item;
        });
    };

    const syncRemoteTodo = (todoItem, action) => {
        if (!todoItem || !action) return;

        console.log('sync remote todo', todoItem);

        for (const [connectionId, syncWorker] of Object.entries($connectionWorkers)) {
            // worker could still be loading
            if (!syncWorker) continue;

            // get connection so we can get props
            const connection = getConnectionById(connectionId);
            if (!connection) continue;

            // this connection is still busy, skip!
            if (
                todoItem.remote &&
                todoItem.remote[connection.id] &&
                todoItem.remote[connection.id].busy
            )
                continue;

            // run action
            action(syncWorker, connection, todoItem);
        }
    };

    const deleteTodo = (syncWorker, connection, todoItem) => {
        // no remote id, so can't delete
        if (!todoItem.remote[connection.id]) return;

        // set busy state
        updateTodoRemoteStateByKey(todoItem.key, {
            [connection.id]: {
                busy: true,
            },
        });

        // update action
        const { id } = todoItem.remote[connection.id];

        syncWorker
            .deleteTodo(connection.props, id)
            .then((success) => {
                console.log('deleted', todoItem.key, success);
            })
            .catch((err) => {
                console.log('delete error!', err);
            })
            .finally(() => {
                detachRemoteByKey(todoItem.key, connection.id);
            });
    };

    const upsertTodo = async (syncWorker, connection, todoItem) => {
        // can't sync empty todo
        if (!todoItem.value.length) return;

        // set busy state
        updateTodoRemoteStateByKey(todoItem.key, {
            [connection.id]: {
                busy: true,
            },
        });

        // already have a remote id
        if (
            todoItem.remote &&
            todoItem.remote[connection.id] &&
            todoItem.remote[connection.id].id !== undefined
        ) {
            // update action
            const { id } = todoItem.remote[connection.id];

            // insert new todo
            syncWorker
                .updateTodo(connection.props, id, {
                    text: todoItem.value,
                    completed: todoItem.isDone,
                })
                .then((success) => {
                    // yay we updated the item
                    if (success) return;

                    // if wasn't a success we couldn't find the item
                    detachRemoteByKey(todoItem.key, connection.id);
                })
                .catch((err) => {
                    console.log('update error!', err);
                })
                .finally(() => {
                    updateTodoRemoteStateByKey(todoItem.key, {
                        [connection.id]: {
                            busy: false,
                        },
                    });
                });
            return;
        }

        // insert
        syncWorker
            .insertTodo(connection.props, {
                text: todoItem.value,
                completed: todoItem.isDone,
            })
            .then((remote) => {
                updateTodoRemoteStateByKey(todoItem.key, {
                    [connection.id]: {
                        ...remote,
                    },
                });
            })
            .finally(() => {
                updateTodoRemoteStateByKey(todoItem.key, {
                    [connection.id]: {
                        busy: false,
                    },
                });
            });
    };

    const deleteRemoteTodo = (todoItem) => syncRemoteTodo(todoItem, deleteTodo);

    const upsertRemoteTodo = (todoItem) => syncRemoteTodo(todoItem, upsertTodo);

    const handleSyncToRemote = (e) => {
        const { key } = e.detail;
        const todoItem = getItemByKey(key);
        upsertRemoteTodo(todoItem);
    };

    $: syncConnections($currentSettings.connections);
    //#endregion

    // when switching from settings to active page need to remove completed todos
    const removeCompletedItems = () => {
        for (const [index, todoItem] of [...todoItems].reverse().entries()) {
            if (!todoItem.isDone) continue;
            setTimeout(
                () => {
                    todoItems = todoItems.filter((item) => item.key !== todoItem.key);
                    if (!todoItems.length) todoItems = [createEmptyTodoItem(true, 'Exercise')];
                },
                50 + index * 50
            );
        }
    };

    // wait a bit with sorting
    const sortItems = ({ location, group, tagMatchers }) => {
        const move = /move/.test(location);

        const activeInputElement = /** @type {HTMLInputElement} */ (document.activeElement);
        const isInput = activeInputElement ? activeInputElement.type === 'text' : false;
        const caretOffset = activeInputElement?.selectionEnd;

        // start sorting
        let input = [...todoItems];
        let output = [...input];

        // now sort by move rules
        if (move) {
            output = [...output].sort((a, b) => {
                if (a.isDone && !b.isDone) return location === 'move-to-top' ? -1 : 1;
                if (!a.isDone && b.isDone) return location === 'move-to-top' ? 1 : -1;
                return 0;
            });
        }

        // group items by category
        if (group) {
            //
            let res = [];

            let fixed = [];

            // fixed indexes
            for (const [index, item] of output.entries()) {
                // empty items and focussed items have a fixed position
                if (
                    !item.value.length ||
                    (item.focussed && !tagMatchers.find(({ test }) => test(item.value)))
                ) {
                    output[index + 1] &&
                        fixed.push({
                            before: output[index + 1].key,
                            item,
                        });
                }
            }

            // order same as categories
            tagMatchers.forEach(({ test }) => {
                for (const item of output) {
                    // already moved this item
                    if (res.includes(item)) continue;

                    // fits in category, so let's move to this category
                    if (test(item.value)) {
                        res.push(item);
                        continue;
                    }
                }
            });

            // build output
            output = [
                ...res,
                ...output.filter(
                    (item) => !res.includes(item) && !fixed.find((entry) => entry.item === item)
                ),
            ];

            // insert fixed
            fixed.forEach((entry) => {
                const index = output.findIndex((item) => item.key === entry.before);
                if (index < 0) return;
                output.splice(index, 0, entry.item);
            });
        }

        // if changed, update
        if (arrayEqual(output, input)) return;

        // update todo items list
        todoItems = output;

        // need to queue focus restore attempt for next frame
        isInput &&
            requestAnimationFrame(() => {
                activeInputElement.setSelectionRange(caretOffset, caretOffset);
                activeInputElement.focus();
            });
    };

    $: if (
        activePage === 'todolist' &&
        $currentSettings.itemCompleteAction === 'remove' &&
        currentItems
    ) {
        removeCompletedItems();
    }

    $: if (activePage === 'todolist' && currentItems) {
        sortItems({
            location: $currentSettings.itemCompleteAction,
            group: $currentSettings.itemGroupByTag,
            tagMatchers: [...itemTagMatchers],
        });
    }

    const handleCloseSettings = () => {
        activePage = 'todolist';
    };

    /**
     * @param e { TransitionEvent }
     */
    const handleTransitionEnd = (e) => {
        // only handle root element transitions
        if (e.target !== root) return;

        // only deal with opacity for now
        if (e.propertyName !== 'opacity') return;

        // visibility toggled
        dispatch(elementComputedStyles.opacity === '1' ? 'shown' : 'hidden');
    };

    /**
     * @param e {KeyboardEvent}
     */
    const handleKeydown = (e) => {
        if (!/Escape/.test(e.key)) return;
        enableAnimations = false;
        visible = false;
    };

    // determine matchers for each category
    const getItemTagMatchers = (itemTags) =>
        itemTags
            .filter((tag) => tag.needle && tag.needle.length)
            .map((tag) => {
                const { needle, style, key } = tag;

                const label = getTagTitle(tag);

                const needleRegExp = stringToRegExp(needle);

                const test = needleRegExp
                    ? (str) => needleRegExp.test(str)
                    : (str) =>
                          needle
                              .toLowerCase()
                              .split(',')
                              .some((needle) => str.toLowerCase().includes(needle.trim()));

                const search = needleRegExp
                    ? (str) => str.match(needleRegExp)
                    : (str) => str.match(new RegExp(needle.split(',').join('|'), 'gi'));

                return {
                    label,
                    key,
                    style,
                    test,
                    search,
                };
            });

    $: itemTagMatchers = getItemTagMatchers($currentSettings.itemTags);

    // environment variables
    $: env = [!!window['chrome'] && 'is-chrome', $isAnimated && 'is-animated']
        .filter(Boolean)
        .join(' ');
</script>

<div
    class="Hotlist"
    bind:this={root}
    data-env={env}
    data-theme={$activeTheme}
    data-visible={visible}
    on:keydown={handleKeydown}
    on:transitionend={handleTransitionEnd}
>
    <Panel active={activePage === 'todolist'} willFocus={restoreFocus} on:resize={handleResize}>
        <TodoList
            {itemTagMatchers}
            bind:items={todoItems}
            on:bluritem={handleBlurItem}
            on:insertbefore={handleInsertBefore}
            on:split={handleSplit}
            on:insertafter={handleInsertAfter}
            on:move={handleMove}
            on:remove={handleRemove}
            on:sync={handleSyncToRemote}
            on:pastelines={handlePasteLines}
            on:clear={handleClear}
            on:toggle={handleToggleItemDone}
            on:openurl={handleOpenURL}
        />
    </Panel>
    <Panel active={activePage === 'settings'} on:resize={handleResize}>
        <Settings on:close={handleCloseSettings} />
    </Panel>
</div>

<style>
    .Hotlist {
        position: relative;

        /* theme styles */
        --color-success: 65, 100, 20;
        --color-success-bright: 200, 235, 205;
        --color-error: 180, 50, 50;
        --color-error-bright: 255, 220, 210;

        /* tag styles */
        --red-background: 248, 119, 110;
        --red-gradient: 246, 141, 207;
        --red-color: 84, 16, 10;
        --orange-background: 250, 190, 99;
        --orange-gradient: 248, 119, 110;
        --orange-color: 88, 57, 13;
        --yellow-background: 247, 232, 98;
        --yellow-gradient: 250, 190, 99;
        --yellow-color: 83, 76, 12;
        --green-background: 124, 245, 130;
        --green-gradient: 247, 232, 98;
        --green-color: 20, 89, 23;
        --aqua-background: 117, 224, 237;
        --aqua-gradient: 124, 245, 130;
        --aqua-color: 19, 86, 94;
        --blue-background: 139, 159, 247;
        --blue-gradient: 117, 224, 237;
        --blue-color: 13, 27, 86;
        --purple-background: 180, 131, 238;
        --purple-gradient: 139, 159, 247;
        --purple-color: 52, 13, 101;
        --fuchsia-background: 246, 141, 207;
        --fuchsia-gradient: 180, 131, 238;
        --fuchsia-color: 94, 10, 63;
    }

    /* show / hide animation */
    .Hotlist {
        transition: opacity 0.15s ease-in-out;
    }

    .Hotlist[data-visible='false'] {
        opacity: 0;
    }

    .Hotlist[data-visible='true'] {
        opacity: 1;
    }
</style>
