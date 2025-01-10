<script>
    import { createEventDispatcher, getContext, onDestroy } from 'svelte';
    import { getCaretIndex, getCaretPosition } from '../utils/textMeasure';
    import eventMatchesShortcut from '../utils/eventMatchesShortcut';
    import getLinesFromText from '../utils/getLinesFromText';
    import formatURL from '../utils/formatURL';

    // require props
    export let complete;
    export let select;
    export let value;
    export let placeholder;
    export let focussed;
    export let tags;
    export let focus;

    // event handling
    const dispatch = createEventDispatcher();

    /**
     * Text formatting to highlight words
     * @param {string} str
     * @returns {string}
     */
    const formatVisualText = (tags, str) => {
        const elements = [];

        let id = 0;

        // first we mark the location of the tags
        str = tags.reduce((str, tag, i) => {
            const matches = Array.from(new Set(tag.search(str) || []));

            matches.forEach((match, j) => {
                const element = {
                    key: `___${id++}___`,
                    render: () =>
                        `<mark title="${tag.label}" style="--theme-text-color:var(--${tag.style}-color);--theme-background-color:var(--${tag.style}-background)">${match}</mark>`,
                };
                elements.push(element);

                str = str.replace(new RegExp(match, 'g'), element.key);
            });
            return str;
        }, str);

        // then we replace the markers with HTML markers, this prevents nested markers
        elements.forEach((element) => {
            str = str.replace(new RegExp(element.key, 'g'), element.render());
        });

        return str;
    };

    /**
     * Text formatting to highlight words
     * @param {string} str
     * @returns {string}
     */
    const formatLinks = (str) => {
        const elements = [];

        let id = 0;

        // now we match URLs
        str = Array.from(
            new Set(
                str.match(
                    /(http:\/\/|ftp:\/\/|https:\/\/|)([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/gi
                )
            )
        ).reduce((str, link) => {
            const element = {
                key: `___${id++}___`,
                render: () => `<a title="Open in browser" href="${link}">${link}</a>`,
            };
            elements.push(element);
            str = str.replace(new RegExp(link, 'g'), element.key);
            return str;
        }, str);

        // then we replace the markers with HTML markers, this prevents nested markers
        elements.forEach((element) => {
            str = str.replace(new RegExp(element.key, 'g'), element.render());
        });

        return str;
    };

    // this holds the actual text input element
    let inputScrollOffset = 0;
    const syncInputScrollOffset = () => {
        if (!textInput || !focussed) return;

        // update offset so we can align underlines
        inputScrollOffset = textInput.scrollLeft;

        // always sync scroll offset
        requestAnimationFrame(syncInputScrollOffset);
    };

    $: hasTags = tags?.length > 0;
    $: if (focussed && hasTags) {
        syncInputScrollOffset();
    } else {
        resetInputScrollOffset();
    }

    const resetInputScrollOffset = () => (inputScrollOffset = 0);

    // contex
    const settings = getContext('settings');
    $: shortcuts = [
        [
            $settings.shortcutMoveItemUp,
            (e) =>
                dispatch('move', {
                    direction: 'up',
                    selectionStart: e.target.selectionStart,
                }),
        ],
        [
            $settings.shortcutMoveItemDown,
            (e) =>
                dispatch('move', {
                    direction: 'down',
                    selectionStart: e.target.selectionStart,
                }),
        ],
        [
            $settings.shortcutToggleItemDone,
            () => {
                dispatch('toggle');
            },
        ],
        [$settings.shortcutRemoveItem, () => dispatch('remove')],
        [$settings.shortcutSyncItem, () => dispatch('sync')],
    ];

    // elements
    let textInput;

    // focus handling
    const handleFocus = () => {
        focussed = true;
    };

    const handleBlur = () => {
        focussed = false;
    };

    const handlePaste = (e) => {
        // don't handle if only pasting single line, in that situation just allow paste in field
        const lines = getLinesFromText(e.clipboardData.getData('text'));
        if (lines.length === 1) return;

        // if is multiline, block and let parent handle it
        dispatch('pastelines', { lines });

        e.preventDefault();
    };

    const handleKeydown = (e) => {
        const { key, target } = e;
        const { selectionStart, selectionEnd, value } = target;

        // handle shortcuts
        for (const [shortcut, handler] of shortcuts.filter(([shortcut]) => shortcut.length)) {
            if (eventMatchesShortcut(e, shortcut)) {
                e.preventDefault();
                return handler(e);
            }
        }

        // handle key left to move one field up if at start of field
        if (/arrowleft/i.test(key)) {
            if (selectionStart === 0) {
                return dispatch('prev', {
                    selectionStart: Number.MAX_SAFE_INTEGER,
                });
            }
        }

        // handle key right to move one field down if at end of field
        if (/arrowright/i.test(key)) {
            if (selectionStart === value.length) {
                return dispatch('next', {
                    selectionStart: 0,
                });
            }
        }

        // handle key up combos
        if (/arrowdown/i.test(key)) {
            // move caret down
            return dispatch('next', {
                selectionStart,
                caretPosition: getCaretPosition(target),
                valueLength: value.length,
            });
        }

        // handle key down combos
        if (/arrowup/i.test(key)) {
            // move caret up
            return dispatch('prev', {
                selectionStart,
                caretPosition: getCaretPosition(target),
            });
        }

        // handle enter to create new field
        if (/enter/i.test(key)) {
            e.preventDefault();

            // if is at start of field and has content, insert item before
            if (selectionStart === 0 && value.length) {
                return dispatch('insertbefore');
            }

            // if is in middle of field, split item
            if (selectionStart > 0 && selectionStart <= value.length - 1) {
                return dispatch('split', {
                    selectionStart,
                });
            }

            // if is at end of field, add new item
            return dispatch('insertafter');
        }

        // handle backspace to remove a field
        if (/backspace/i.test(key) && selectionStart === 0 && selectionEnd === 0) {
            e.preventDefault();

            // with smart set to true the app will check if should remove self or previous empty item, or merge values
            return dispatch('remove', {
                smart: true,
            });
        }
    };

    // if focus is set to true focus the field, then immidiately set to false (doesn't blur)
    $: if (focus && textInput) {
        // get selection index
        let index = undefined;
        if (focus === true) {
            // move focus to end of input
            index = value.length;
        } else if (typeof focus === 'object') {
            // select index by char
            if ('char' in focus) {
                index = /** @type { { char: number } } */ (focus).char;
            }
            // select index by x offset
            else if (focus && 'x' in focus) {
                index = getCaretIndex(textInput, /** @type { { x: number } } */ (focus).x);
            }
        }

        // reset focus on model
        focus = false;

        // only works if ran in next frame, probably because of value bind on text input
        requestAnimationFrame(() => {
            // could be removed in next frame
            if (!textInput || index === undefined) return;

            // set range
            textInput.setSelectionRange(index, index);
            textInput.focus();
        });
    }

    onDestroy(() => {
        // just to be sure the animation loop always ends
        focussed = false;
    });

    const handleLinkClick = (e) => {
        e.preventDefault();
        dispatch('openurl', { url: formatURL(e.target.getAttribute('href')) });
    };

    $: dataState = [focussed && 'focussed', complete && 'completed', select && 'selected']
        .filter(Boolean)
        .join(' ');

    $: visualText = formatVisualText(tags, value);

    $: textLinks = formatLinks(value);
</script>

<span class="input" data-state={dataState}>
    <span class="input-visual-overflow" style="--scroll-offset:{inputScrollOffset}">
        <span class="input-visual">
            {@html visualText}
        </span>
    </span>
    <input
        class="input-field"
        type="text"
        autocomplete="off"
        spellcheck="false"
        {placeholder}
        bind:value
        bind:this={textInput}
        on:keydown={handleKeydown}
        on:paste={handlePaste}
        on:focusin={handleFocus}
        on:focusout={handleBlur}
    />
    <span class="input-strike" aria-hidden="true">
        {value}
    </span>
    <span class="input-links-overflow" style="--scroll-offset:{inputScrollOffset}">
        <span
            class="input-links"
            on:click={(e) => e.preventDefault()}
            on:keyup={() => {
                /* to please Svelte */
            }}
            on:pointerdown={handleLinkClick}
        >
            {@html textLinks}
        </span>
    </span>
</span>

<style>
    .input {
        --padding-left: 15px;
        --padding-right: 15px;

        position: relative;
        box-sizing: border-box;
        flex: 1 0 auto;
        align-self: stretch;
    }

    .input > * {
        position: absolute;
        left: 0;
        padding: 0;
        margin: 0;
        border: 0;
        color: rgb(var(--color-text));
        font-family: inherit;
        font-size: calc(var(--font-size) * 1px);
        height: calc(var(--font-size) * 2.25px);
        line-height: calc(var(--font-size) * 2.25px);
        box-sizing: border-box;
        background: transparent;
        transition: color 0.3s ease-in-out;
        overflow: hidden;
    }

    .input-field {
        width: calc(100% + var(--padding-left));
        text-indent: var(--padding-left);
        margin-left: calc(-1 * var(--padding-left));
        caret-color: rgba(var(--color-text), calc(var(--color-strength) * 0.5));

        --mask: linear-gradient(to right, transparent, black var(--padding-left));

        mask: var(--mask);
        -webkit-mask: var(--mask);
    }

    .input[data-state~='completed'] .input-field {
        color: rgba(var(--color-text), calc(var(--color-strength) * 0.25));
    }

    .input-links-overflow,
    .input-visual-overflow {
        max-width: calc(100% + var(--padding-left) + var(--padding-right));
        padding-right: var(--padding-right);

        padding-left: var(--padding-left);
        margin-left: calc(-1 * var(--padding-left));

        color: transparent;
        pointer-events: none;
        white-space: pre;
        width: auto;

        --mask: linear-gradient(
            to right,
            transparent,
            black var(--padding-left),
            black calc(100% - var(--padding-right)),
            transparent
        );
        mask: var(--mask);
        -webkit-mask: var(--mask);
        /* background: var(--mask); */
    }

    .input-links,
    .input-visual {
        position: relative;
        left: calc(var(--scroll-offset) * -1px);
    }

    .input-links {
        white-space: pre;
        color: transparent;
        pointer-events: none;
    }

    :global(.input-links a) {
        position: relative;
        color: inherit;
        text-decoration: none;
    }

    :global(.input[data-state~='focussed'] .input-links a) {
        text-decoration: underline;
        text-decoration-color: rgba(var(--color-text), 1);
        pointer-events: all;
    }

    :global(.input-visual mark) {
        display: inline-block;
        position: relative;
        color: inherit;
        background-color: transparent;
        transition: opacity 0.3s ease-out;
    }

    :global(.input-visual mark::after) {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        height: 2px;
        bottom: 5px;
        background-color: rgb(var(--theme-background-color));
        border-radius: 2px;
    }

    :global(
            .Hotlist:not([data-theme='light'])
                [data-has-focus='true']
                :not([data-state~='completed'])
                .input-visual
                mark::after
        ) {
        box-shadow: -20px 0 30px 5px rgba(var(--theme-background-color), 0.35),
            20px 0 30px 5px rgba(var(--theme-background-color), 0.35),
            0 0 30px 10px rgba(var(--color-background), 1);
    }

    :global(
            .Hotlist:not([data-theme='light'])
                [data-has-focus='true']
                :not([data-state~='completed'])
                .input-visual
                mark::before
        ) {
        content: '';
        position: absolute;
        left: -20px;
        right: -20px;
        height: 1px;
        bottom: 0;
        background: linear-gradient(
            to right,
            rgba(var(--theme-background-color), 0),
            rgba(var(--theme-background-color), 0.25),
            rgba(var(--theme-background-color), 0)
        );
    }

    :global(.input[data-state~='completed'] .input-visual mark) {
        opacity: 0;
    }

    .input[data-state~='selected'] .input-field {
        opacity: 0;
    }

    .input[data-state~='selected'] .input-visual-overflow,
    .input-field::selection {
        color: rgb(var(--color-text));
        background-color: rgba(30, 150, 240, 0.3);
    }

    .input[data-state~='completed'] .input-visual {
        color: rgba(var(--color-text), 0);
    }

    .input-field::placeholder {
        color: rgba(var(--color-text), calc(var(--color-strength) * 0.25));
    }

    .input-field:focus {
        outline: 0;
    }

    /* strike when done */
    .input-strike {
        pointer-events: none;
        position: absolute;
        left: 0;
        top: 50%;
        height: 2px;
        border-radius: 2px;
        background-color: rgba(var(--color-text));
        filter: invert(0%);
        box-shadow: 0 1px 0 0 rgba(var(--color-background), 0.25);
        transform: scaleX(0.25);
        transform-origin: left center;
        opacity: 0;
        transition: transform 0.05s ease-in, filter 0.3s ease-out;
    }

    .input[data-state~='completed'] .input-strike {
        transform: scaleX(1);
        opacity: 1;
        filter: invert(calc(40% / var(--color-strength)));
    }
</style>
