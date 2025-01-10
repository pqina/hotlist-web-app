<script>
    import { getContext } from 'svelte';
    import FormRow from '../../components/FormRow.svelte';
    import Select from '../../components/Select.svelte';

    // reference to settings store
    const settings = getContext('settings');
</script>

<FormRow paddingBottom="none">
    <Select
        label="Theme"
        bind:value={$settings.theme}
        options={[
            ['auto', 'Auto'],
            ['light', 'Light'],
            ['dim', 'Dim'],
            ['dark', 'Dark'],
        ]}
    />
</FormRow>
<!-- 
<FormRow paddingBottom="none">
    <Select
        label="Tag style"
        bind:value={itemTagStyle}
        options={[
            ['bubble', 'Bubble'],
            ['dot', 'Dot'],
        ]}
    />
</FormRow> 
-->
