import { writable } from 'svelte/store';
import { loop } from 'svelte/internal';

const isArray = (arr) => Array.isArray(arr);

function tick_spring(ctx, last_value, current_value, target_value) {
    if (typeof current_value === 'number') {
        // @ts-ignore
        const delta = target_value - current_value;
        // @ts-ignore
        const velocity = (current_value - last_value) / (ctx.dt || 1 / 60); // guard div by 0
        const spring = ctx.opts.stiffness * delta;
        const damper = ctx.opts.damping * velocity;
        const acceleration = (spring - damper) * ctx.inv_mass;
        const d = (velocity + acceleration) * ctx.dt;

        if (Math.abs(d) < ctx.opts.precision && Math.abs(delta) < ctx.opts.precision) {
            return target_value; // settled
        } else {
            ctx.settled = false; // signal loop to keep ticking
            // @ts-ignore
            return current_value + d;
        }
    } else if (isArray(current_value)) {
        // @ts-ignore
        return current_value.map((_, i) =>
            tick_spring(ctx, last_value[i], current_value[i], target_value[i])
        );
    } else if (typeof current_value === 'object') {
        const next_value = {};
        // @ts-ignore
        for (const k in current_value) {
            // @ts-ignore
            next_value[k] = tick_spring(ctx, last_value[k], current_value[k], target_value[k]);
        }
        // @ts-ignore
        return next_value;
    } else {
        throw new Error(`Cannot spring ${typeof current_value} values`);
    }
}

export default function spring(value, opts = {}) {
    const store = writable(value);
    const { stiffness = 0.15, damping = 0.8, precision = 0.01 } = opts;

    let last_time;
    let task;
    let current_token;
    let last_value = value;
    let target_value = value;

    let inv_mass = 1;
    let inv_mass_recovery_rate = 0;
    let cancel_task = false;

    function set(new_value, opts = {}) {
        target_value = new_value;
        const token = (current_token = {});

        if (value == null || opts.hard || (spring.stiffness >= 1 && spring.damping >= 1)) {
            cancel_task = true; // cancel any running animation
            last_time = null;
            last_value = new_value;
            store.set((value = target_value));
            return Promise.resolve();
        } else if (opts.soft) {
            const rate = opts.soft === true ? 0.5 : +opts.soft;
            inv_mass_recovery_rate = 1 / (rate * 60);
            inv_mass = 0; // infinite mass, unaffected by spring forces
        }

        if (!task) {
            last_time = null;
            cancel_task = false;

            const ctx = {
                inv_mass: undefined,
                opts: spring,
                settled: true,
                dt: undefined,
            };

            task = loop((now) => {
                if (last_time === null) last_time = now;

                if (cancel_task) {
                    cancel_task = false;
                    task = null;
                    return false;
                }

                inv_mass = Math.min(inv_mass + inv_mass_recovery_rate, 1);

                // altered so doesn't create a new object
                ctx.inv_mass = inv_mass;
                ctx.opts = spring;
                ctx.settled = true; // tick_spring may signal false
                ctx.dt = ((now - last_time) * 60) / 1000;

                const next_value = tick_spring(ctx, last_value, value, target_value);

                last_time = now;
                last_value = value;
                store.set((value = next_value));

                if (ctx.settled) task = null;
                return !ctx.settled;
            });
        }

        return new Promise((fulfil) => {
            task.promise.then(() => {
                if (token === current_token) fulfil();
            });
        });
    }

    const spring = {
        set,
        update: (fn, opts) => set(fn(target_value, value), opts),
        subscribe: store.subscribe,
        stiffness,
        damping,
        precision,
    };

    return spring;
}
