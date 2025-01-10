<script>
    import { getContext } from 'svelte';
    import FormRow from '../../components/FormRow.svelte';
    import Shortcut from '../../components/Shortcut.svelte';

    // settings
    const settings = getContext('settings');
</script>

<FormRow>
    <Shortcut label="Toggle Hotlist" defaultKeys={[]} bind:keys={$settings.shortcutToggleHotlist} />
</FormRow>

<FormRow>
    <Shortcut
        label="Toggle item done"
        defaultKeys={['command', 'enter']}
        bind:keys={$settings.shortcutToggleItemDone}
    />
</FormRow>

<FormRow>
    <Shortcut
        label="Remove item"
        defaultKeys={['command', 'backspace']}
        bind:keys={$settings.shortcutRemoveItem}
    />
</FormRow>

<FormRow>
    <Shortcut
        label="Move item up"
        defaultKeys={['alt', 'arrowup']}
        bind:keys={$settings.shortcutMoveItemUp}
    />
</FormRow>

<FormRow>
    <Shortcut
        label="Move item down"
        defaultKeys={['alt', 'arrowdown']}
        bind:keys={$settings.shortcutMoveItemDown}
    />
</FormRow>

<FormRow paddingBottom="none">
    <Shortcut
        label="Sync item"
        defaultKeys={['command', 's']}
        bind:keys={$settings.shortcutSyncItem}
    />
</FormRow>
