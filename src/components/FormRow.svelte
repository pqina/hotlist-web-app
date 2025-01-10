<script>
    export let borderPosition = 'top';
    export let paddingBottom = 'default';
</script>

<div data-border-position={borderPosition} data-padding-bottom={paddingBottom}>
    <slot />
</div>

<style>
    div {
        padding: 16px 16px;
        margin: 0 -16px;
        border-style: solid;
        border-color: rgba(var(--color-text), calc(var(--color-strength) * 0.05));
        border-width: 0;
        transition: border-color var(--theme-transition);
    }

    div[data-border-position='top'] {
        border-top-width: 1px;
    }

    div[data-border-position='bottom'] {
        border-bottom-width: 1px;
    }

    div[data-border-position='both'] {
        border-top-width: 1px;
        border-bottom-width: 1px;
    }
    div[data-padding-bottom='none'] {
        padding-bottom: 0;
    }
</style>
