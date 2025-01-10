<script>
    import { getContext } from 'svelte';
    import FormRow from '../../components/FormRow.svelte';
    import Select from '../../components/Select.svelte';

    // reference to settings store
    const settings = getContext('settings');
</script>

<FormRow>
    <Select
        label="Maximum items"
        bind:value={$settings.itemLimit}
        options={[1, 2, 3, 4, 8, 16, 24]}
    />
</FormRow>

<FormRow paddingBottom="none">
    <Select
        label="When item completed"
        bind:value={$settings.itemCompleteAction}
        options={[
            ['none', 'No action'],
            ['remove', 'Remove item'],
            ['move-to-top', 'Move item to top'],
            ['move-to-bottom', 'Move item to bottom'],
        ]}
    />
</FormRow>

<!--
<div class="row">
    <Select
        label="Automatically group by category"
        bind:value={itemGroupByCategory}
        options={[
            [false, 'No'],
            [true, 'Yes'],
        ]}
    />
</div>
-->
