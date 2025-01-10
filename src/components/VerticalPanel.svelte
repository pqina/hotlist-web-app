<script>
    import { getContext } from 'svelte';

    // props
    export let height;

    // context
    const styles = getContext('styles');

    // helpers
    const getShadowStyle = (size) => {
        let shadows = [];
        let i = 1;
        while (i < size) {
            i *= 2;
            shadows.push(
                `0 ${i}px ${i}px rgba(var(--page-shadow-color), var(--page-shadow-opacity))`
            );
        }
        return shadows.join(',');
    };

    // reactive vars
    $: shadowSize = $styles['--page-shadow-size'];

    $: borderRadius = $styles['--page-border-radius'];

    $: shadowStyle = shadowSize && getShadowStyle(shadowSize);

    $: panelHeight = typeof height === 'number' ? Math.max(height, 0) : 0;

    $: panelBorderRadius = panelHeight ? Math.min(panelHeight / 2, borderRadius || 0) : 0;
</script>

<div
    class="vertical-panel"
    style="--vbr:{panelBorderRadius};--height:{panelHeight};--sh:{shadowStyle || 'none'}"
>
    <div class="n" />
    <div class="c" />
    <div class="s" />
</div>

<style>
    .vertical-panel {
        --br: calc(var(--vbr) * 1px);
        --h: calc(var(--height) * 1px);
        --s: calc(var(--height) - var(--vbr) * 2);
        --bg: rgb(var(--color-background));
        position: absolute;
        left: 0;
        right: 0;
        height: var(--h);
        box-shadow: var(--sh);
        border-radius: var(--br);
        pointer-events: none;
    }

    .n,
    .s {
        height: var(--br);
    }

    .n,
    .c,
    .s,
    .s::before {
        left: 0;
        right: 0;
        position: absolute;
        background-color: var(--bg);
        transition: background-color var(--theme-transition);
    }

    /* this fixes a seam between .c and .s */
    .s::before {
        content: '';
        top: -1px;
        height: 2px;
    }

    .n {
        top: 0;
        border-top-left-radius: var(--br);
        border-top-right-radius: var(--br);
    }
    .c {
        z-index: 1;
    }

    .c,
    .s {
        top: var(--br);
    }

    .c {
        height: 1px;
        transform: scale3d(1, var(--s), 1);
        transform-origin: 0 0;
    }

    .s {
        transform: translate3d(0, calc(var(--s) * 1px), 0);
        border-bottom-left-radius: var(--br);
        border-bottom-right-radius: var(--br);
    }

    /* inner border */
    .vertical-panel {
        --border-width: 1px;
        --border-color: rgba(var(--color-text), calc(var(--color-strength) * 0.05));

        --bc: var(--border-color);
        --bw: var(--border-width);
        --bw-neg: calc(-1 * var(--border-width));
    }

    /* left and right inner edges */
    .c::after,
    .n::after,
    .s::after {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        border-left: var(--bw) solid var(--bc);
        border-right: var(--bw) solid var(--bc);
        border-radius: inherit;
    }

    /* top inner edge */
    .n::after {
        border-top: var(--bw) solid var(--bc);
    }

    /* bottom inner edge */
    .s::after {
        border-bottom: var(--bw) solid var(--bc);
    }
</style>
