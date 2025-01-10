//
// for the 'measure' event to be handled the on:measure attribute needs to precede the use:measurable attribute
// <node on:measure use:measurable/>
//

import hasResizeObserver from '../utils/hasResizeObserver';
const rectCreateEmpty = () => ({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
});

const rectUpdate = (rect, x, y, width, height) => {
    rect.x = x;
    rect.y = y;
    rect.width = width;
    rect.height = height;
    return rect;
};

const rectEqual = (a, b) =>
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

const rectUpdateWithRect = (a, b) => {
    a.x = b.x;
    a.y = b.y;
    a.width = b.width;
    a.height = b.height;
    return a;
};

const rectNext = rectCreateEmpty();

const updateNodeRect = (node, x, y, width, height) => {
    if (!node.rect) node.rect = rectCreateEmpty();

    const rect = node.rect;

    rectUpdate(rectNext, x, y, width, height);

    if (rectEqual(rect, rectNext)) return;

    rectUpdateWithRect(rect, rectNext);

    node.dispatchEvent(new CustomEvent('measure', { detail: rect }));
};

// measures the element
const r = Math.round;
const measureViewRect = (node) => {
    const clientRect = node.getBoundingClientRect();
    updateNodeRect(
        node,
        r(clientRect.x),
        r(clientRect.y),
        r(clientRect.width),
        r(clientRect.height)
    );
};

const measureOffset = (node) =>
    updateNodeRect(node, node.offsetLeft, node.offsetTop, node.offsetWidth, node.offsetHeight);

// holds all the elements to measure using requestAnimationFrame
const elements = [];

// draw loop
let frame = null;
function tick() {
    if (!elements.length) {
        frame = null;
        return;
    }
    elements.forEach((node) => node.measure(node));
    frame = requestAnimationFrame(tick);
}

let observer;

// total observed elements so we know when we can unload observer
let observedNodes = 0;

export default (node, options = {}) => {
    const {
        observePosition = false,
        observeViewRect = false,
        once = false,
        disabled = false,
    } = options;

    // exit
    if (disabled) return;

    // use resize observe if available
    if (hasResizeObserver() && !observePosition && !observeViewRect) {
        // we only create one observer, it will observe all registered elements
        if (!observer) {
            observer = new ResizeObserver((entries) => {
                entries.forEach((entry) => measureOffset(entry.target));
            });
        }

        // start observing this node
        observer.observe(node);

        // measure our node for the first time
        measureOffset(node);

        // if should only measure once, remove now
        if (once) {
            observer.unobserve(node);
        } else {
            observedNodes++;
        }

        // and we done, need to return a clean up method for when our node is destroyed
        return {
            destroy() {
                // already unobserved this node
                if (once) return;

                // stop observing this node
                observer.unobserve(node);

                // test if all nodes have been removed, if so, remove observer
                observedNodes--;
                if (observedNodes === 0) {
                    observer.disconnect();
                    observer = undefined;
                }
            },
        };
    }

    // set measure function
    node.measure = observeViewRect ? measureViewRect : measureOffset;

    // add so the element is measured
    elements.push(node);

    // start measuring on next frame, we set up a single measure loop,
    // the loop will check if there's still elements that need to be measured,
    // else it will stop running
    if (!frame) frame = requestAnimationFrame(tick);

    // measure this element now
    node.measure(node);

    // remove method
    return {
        destroy() {
            const index = elements.indexOf(node);
            elements.splice(index, 1);
            delete node.measure;
        },
    };
};
