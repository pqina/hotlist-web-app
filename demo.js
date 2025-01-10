import { Hotlist } from './src/main.js';

// ref to hotlist icon
const positionApp = () => {
    const iconRect = appIcon.getBoundingClientRect();
    const panelWidth = document.querySelector('.Hotlist').offsetWidth;
    document.querySelector('.app').style.left = `${
        iconRect.x + iconRect.width * 0.5 - panelWidth * 0.5
    }px`;
};

const appIcon = document.querySelector('.hotlist-icon');
appIcon.addEventListener('click', (e) => {
    app.activePage = 'todolist';
    app.visible = !app.visible;

    positionApp();

    if (!trayMenu.hidden) trayMenu.hidden = true;

    e.stopPropagation();
});

window.addEventListener('resize', positionApp);

// hide
document.addEventListener('click', (e) => {
    trayMenu.hidden = true;

    if (trayMenu.contains(e.target)) return;

    if (app.visible) {
        if (!document.querySelector('#app').contains(e.target)) {
            app.visible = false;
        }
    }
});

//
// Tray menu
//
const trayMenu = [
    [
        'clear_completed',
        'Clear completed',
        {
            onclick: () => {
                app.items = app
                    .getState()
                    // remove empty items
                    .items.filter((item) => item.value.length)
                    // remove done
                    .filter((item) => !item.isDone);
            },
        },
    ],
    ['version', 'Beta v0.0.20', { disabled: true }],
    ['---'],
    [
        'view_settings',
        'Settings…',
        {
            onclick: () => {
                positionApp();
                app.activePage = 'settings';
                app.visible = true;
            },
        },
    ],
    ['---'],
    [
        'reset_list',
        'Reset list',
        {
            onclick: () => {
                app.items = [];
            },
        },
    ],
    ['---'],
    [
        'check_for_updates',
        'Check for updates…',
        {
            onclick: () => {
                console.log('checking for updates');
            },
        },
    ],
    ['---'],
    [
        'quit',
        'Quit',
        {
            onclick: () => {
                app.visible = false;
            },
        },
    ],
].reduce((list, item) => {
    const [id, label, { disabled, onclick } = {}] = item;
    const node = document.createElement('li');
    if (id === '---') {
        node.append(document.createElement('hr'));
        list.append(node);
        return list;
    }

    node.textContent = label;
    node.dataset.disabled = !!disabled;
    if (onclick) node.onclick = onclick;
    list.append(node);
    return list;
}, document.createElement('ul'));
trayMenu.className = 'tray-menu';
trayMenu.hidden = true;
trayMenu.onclick = () => (trayMenu.hidden = !trayMenu.hidden);
appIcon.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    trayMenu.hidden = !trayMenu.hidden;
    const iconRect = appIcon.getBoundingClientRect();
    trayMenu.style.left = `${iconRect.x}px`;
});
document.body.append(trayMenu);

