<script>
    import noop from '../utils/noop';

    export let items = [];
    export let labelAdd = 'Add';
    export let labelRemove = 'Remove';
    export let addItem = noop;
    export let maxItems = Number.POSITIVE_INFINITY;

    const removeItem = (needle) => (items = items.filter((item) => item !== needle));

    const handleChange = (needle, e) => {
        // duplicate original
        const itemValue = { ...needle };

        // get value entered
        const { value } = e.target;

        // get element index
        const prop = e.target.dataset.prop;
        itemValue[prop] = value;

        // update items
        items = items.map((item) => {
            if (item === needle) {
                return itemValue;
            }
            return item;
        });
    };
</script>

<div>
    <ul>
        {#each items as item}
            <li data-item on:input={(e) => handleChange(item, e)}>
                <slot {item}>Edit slot template missing</slot>
                <button
                    class="button-remove"
                    aria-label={labelRemove}
                    title={labelRemove}
                    type="button"
                    on:click={(e) => {
                        e.stopPropagation();
                        removeItem(item);
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><polyline points="3 6 5 6 21 6" /><path
                            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                        /><line x1="10" y1="11" x2="10" y2="17" /><line
                            x1="14"
                            y1="11"
                            x2="14"
                            y2="17"
                        /></svg
                    >
                </button>
            </li>
        {/each}
    </ul>
    {#if items.length < maxItems}
        <div class="button-row">
            <button class="button-add" type="button" on:click={addItem}>{labelAdd}</button>
        </div>
    {/if}
</div>

<style>
    ul,
    li {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    li {
        display: flex;
        align-items: center;
    }

    li + li {
        margin-top: 10px;
    }

    button {
        background: none;
        padding: 0;
        margin: 0;
        border: 0;
        cursor: pointer;
    }

    .button-remove {
        margin-left: 10px;
        color: rgba(var(--color-text), 0.4);
        font-size: 16px;
        font-weight: 600;
        transition: color var(--theme-transition);
    }

    .button-remove svg {
        width: 12px;
        height: 12px;
        display: block;
    }

    .button-add {
        padding: 6px 14px;
        margin: 0;
        border-radius: 99px;
        font-size: 12px;
        cursor: pointer;
        border: 0;
        color: rgb(var(--color-text));
        box-shadow: inset 0 0 0 1px rgba(var(--color-text), calc(var(--color-strength) * 0.05));
        background-color: rgba(var(--color-text), calc(var(--color-strength) * 0.05));
        transition: background-color var(--theme-transition), color var(--theme-transition);
    }

    ul:not(:empty) + .button-row {
        margin-top: 16px;
    }

    .button-row {
        display: flex;
        justify-content: center;
    }
</style>
