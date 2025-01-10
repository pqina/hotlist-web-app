<script>
    import { createEventDispatcher, getContext, onMount } from 'svelte';
    import measurable from '../actions/measurable';
    import TodoCheckbox from './TodoCheckbox.svelte';
    import { spring } from 'svelte/motion';
    import TodoItemInput from './TodoItemInput.svelte';
    import formatURL from '../utils/formatURL';

    export let value = '';
    export let complete = false;
    export let isNew = false;
    export let placeholder = '';
    export let select = false;
    export let tags = undefined;
    export let remote = undefined;

    export let focus = false;
    export let focussed = undefined;

    // settings
    const settings = getContext('settings');

    // what are you syncing about
    $: hasRemote = remote && !!Object.values(remote).find((item) => item.id);
    $: hasRemoteURL = hasRemote && Object.values(remote).find((item) => item.url);
    $: remoteURL = hasRemoteURL && Object.values(remote).find((item) => item.url).url;
    $: isSyncing = remote && !!Object.values(remote).find((item) => item.busy);
    $: supportsManualSync = !!$settings.connections.length && value.length;

    // if should animate
    const enableAnimations = getContext('enableAnimations');

    // event handling
    const dispatch = createEventDispatcher();

    /**
     * @param {string} url
     */
    const handleLinkClick = (url) => dispatch('openurl', { url: formatURL(url) });

    /**
     * @returns {void}
     */
    const handleSyncClick = () => {
        dispatch('sync');
    };

    let syncInputTimeout;
    let syncedValue = value;
    const handleSyncOnChange = () => {
        clearTimeout(syncInputTimeout);
        syncInputTimeout = setTimeout(() => {
            syncedValue = value;
            dispatch('sync');
        }, 1000);
    };

    $: if (hasRemote && value.length && value !== syncedValue && !isSyncing) handleSyncOnChange();

    // intro animation
    const introAnimator = spring(isNew ? 0 : undefined);
    onMount(() => introAnimator.set(1, { hard: !$enableAnimations }));
    isNew = false;
</script>

<div class="todo-item" on:measure use:measurable>
    <span class="toggle">
        <TodoCheckbox
            animator={$introAnimator}
            checked={complete}
            disabled={!value.length}
            on:change={() => dispatch('toggle')}
        />
    </span>

    <TodoItemInput
        bind:value
        bind:focus
        bind:focussed
        {tags}
        {placeholder}
        {select}
        {complete}
        on:prev
        on:next
        on:split
        on:insertafter
        on:insertbefore
        on:move
        on:remove
        on:sync
        on:toggle
        on:pastelines
        on:complete
        on:openurl
    />

    <span class="remote-todo" style="--animator:{$introAnimator}">
        {#if hasRemoteURL}
            <button
                class="button-open-url"
                on:click={() => handleLinkClick(remoteURL)}
                title="View on remote"
            >
                View on remote {value}
            </button>
        {/if}
        {#if supportsManualSync}
            <button
                data-state={isSyncing ? 'syncing' : hasRemote ? 'synced' : 'unsynced'}
                class="button-sync"
                on:click={() => handleSyncClick()}
                title="Sync to remote"
            >
                Sync to remote {value}
            </button>
        {/if}
    </span>
</div>

<style>
    .todo-item {
        --cs: calc(var(--checkbox-size) * 1px);
        --p: calc(var(--page-padding) * 1px);

        display: flex;
        align-items: center;
        position: relative;
        padding-right: var(--p);
    }

    /* main row */
    .todo-item > * {
        display: flex;
        align-items: center;
    }

    .toggle {
        position: relative;
        z-index: 3;
        min-width: calc((var(--checkbox-size) + var(--page-padding) * 2) * 1px);
        height: calc((var(--checkbox-size) + var(--page-padding)) * 1px);
        margin-right: -2px;
    }

    .remote-todo {
        position: relative;
        padding-left: 5px;
        z-index: 2;
        opacity: var(--animator);
        transform: translateY(calc(-10px + var(--animator) * 10px));
    }

    .remote-todo:empty {
        display: none;
    }

    .remote-todo button + button {
        margin-left: 5px;
    }

    .remote-todo :where(button) {
        position: relative;
        user-select: none;
        width: 20px;
        height: 20px;
        border: 0;
        margin: 0;
        overflow: hidden;
        white-space: nowrap;
        cursor: pointer;
        color: transparent;
        background-color: rgba(var(--color-text), calc(var(--color-strength) * 0.25));
        mask-repeat: no-repeat, no-repeat;
        mask-position: center center, center center;
        mask-size: 16px 16px, 16px 16px;
        -webkit-mask-repeat: no-repeat, no-repeat;
        -webkit-mask-position: center center, center center;
        -webkit-mask-size: 16px 16px, 16px 16px;
    }

    .button-open-url {
        --mask: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3"></path><line x1="8" y1="12" x2="16" y2="12"></line></svg>');
        -webkit-mask-image: var(--mask);
        mask-image: var(--mask);
    }

    .button-sync {
        --mask-ring: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/></svg>');
        --mask-arrow: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/></svg>');
    }

    .button-sync[data-state~='unsynced'] {
        -webkit-mask-image: var(--mask-arrow);
        mask-image: var(--mask-arrow);
    }

    .button-sync[data-state~='syncing'],
    .button-sync[data-state~='synced'] {
        -webkit-mask-image: var(--mask-arrow), var(--mask-ring);
        mask-image: var(--mask-arrow), var(--mask-ring);
    }

    .button-sync[data-state~='syncing']::after {
        pointer-events: none;
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        transform-origin: 10px 10px;
        width: 10px;
        height: 10px;
        background: radial-gradient(circle, rgba(var(--color-text), 1) 50%, transparent 50%);
        animation: spin 0.4s linear infinite;
    }

    @keyframes spin {
        from {
            transform: rotateZ(0);
        }

        to {
            transform: rotateZ(360deg);
        }
    }
</style>
