<script>
    import { getContext } from 'svelte';
    import ItemInput from '../../components/ItemInput.svelte';
    import needleToTitle from '../../utils/needleToTitle';
    import capitalizeFirstLetter from '../../utils/capitalizeFirstLetter';
    import FormRow from '../../components/FormRow.svelte';
    import getUniqueId from '../../utils/getUniqueId';

    // settings
    const settings = getContext('settings');

    // need these two props
    let { itemTags } = $settings;

    // update settings when property values change
    $: $settings.itemTags = itemTags.length
        ? itemTags
        : [{ key: getUniqueId(), needle: '', style: $settings.itemTagsColorPalette[0] }];

    const addTag = () => {
        const tagIndex = itemTags.length;
        itemTags = [
            ...itemTags,
            { key: getUniqueId(), needle: '', style: $settings.itemTagsColorPalette[tagIndex] },
        ];
    };
</script>

<FormRow paddingBottom="none">
    <fieldset>
        <legend>tags</legend>
        <ItemInput
            labelAdd="Add tag"
            labelRemove="Remove tag"
            maxItems={$settings.itemTagsColorPalette.length}
            addItem={addTag}
            bind:items={itemTags}
        >
            <svelte:fragment let:item>
                <span class="tag-color">
                    <select value={item.style} data-prop="style">
                        {#each $settings.itemTagsColorPalette as option}
                            <option value={option}>{capitalizeFirstLetter(option)}</option>
                        {/each}
                    </select>
                    <span style="--background-color: rgb(var(--{item.style}-background))">
                        {item.style}
                    </span>
                </span>

                <!-- String to search for -->
                <input
                    spellcheck="false"
                    autocomplete="off"
                    class="tag-needle"
                    type="text"
                    data-prop="needle"
                    value={item.needle}
                    placeholder="Matches"
                />

                <!-- Optional label -->
                <input
                    spellcheck="false"
                    autocomplete="off"
                    class="tag-label"
                    type="text"
                    data-prop="label"
                    value={item.label && item.label.length ? item.label : ''}
                    placeholder={(item.needle && needleToTitle(item.needle)) || 'Label'}
                />
            </svelte:fragment>
        </ItemInput>
    </fieldset>
</FormRow>

<style>
    fieldset,
    legend {
        padding: 0;
        margin: 0;
    }

    fieldset {
        position: relative;
        border: 0;
    }

    legend {
        display: none;
    }

    /* categories */
    .tag-color,
    .tag-needle,
    .tag-label {
        font-size: calc(var(--font-size) * 1px);
        font-family: inherit;
        font-weight: 400;
        box-sizing: border-box;
        margin: 0;
        padding: 6px 8px;
        width: auto;
        box-shadow: inset 0 0 0 1px rgba(var(--color-text), calc(var(--color-strength) * 0.1));
        border: 0;
        background-color: rgb(var(--color-background));
        color: rgb(var(--color-text));
        outline: none;
        transition: color var(--theme-transition), background-color var(--theme-transition),
            box-shadow var(--theme-transition);
    }

    .tag-color {
        align-self: stretch;
        position: relative;
        border-radius: 8px 0 0 8px;
        padding: 0;
        width: 27px;
    }

    .tag-needle {
        margin-left: -1px;
        border-radius: 0;
        width: 160px;
    }

    .tag-label {
        border-radius: 0 8px 8px 0;
        margin-left: -1px;
        flex: 1;
        width: 100px;
    }

    /* color control */
    .tag-color select {
        -webkit-appearance: none;
        appearance: none;
        font-size: calc(var(--font-size) * 1px);
        font-family: inherit;
        font-weight: 400;
        margin: 0;
        padding: 0;
        border: 0;
        opacity: 0;
        width: 100%;
        height: 100%;
        position: absolute;
        cursor: pointer;
    }

    .tag-color span {
        pointer-events: none;
        position: absolute;
        display: block;
        width: 10px;
        height: 10px;
        left: 9px;
        top: 9px;
        border-radius: 4px;
        margin: 0;
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.15);
        background-color: var(--background-color);
        font-size: 0;
        color: transparent;
    }
</style>
