<script>
    import { spring } from 'svelte/motion';
    import { getContext, createEventDispatcher } from 'svelte';
    import VerticalPanel from './VerticalPanel.svelte';
    import isNumber from '../utils/isNumber';
    import getAsNumberOrUndefined from '../utils/getAsNumberOrUndefined';
    import measurable from '../actions/measurable';

    export let active;
    export let willFocus = undefined;

    let contentHeight;

    const dispatch = createEventDispatcher();

    const enableAnimations = getContext('enableAnimations');

    const visualHeight = spring(undefined, {
        stiffness: 0.15,
        damping: 0.35,
    });

    // need to know page padding so we can add to height
    const styles = getContext('styles');
    $: pagePadding = getAsNumberOrUndefined($styles['--page-padding']);

    // page visibility
    const animator = spring(undefined, {
        stiffness: 0.1,
        damping: 0.4,
    });
    $: animator.set(active ? 1 : 0, { hard: !$enableAnimations });

    // height of page itself
    $: height = isNumber(pagePadding) ? contentHeight : undefined;

    // update panel height
    $: height && visualHeight.set(height, { hard: !$enableAnimations });

    // dispatch resize event when height is defined and > 0
    $: active && isNumber(height) && dispatch('resize', { height });

    $: style = `transform:perspective(1000px) translateX(0) rotateY(${
        ($animator - 1) * 180
    }deg);opacity:${$animator}`;

    // focus when page is active
    let root;
    $: if (active && root) willFocus ? willFocus() : root.focus();
</script>

<div bind:this={root} class="panel" tabindex="-1" data-active={active} {style}>
    <VerticalPanel height={$visualHeight} />
    <div on:measure={(e) => (contentHeight = e.detail.height)} use:measurable>
        <slot />
    </div>
</div>

<style>
    .panel {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        z-index: 1;
        backface-visibility: hidden;
    }

    .panel:focus {
        outline: none;
    }

    .panel[data-active='false'] {
        pointer-events: none;
    }

    .panel > div {
        position: relative;
        z-index: 2;
        padding: calc(var(--page-padding) * 1px);
    }

    .panel::before {
        --size: 8px;
        content: '';
        position: absolute;
        z-index: 2;
        top: calc(-0.5 * var(--size));
        left: calc(50% - var(--size) * 0.5 + (var(--page-offset-x, 0) * 1px));
        width: var(--size);
        height: var(--size);
        pointer-events: none;
        background-color: rgb(var(--color-background));
        transform: rotateZ(45deg);
        transition: background-color var(--theme-transition);
        box-shadow: inset 1px 1px 0 0 rgba(var(--color-text), calc(var(--color-strength) * 0.05));
    }

    /* Needed on Chrome */
    :global(.Hotlist[data-env~='is-chrome']) .panel {
        transform-style: preserve-3d;
    }
</style>
