/**
 * @param { object } group
 * @param { function } factory
 * @param { object } factoryProps
 * @returns { object }
 */
export default (group, factory, factoryProps) => {
    let stores = {};
    let state = {};
    let subs = [];
    // let unsubs = [];

    const destroy = () => {
        // unsub from all stores
        Object.values(stores).forEach(({ unsub }) => {
            unsub();
        });

        // reset stores
        stores = {};
        // unsubs.forEach((unsub) => unsub());
        // unsubs = [];
    };

    const createStore = (key, value) => {
        const store = factory(value, factoryProps);

        stores[key] = {
            store,
            unsub: store.subscribe((value) => {
                // current value
                state[key] = value;

                // notify all subs
                subs.forEach((fn) => fn(state));
            }),
        };

        // const unsub = store.subscribe((value) => {
        //   values[key] = value;
        //   subs.forEach((sub) => sub(values));
        // });

        // unsubs.push(unsub);
    };

    const init = () => {
        destroy();

        Object.entries(group).forEach(([key, value]) => createStore(key, value));
    };

    init();

    return {
        subscribe: (fn) => {
            // for new store updates
            subs.push(fn);

            // return current state
            fn(state);

            return () => (subs = subs.filter((sub) => sub === fn));
        },
        set: (group, options) => {
            // new assignments
            const groupKeys = Object.keys(group);

            // remove keys not in group
            Object.entries(stores)
                .filter(([key]) => !groupKeys.includes(key))
                .forEach(([key, { store, unsub }]) => {
                    delete stores[key];
                    delete state[key];
                    unsub();
                });

            // update stores
            groupKeys.forEach((key) => {
                // create store if doesn't exists
                if (!stores[key]) createStore(key, group[key]);

                // set new store value if does
                stores[key].store.set(group[key], options);
            });

            // subs.forEach((sub) => sub(state));
        },
        reset: () => {
            // Object.keys(group).forEach((key) => {
            //   stores[key].set(group[key], { hard: true });
            // });
        },
        unsubscribe: destroy,
    };
};