//
// Toolbar
//
const updateToolbarIcon = (items = []) => {
    if (!items.length) {
        appIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <mask id="pen">
                <rect fill="white" x="0" y="0" width="24" height="24" />
                <path d="M7.96156111,12.8064504 C8.00918655,12.7443742 8.10776861,12.7415528 8.17053729,12.8043163 L8.17053729,12.8043163 L11.198816,15.8325888 C11.2741322,15.907905 11.2549438,16.0347862 11.1523138,16.06335 L11.1523138,16.06335 L7.87543542,16.9742069 C7.35999156,17.1175264 6.88560596,16.6431283 7.02888168,16.1276657 L7.02888168,16.1276657 L7.9397948,12.8507561 Z M11.5218318,9.09724825 C11.6439002,8.9752048 11.8417849,8.9752048 11.9638533,9.09724825 L11.9638533,9.09724825 L14.9059341,12.0393415 C15.0279401,12.1613475 15.0279401,12.3592321 14.9059341,12.4813006 L14.9059341,12.4813006 L12.4816285,14.9055437 C12.3595601,15.0276121 12.1616754,15.0276121 12.039607,14.9055437 L12.039607,14.9055437 L9.09755119,11.9634879 C8.97550775,11.8414444 8.97550775,11.643566 9.09755119,11.5215226 L9.09755119,11.5215226 Z M15.7214738,7.54920409 L16.4537595,8.28147101 C17.1860452,9.01374418 17.1860452,10.2009895 16.4537595,10.9332564 L16.2318112,11.1551985 C16.1097427,11.2772419 15.9119206,11.2772419 15.7898522,11.1551985 L12.8477714,8.21311768 C12.7257029,8.09106799 12.7257029,7.89319585 12.8477714,7.7711524 L13.0697197,7.54919159 C13.8020053,6.81693093 14.9892507,6.81693718 15.7214738,7.54920409 Z" fill="black" fill-rule="nonzero"/>
              </mask>
              <circle cx="12" cy="12" r="11" fill="currentColor" mask="url(#pen)"/>
            </svg>`;
        return;
    }

    const i = items.length - items.filter((item) => item.done).length;

    if (items.length && i === 0) {
        appIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <mask id="pen">
                <rect fill="white" x="0" y="0" width="24" height="24" />
                <path d="M17.0972956,10.3472698 C17.6342348,9.81033066 17.6342348,8.93970544 17.0972956,8.40272501 C16.5603564,7.86575833 15.6897037,7.86575833 15.1527645,8.40272501 L10.6250129,12.9304904 L8.84728359,11.1527474 C8.31030316,10.6158082 7.43970544,10.6158082 6.90272501,11.1527474 C6.36575833,11.6896865 6.36575833,12.5603393 6.90272501,13.0972784 L9.65274735,15.847287 C10.1896865,16.3842262 11.0603393,16.3842262 11.5972784,15.847287 L17.0972956,10.3472698 Z" fill="black"/>
              </mask>
              <circle cx="12" cy="12" r="11" fill="currentColor" mask="url(#pen)"/>
            </svg>`;
        return;
    }

    appIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <mask id="nr${i}">
            <rect fill="white" x="0" y="0" width="24" height="24" />
            <text fill="black" x="8" y="17" style="font: 900 15px sans-serif">${i}</text>
        </mask>
        <circle cx="12" cy="12" r="11" fill="currentColor" mask="url(#nr${i})"/>
    </svg>`;
};

//
// Clock
//
const date = document.querySelector('.date');
const time = document.querySelector('.time');

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    weekday: 'short',
    month: 'short',
});
const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
});
const updateDateTime = () => {
    const now = new Date();
    const [dayName, month, day] = dateFormatter.format(now).replace(',', '').split(' ');
    date.textContent = [dayName, day, month].join(' ');
    time.textContent = timeFormatter.format(now);
};
setInterval(updateDateTime, 1000);
updateDateTime();

//
// App
//
let state = {};
try {
    state = JSON.parse(localStorage.getItem('state')) || {};

    // map old items format to new items format
    if (state.items && typeof state.items[0].done === 'boolean') {
        state.items = state.items.map((item) => ({
            value: item.value,
            isDone: item.done,
        }));
    }
} catch (err) {
    console.log('restoringstate', err);
}

// Create the app
const app = new Hotlist({
    target: document.getElementById('app'),
    props: {
        ...state,
        visible: false,
        transformSyncSrc: (src) => {
            return `
            // fetch API replacement so we can fetch with Tauri
            const fetch = (url, options) => _post('fetch', url, options);
            ${src}`;
        },
        onSyncMessage: (command, ...args) =>
            new Promise((resolve, reject) => {
                if (command !== 'fetch') reject('Invalid command');

                fetch(...args)
                    .then((res) => {
                        res.text().then((text) => {
                            let json;
                            try {
                                json = JSON.parse(text);
                            } catch (err) {}
                            resolve({
                                text,
                                json,
                                ok: res.ok,
                                status: res.status,
                                statusText: res.statusText,
                            });
                        });
                    })
                    .catch(reject);
            }),
    },
});

// show default icon
updateToolbarIcon(state?.items);

app.$on('page', (e) => {
    console.log('current page', e.detail);
});

app.$on('url', (e) => {
    console.log('open url', e.detail.url);
});

let lastSettings = {};
app.$on('sync', (e) => {
    console.log('sync', e.detail);

    // store data
    localStorage.setItem('state', JSON.stringify(e.detail));

    // update icon
    updateToolbarIcon(e.detail.items);

    // settings the same?
    if (JSON.stringify(lastSettings) === JSON.stringify(e.detail.settings)) return;

    console.log('changed settings, update keyboard shortcuts');

    // remember
    lastSettings = e.detail.settings;
});

app.$on('shown', (e) => {
    console.log('shown');
});

app.$on('hidden', (e) => {
    console.log('hidden');
});

app.$on('resize', (e) => {
    console.log('resize');
    document.querySelector('.window').style.height = e.detail.height + 40 + 'px';
});

window.addEventListener('trigger:set-dummy-items', () => {
    Object.assign(app, {
        items: [
            { value: 'Pintura', isDone: true },
            {
                value: 'Pintura FilePond',
                isDone: false,
            },
            { value: 'Foo Bar Baz' },
            { value: '' },
            undefined,
        ],
    });
});

document.querySelectorAll('[data-trigger]').forEach((btn) => {
    btn.onclick = () => {
        window.dispatchEvent(new CustomEvent('trigger:' + btn.dataset.trigger));
    };
});
