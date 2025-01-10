<script>
    import arrayEqual from '../utils/arrayEqual';
    import getUniqueId from '../utils/getUniqueId';
    import keyIsModifier from '../utils/keyIsModifier';

    export let label;
    export let id = 'shortcut-' + getUniqueId();
    export let defaultKeys = [];
    export let keys = [];

    let root;

    let recording = undefined;

    const reset = () => (keys = [...defaultKeys]);

    const clear = () => (keys = []);

    const keyMapVisual = {
        command: '⌘',
        control: '⌃',
        capslock: '⇪',
        backspace: '⌫',
        alt: '⌥',
        tab: '⇥',
        shift: '⇧',
        enter: '↩',
        space: '␣',
        arrowdown: '↓',
        arrowup: '↑',
    };

    const keyMap = {
        ' ': 'space',
        meta: 'command',
    };

    const handleKeydown = (e) => {
        e.stopPropagation();
        e.preventDefault();

        // must be in recording state
        if (!recording) return;

        // skip repeated key events
        if (e.repeat) return;

        // exit
        if (e.key === 'Escape') return reset();

        const keyLower = e.code
            .replace(/^Key/, '')
            .replace(/(Left|Right)$/, '')
            .toLowerCase();
        const key = keyMap[keyLower] || keyLower;

        // ignore if already in keys list
        if (recording.includes(key)) return;

        // can't start with non modifier key
        if (recording.length === 0 && !keyIsModifier(key)) return;

        // add key
        recording = [...recording, key];

        // finish
        if (!keyIsModifier(key)) {
            keys = [...recording];
            recording = undefined;
        }
    };

    const handleKeyup = (e) => {
        e.stopPropagation();
        if (e.key !== 'Escape') return;
        recording = undefined;
    };

    const handleRecord = (e) => {
        e.target.focus();
        recording = [];
    };

    const handleReset = (e) => {
        e.stopPropagation();
        reset();
    };

    const handleClickOutside = (e) => {
        if (!root.contains(e.target)) recording = undefined;
    };

    // show recording keys while recording, if not recording show saved keys, if no saved keys, show defaults
    $: currentKeys = recording ? recording : keys.length ? keys : defaultKeys;
</script>

<svelte:body on:click={recording && handleClickOutside} />

<div bind:this={root}>
    <label for={id}>{label}</label>
    <span class="recorder" data-state={recording ? 'recording' : 'idle'}>
        <button
            {id}
            class="record"
            type="button"
            on:click={handleRecord}
            on:keydown={handleKeydown}
            on:keyup={handleKeyup}
        >
            {#if currentKeys.length}
                <output class="keys">
                    {#each currentKeys as key}
                        <kbd data-key={key.toLowerCase()}
                            ><span>{keyMapVisual[key] || key.toLowerCase()}</span></kbd
                        >
                    {/each}
                </output>
            {:else if recording}
                Hold keys
            {:else}
                <span class="empty">none</span>
            {/if}
        </button>

        {#if keys.length && !arrayEqual(keys, defaultKeys) && !recording}
            <button class="clear" type="button" on:click={handleReset}>&times;</button>
        {/if}
    </span>
</div>

<style>
    div {
        display: flex;
        align-items: center;
    }

    label {
        color: rgb(var(--color-text));
        cursor: pointer;
        font-size: calc(var(--font-size) * 1px);
        transition: color var(--theme-transition);
    }

    .recorder {
        position: relative;
        margin-left: auto;
        display: flex;
        color: rgba(var(--color-text), 1);
        background-color: rgba(var(--color-text), 0.05);
        align-items: center;
        border-radius: 50px;
        width: 200px;
    }

    .recorder button {
        background-color: transparent;
        cursor: pointer;
        border: 0;
        outline: 0;
        padding: 0;
        margin: 0;
        color: inherit;
    }

    .recorder .record {
        width: 100%;
        display: flex;
        padding: 5px 10px;
        align-items: center;
        justify-content: center;
        height: 27px;
    }

    .recorder .clear {
        position: absolute;
        right: 5px;
        top: 4px;
        border-radius: 10px;
        min-width: 16px;
        height: 16px;
        margin-left: 10px;
        opacity: 0.25;
    }

    output {
        color: inherit;
    }

    .keys {
        font-size: 14px;
        display: flex;
        margin: 0;
        max-width: 80%;
        pointer-events: none;
        align-items: center;
        justify-content: center;
    }

    kbd {
        display: block;
        margin-right: 5px;
        font-family: 'Helvetica Neue', Helvetica, Verdana, Helvetica, Tahoma, Arial, sans-serif;
        text-transform: uppercase;
        background-color: rgba(var(--color-background), 1);
        border-radius: 2px;
        min-width: 20px;
        min-height: 18px;
        box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(var(--color-text), calc(var(--color-strength) * 0.05));
    }

    kbd span {
        position: relative;
        top: 1px;
    }

    kbd[data-key*='shift'] span,
    kbd[data-key*='command'] span,
    kbd[data-key*='alt'] span,
    kbd[data-key*='ctrl'] span,
    kbd[data-key*='backspace'] span {
        top: 0;
    }

    kbd[data-key*='arrow'] span {
        top: -1px;
    }

    kbd[data-key*='enter'] span {
        top: 2px;
    }

    .empty {
        opacity: 0.5;
        pointer-events: none;
    }

    @keyframes pulse {
        from {
            opacity: 0.5;
        }
        to {
            opacity: 1;
        }
    }
</style>
