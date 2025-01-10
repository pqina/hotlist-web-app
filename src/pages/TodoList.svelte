<script>
    import { createEventDispatcher, getContext } from 'svelte';
    import { spring } from 'svelte/motion';
    import storeGroup from '../utils/storeGroup';
    import TodoItem from '../components/TodoItem.svelte';
    import getLinesFromText from '../utils/getLinesFromText';
    import getAsNumberOrUndefined from '../utils/getAsNumberOrUndefined';
    import isNumber from '../utils/isNumber';

    // props
    export let items = [];
    export let itemTagMatchers;

    // get settings
    const settings = getContext('settings');

    // returns the connection name based on the connection id
    const getConnectionLabelById = (id) =>
        $settings.connections.find((connection) => connection.id === id)?.name;

    const getRemotes = (remotes) =>
        `${Object.entries(remotes)
            .map(([connectionId, remote]) => {
                const label = getConnectionLabelById(connectionId);
                const uid = `"${remote.id} @ ${connectionId}"`;
                if (remote.url) {
                    return `[${label}](${remote.url} ${uid})`;
                }
                return `${uid}`;
            })
            .join(', ')}`;

    // returns the tags matching this value
    const getTagsByValue = (matchers, value) => matchers.filter((tag) => tag.test(value));

    // events
    const dispatch = createEventDispatcher();

    // context
    const enableAnimations = getContext('enableAnimations');
    const styles = getContext('styles');
    $: itemPadding = getAsNumberOrUndefined($styles['--page-padding']);

    // helpers
    const handleSelectPreviousField = (index, key, selectionStart, caretPosition) => {
        items = items.map((item, itemIndex) => {
            return index - 1 === itemIndex
                ? {
                      ...item,
                      focus: { x: caretPosition },
                  }
                : item;
        });
    };

    const handleSelectNextField = (index, key, selectionStart, caretPosition, valueLength) => {
        items = items.map((item, itemIndex) => {
            return index + 1 === itemIndex
                ? {
                      ...item,
                      focus:
                          typeof caretPosition === 'number'
                              ? { x: caretPosition }
                              : { char: selectionStart },
                  }
                : item;
        });
    };

    // copy
    let copyReplacement;
    document.addEventListener('copy', function (e) {
        // don't override if no replacement available
        if (!copyReplacement) return;

        // replace content of copy action
        e.clipboardData.setData('text/plain', copyReplacement);

        // reset replacement so it doen't stick around for next copy action
        copyReplacement = undefined;

        // this prevents the default copy action
        e.preventDefault();
    });

    let enableSelectAll = false;
    let catchSelectAll;

    /**
     *
     * @param e {ClipboardEvent}
     */
    const handlePaste = (e) => {
        if (!enableSelectAll) return;

        // get text from paste event
        const lines = getLinesFromText(e.clipboardData.getData('text'));

        // if is multiline, block and let parent handle it
        dispatch('pastelines', { lines });

        e.preventDefault();
        e.stopPropagation();
    };

    /**
     * @param e {KeyboardEvent}
     */
    const handleKeydown = (e) => {
        if (enableSelectAll) {
            const isMeta = e.metaKey;
            const isCopy = e.code === 'KeyC' && isMeta;
            const isPaste = e.code === 'KeyV' && isMeta;
            const isDelete = e.code === 'Backspace';

            // clear list
            if (isDelete) {
                enableSelectAll = false;
                dispatch('clear');
                return;
            }

            // copy action
            if (isCopy) {
                // remote empty items
                const relevantItems = items.filter((item) => item.value.length);

                // copy to clipboard
                copyReplacement = relevantItems
                    .map(
                        (item) =>
                            `- [${item.isDone ? 'x' : ' '}] ${item.value}${
                                item.remote ? ` ${getRemotes(item.remote)}` : ''
                            }`
                    )
                    .join('\n');

                return;
            }

            if (isPaste) {
                // situation handled in handlePaste
                return;
            }

            // just sole meta key
            if (isMeta) return;

            // clear select all mode
            enableSelectAll = false;

            return;
        }

        const retainSelectAll = (e.code === 'KeyA' && e.metaKey) || (enableSelectAll && e.metaKey);
        if (!retainSelectAll) return (catchSelectAll = false);

        if (catchSelectAll) {
            e.preventDefault();
            e.stopPropagation();

            // select all
            enableSelectAll = true;
            return;
        }

        catchSelectAll = true;
    };

    const handlePointerDown = () => {
        enableSelectAll = false;
        catchSelectAll = false;
    };

    /**
     * Handles todo item measurement event
     * @param key {string}
     * @returns { (e: CustomEvent) => void }
     */
    const createTodoItemMeasureHandler = (key) => (e) => {
        todoHeights = { ...todoHeights, [key]: e.detail.height };
    };

    // Item animation and positioning
    let todoHeights = {};

    const springsConfig = {
        stiffness: 0.15,
        damping: 0.35,
    };

    const reduceOffset = (state, curr) => {
        if (isNumber(state.heights[curr.key])) {
            state.offsets[curr.key] = state.currentOffset;
            state.currentOffset += state.heights[curr.key];
        } else {
            state.offsets[curr.key] = undefined;
        }
        return state;
    };

    const reduceToOffsets = (items, heights) => {
        const res = items.reduce(reduceOffset, {
            offsets: {},
            currentOffset: 0,
            heights,
        });

        // only interested in offsets
        return res.offsets;
    };

    const reduceToTotalHeight = (items, heights) => {
        const allHeightsCalculated = items.every((item) => isNumber(heights[item.key]));
        if (!allHeightsCalculated || itemPadding === undefined) return undefined;
        return items.reduce((prev, curr) => prev + heights[curr.key], 0) - itemPadding;
    };

    $: contentHeight = reduceToTotalHeight(items, todoHeights);

    // assign height to the list so it's picked up by the parent panel
    $: style = isNumber(contentHeight) ? `height:${contentHeight}px` : undefined;

    // calculate offsets of todo items
    const todoOffsets = storeGroup(reduceToOffsets(items, todoHeights), spring, springsConfig);

    $: todoOffsets.set(reduceToOffsets(items, todoHeights), {
        hard: !$enableAnimations,
    });

    // focus switching between items
    let itemFocus = undefined;

    const handleFocusin = (e) => {
        if (e.target.nodeName !== 'INPUT') return;

        const item = e.target.closest('li[data-key]');
        if (!item.dataset.key) return;

        itemFocus = { key: item.dataset.key, focus: { char: e.target.selectionStart } };
        dispatch('focusitem', itemFocus);
    };

    const handleFocusout = (e) => {
        if (e.target.nodeName !== 'INPUT') return;
        itemFocus &&
            dispatch('bluritem', { key: itemFocus.key, focus: { char: e.target.selectionStart } });
        itemFocus = undefined;
    };

    /**
     *
     * @param {string} key
     * @returns { (e: CustomEvent) => void }
     */
    const appendKeyToEventDetails = (key) => (e) => {
        // const detail = { ...e.detail, key };

        // console.log(key, e.type, e.detail);
        // console.log(detail);

        dispatch(e.type, { ...e.detail, key });
    };
