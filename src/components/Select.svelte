<script>
    import getUniqueId from '../utils/getUniqueId';

    export let options = [];
    export let value = undefined;
    export let label = undefined;
    export let labelPosition = 'before';
    export let id = 'select-' + getUniqueId();
</script>

<div data-label-position={labelPosition}>
    <label for={id}>{label}</label>
    <span>
        <select {id} bind:value>
            {#each options as option}
                <option value={Array.isArray(option) ? option[0] : option}
                    >{Array.isArray(option) ? option[1] : option}</option
                >
            {/each}
        </select>
    </span>
</div>

<style>
    div {
        display: flex;
        align-items: center;
    }

    div[data-label-position='before'] {
        flex-direction: row;
    }

    div[data-label-position='after'] {
        flex-direction: row-reverse;
    }

    div[data-label-position='after'] label {
        margin-left: auto;
    }

    div[data-label-position='before'] label {
        margin-right: auto;
    }

    label {
        color: rgb(var(--color-text));
        cursor: pointer;
        font-size: calc(var(--font-size) * 1px);
        transition: color var(--theme-transition);
    }

    select::-ms-expand {
        display: none;
    }

    select {
        --border-color: rgba(var(--color-text), calc(var(--color-strength) * 0.1));
        --border-width: 1px;
        -webkit-appearance: none;
        appearance: none;
        font-size: calc(var(--font-size) * 1px);
        font-family: inherit;
        font-weight: 400;
        margin: 0;
        padding: 5px 40px 5px 14px;
        width: auto;
        box-shadow: 0 0 0 var(--border-width) var(--border-color);
        border: 0;
        border-radius: 9999px;
        color: rgb(var(--color-text));
        cursor: pointer;
        outline: none;
        background-color: transparent;
        transition: color var(--theme-transition), box-shadow var(--theme-transition);
    }

    select:focus-visible {
        --border-color: rgb(var(--color-text));
        --border-width: 2px;
    }

    span {
        position: relative;
    }

    span::after {
        pointer-events: none;
        user-select: none;
        content: '';
        position: absolute;
        width: 14px;
        height: 14px;
        right: 8px;
        top: 6px;
        background-color: rgb(var(--color-text));
        transition: background-color var(--theme-transition);
        --svg: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 10 12 16 18 10"/></svg>');
        -webkit-mask: var(--svg);
        mask: var(--svg) no-repeat center center / 100% 100%;
    }
</style>
