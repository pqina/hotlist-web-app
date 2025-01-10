import { writable } from 'svelte/store';

/**
 * Svelte Media Query Store
 * @param query { string }
 */
export default (query) => {
    const { subscribe, set } = writable(undefined, () => {
        // start observing media query
        let mql = window.matchMedia(query);

        // set current media query result
        set(mql.matches);

        // called when media query state changes
        const onchange = () => set(mql.matches);

        // listen for changes
        'addEventListener' in mql
            ? mql.addEventListener('change', onchange)
            : mql.addListener(onchange);

        // when no more listeners
        return () => {
            // stop listening
            'removeEventListener' in mql
                ? mql.removeEventListener('change', onchange)
                : mql.removeListener(onchange);
        };
    });

    return { subscribe };
};