</script>

<ul
    on:focusin={handleFocusin}
    on:focusout={handleFocusout}
    on:keydown={handleKeydown}
    on:paste={handlePaste}
    on:pointerdown={handlePointerDown}
    {style}
>
    {#each items as { key, value, isNew, isDone, focus, focussed, placeholder, remote }, index (key)}
        <li
            data-key={key}
            data-has-focus={items.length > 1 && key === itemFocus?.key}
            style="--y:{$todoOffsets[key] + itemPadding * 0.5}"
        >
            <TodoItem
                {placeholder}
                {remote}
                tags={getTagsByValue(itemTagMatchers, value)}
                select={enableSelectAll}
                complete={isDone}
                bind:value
                bind:focus
                bind:focussed
                bind:isNew
                on:measure={createTodoItemMeasureHandler(key)}
                on:split={appendKeyToEventDetails(key)}
                on:insertafter={appendKeyToEventDetails(key)}
                on:insertbefore={appendKeyToEventDetails(key)}
                on:move={appendKeyToEventDetails(key)}
                on:remove={appendKeyToEventDetails(key)}
                on:sync={appendKeyToEventDetails(key)}
                on:toggle={appendKeyToEventDetails(key)}
                on:pastelines={appendKeyToEventDetails(key)}
                on:complete={appendKeyToEventDetails(key)}
                on:openurl
                on:prev={(e) =>
                    handleSelectPreviousField(
                        index,
                        key,
                        e.detail.selectionStart,
                        e.detail.caretPosition
                    )}
                on:next={(e) =>
                    handleSelectNextField(
                        index,
                        key,
                        e.detail.selectionStart,
                        e.detail.caretPosition,
                        e.detail.valueLength
                    )}
            />
        </li>
    {/each}
</ul>

<style>
    ul,
    li {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    li {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        transform: translateY(calc(var(--y) * 1px));
    }

    li::before {
        content: '';
        position: absolute;
        left: 8px;
        top: 0;
        right: 8px;
        bottom: 0;
        background: rgba(var(--color-text), calc(var(--color-strength) * 0.0375));
        border-radius: 5px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.1s ease-in-out;
    }

    li[data-has-focus='true']::before {
        opacity: 1;
    }
</style>
