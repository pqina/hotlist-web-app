<script>
    import { createEventDispatcher } from 'svelte';

    import Generic from './Settings/Generic.svelte';
    import Style from './Settings/Style.svelte';
    import Tags from './Settings/Tags.svelte';
    import Shortcuts from './Settings/Shortcuts.svelte';
    import Sync from './Settings/Sync.svelte';

    // events
    const dispatch = createEventDispatcher();

    /**
     * Tabs
     * @type { [string, string, object][] }
     */
    const tabsDef = [
        ['general', 'General', Generic],
        ['tags', 'Tags', Tags],
        ['style', 'Style', Style],
        ['shortcuts', 'Shortcuts', Shortcuts],
        ['sync', 'Sync', Sync],
    ];

    let tabActive = 'general';

    $: tabs = tabsDef.map(([id, label, component]) => ({
        id,
        selected: id === tabActive,
        component,
        label,
        handleClick: (e) => {
            // don't change URL
            e.preventDefault();

            // set to active
            tabActive = id;
        },
    }));

    /**
     * close event for settings page
     * @param {Event} e
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch('close');
    };

    const handleKeydown = (e) => {
        // Handle escape to close form
        if (!/escape/i.test(e.key)) return;
        e.stopPropagation();
        dispatch('close');
    };
</script>

<form on:keydown={handleKeydown} on:submit={handleSubmit}>
    <ul class="tabs">
        {#each tabs as tab}
            <li class="tab" data-selected={tab.selected}>
                <a draggable="false" href="#tab-{tab.id}" on:click={tab.handleClick}>{tab.label}</a>
            </li>
        {/each}
    </ul>

    {#each tabs as tab}
        <div class="tab-panel" id="tab-{tab.id}" hidden={!tab.selected}>
            <svelte:component this={tab.component} />
        </div>
    {/each}

    <button class="button-close" type="button" on:click={handleSubmit} title="Close">
        &times;
    </button>
</form>

<style>
    form {
        --font-size: 13;
    }

    .tabs {
        display: flex;
        justify-content: flex-start;
        margin: calc(var(--page-padding) * -1px) calc(var(--page-padding) * -1px) 0;
        padding: calc(var(--page-padding) * 1px) 0 calc(var(--page-padding) * 1px)
            calc(var(--page-padding) * 1px);
        list-style: none;
        background: linear-gradient(
            to top,
            rgba(var(--color-text), calc(var(--color-strength) * 0.0325)),
            rgba(var(--color-text), calc(var(--color-strength) * 0))
        );
    }

    .tab {
        margin-left: 0;
    }

    .tab a {
        font-size: 13px;
        font-weight: 500;
        color: rgba(var(--color-text), calc(var(--color-strength) * 0.35));
        text-decoration: none;
        display: block;
        padding: 0 14px;
        height: 28px;
        line-height: 28px;
        border-radius: 4px;
    }

    .tab[data-selected='true'] a {
        color: rgba(var(--color-text), 1);

        background-color: rgb(var(--color-background));

        --color: rgb(0, 0, 0, calc(var(--color-strength) * 0.05));

        box-shadow: 0 0 0 1px rgba(var(--color-text), calc(var(--color-strength) * 0.05)),
            0 1px 1px var(--color), 0 2px 2px var(--color), 0 4px 4px var(--color);
    }

    .button-close {
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        right: calc(var(--page-padding) * 1px);
        top: calc(var(--page-padding) * 0.85px);
        border: 0;
        padding: 0;
        width: 32px;
        height: 32px;
        font-size: 16px;
        font-weight: 300;
        color: rgba(var(--color-text), calc(var(--color-strength) * 0.25));
        background-color: transparent;
        cursor: pointer;
    }
</style>
