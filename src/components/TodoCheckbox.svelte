<script>
    import { createEventDispatcher } from 'svelte';
    import { spring } from 'svelte/motion';
    import getUniqueId from '../utils/getUniqueId';

    // event handling
    const dispatch = createEventDispatcher();

    export let id = 'checkbox-' + getUniqueId();
    export let checked = false;
    export let disabled = false;
    export let animator = 1;
</script>

<div class="wrapper" style="--animator:{animator}">
    <input {id} type="checkbox" on:change={() => dispatch('change')} {checked} {disabled} />
    <div class="checkbox-transform">
        <div class="checkbox">
            <span class="checkmark" />
        </div>
    </div>
</div>

<style>
    .wrapper {
        opacity: var(--animator);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;

        --checkbox-shadow: 0 0 0 1px rgba(var(--color-text), 0.2),
            0 1px 2.5px rgba(var(--color-text), 0.15), 0 2px 5px rgba(var(--color-text), 0.05),
            0 3px 10px rgba(var(--color-text), 0.15);

        --checkbox-shadow-active: 0 0 0 1px rgba(var(--color-text), 0.25),
            0 1px 2.5px rgba(var(--color-text), 0.05), 0 2px 5px rgba(var(--color-text), 0.05),
            0 3px 10px rgba(var(--color-text), 0.05);
    }

    :global(.Hotlist:not([data-theme='light'])) .wrapper {
        --checkbox-shadow: 0 0 0 1px rgba(var(--color-text), 0.2),
            0 2px 2px 1px rgba(var(--color-background), 0.75),
            0 1px 2.5px rgba(var(--color-text), 0.1), 0 2px 5px rgba(var(--color-text), 0.05),
            0 3px 10px rgba(var(--color-text), 0.05);

        --checkbox-shadow-active: 0 0 0 1px rgba(var(--color-text), 0.2),
            0 2px 2px 1px rgba(var(--color-background), 0.25),
            0 1px 2.5px rgba(var(--color-text), 0.05), 0 2px 5px rgba(var(--color-text), 0.05),
            0 3px 10px rgba(var(--color-text), 0.05);
    }

    .checkbox-transform {
        pointer-events: none;
        transform: scale(var(--animator));
    }

    .checkbox {
        --size: calc(var(--checkbox-size) * 1px);

        position: relative;
        width: var(--size);
        height: var(--size);
        z-index: 1;

        border-radius: calc(var(--checkbox-border-radius) * 1px);
        transition: transform 0.1s ease-out, box-shadow 0.2s ease-out, opacity 0.2s ease-out;

        box-shadow: var(--checkbox-shadow);

        --fill: rgba(var(--color-text), 0.025);
        background: rgb(var(--color-background)) linear-gradient(var(--fill), var(--fill));
    }

    .checkmark {
        --mask: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>');
        background-color: rgba(var(--color-text), 0.85);
        mask: var(--mask) no-repeat center / 70% 70%;
        -webkit-mask: var(--mask) no-repeat center / 70% 70%;
        transition: all 0.1s ease-in;
        transform: scale(0.8);
        opacity: 0;
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
    }

    input {
        --cs: calc(var(--checkbox-size) * 1px);
        appearance: none;
        -webkit-appearance: none;
        margin: 0;
        padding: 0;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        cursor: pointer;
        outline: 0;
    }

    input:checked + .checkbox-transform .checkmark {
        transform: scale(1);
        opacity: 1;
    }

    input:active + .checkbox-transform .checkbox {
        transform: translateY(1px) scale(0.98);
        box-shadow: var(--checkbox-shadow-active);
    }

    input[disabled] + .checkbox-transform .checkbox {
        opacity: 0.5;
    }
</style>
