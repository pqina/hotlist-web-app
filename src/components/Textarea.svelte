<script>
    import getUniqueId from '../utils/getUniqueId';

    export let value = '';
    export let label = undefined;
    export let rows = undefined;
    export let placeholder = undefined;
    export let monospace = false;

    const id = 'input-' + getUniqueId();
</script>

<textarea {id} {value} {rows} {placeholder} data-monospace={monospace} />

{#if label}
    <label for={id}>{label}</label>
{/if}

<style>
    label {
        cursor: pointer;
        margin-left: 10px;
    }

    textarea,
    label {
        font-size: calc(var(--font-size) * 1px);
        font-family: inherit;
    }

    textarea {
        caret-color: rgba(var(--color-text), 0.5);
        resize: none;
        width: 100%;
        box-sizing: border-box;
        margin: 0;
        padding: 5px 8px;
        border: 1px solid rgba(var(--color-text), 0.15);
        border-radius: calc(var(--input-border-radius) * 1px);
        color: rgb(var(--color-text));
        background-color: transparent;
    }

    textarea[data-monospace] {
        font-family: var(--font-family-monospace);
        font-size: calc(var(--font-size) * 0.75px);
    }
</style>
