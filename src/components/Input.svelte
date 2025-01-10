<script>
    import getUniqueId from '../utils/getUniqueId';

    export let value = '';
    export let label = undefined;
    export let type = 'text';
    export let multiline = false;
    export let id = 'input-' + getUniqueId();
</script>

{#if multiline}
    <texarea {id} {value} />
{:else}
    <input {id} {type} {value} />
{/if}

{#if label}
    <label for={id}>{label}</label>
{/if}

<style>
    label {
        cursor: pointer;
        margin-left: 10px;
    }

    input,
    label {
        font-size: calc(var(--font-size) * 1px);
        font-family: inherit;
    }

    input[type='text'],
    input[type='number'] {
        margin: 0;
        padding: 5px 8px;
        border: 1px solid rgba(var(--color-text), 0.15);
        border-radius: calc(var(--input-border-radius) * 1px);
        color: rgb(var(--color-text));
        background-color: transparent;
    }

    /* Chrome, Safari, Edge, Opera */
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    /* Firefox */
    :where(input[type='number']) {
        -moz-appearance: textfield;
    }

    /* Custom styles */
    input[type='number'] {
    }

    :where(input[type='color']) {
        -webkit-appearance: none;
        width: calc(var(--color-picker-size) * 1px);
        height: calc(var(--color-picker-size) * 1px);
        border: 0;
        padding: 0;
        margin: 0;
        background: transparent;
        cursor: pointer;
    }

    input[type='color']::-webkit-color-swatch-wrapper {
        padding: 2px;
        border-radius: 50%;
        border: 1px solid rgba(var(--color-text), 0.15);
    }

    input[type='color']::-webkit-color-swatch {
        border: none;
        border-radius: 50%;
    }

    input[type='color'] {
        margin-left: 10px;
    }

    input[type='text'],
    input[type='number'] {
        margin: 0;
        padding: 5px 8px;
        border: 1px solid rgba(var(--color-text), 0.15);
        border-radius: calc(var(--input-border-radius) * 1px);
        color: rgb(var(--color-text));
        background-color: transparent;
    }

    input[type='text'],
    input[type='number'] {
        caret-color: rgba(var(--color-text), 0.5);
    }

    input[type='text'],
    input[type='number'] {
        text-overflow: ellipsis;
        min-width: 40px;
        overflow: hidden;
    }
</style>
