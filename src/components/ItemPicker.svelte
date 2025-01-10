<script>
    import getUniqueId from '../utils/getUniqueId';

    export let items = [];
    export let selected = undefined;
    export let name = 'item-picker-' + getUniqueId();
    export let itemToId = (item) => name + '-' + item[1].toLowerCase();
</script>

<div class="items">
    {#each items as item}
        <div>
            <input bind:group={selected} id={itemToId(item)} type="radio" {name} value={item} />
            <slot {item} id={itemToId(item)} selected={item === selected} />
        </div>
    {/each}
</div>

<style>
    .items {
        display: flex;
    }

    input {
        position: absolute;
        appearance: none;
        -webkit-appearance: none;
        margin: 0;
        width: 0;
        height: 0;
    }
</style>
