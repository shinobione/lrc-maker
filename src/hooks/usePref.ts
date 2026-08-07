import { useReducer } from "react";

export const themeColor = {
    orange: "#ff691f",
    yellow: "#fab81e",
    lime: "#7fdbb6",
    green: "#19cf86",
    blue: "#91d2fa",
    navy: "#1b95e0",
    grey: "#abb8c2",
    red: "#e81c4f",
    pink: "#f58ea8",
    purple: "#c877fe",
};

export const enum ThemeMode {
    auto,
    light,
    dark,
}

const localeRevision = 2;

const initState = {
    lang: "fr-FR",
    spaceStart: 1,
    spaceEnd: 0,
    fixed: 3 as Fixed,
    builtInAudio: false,
    showWaveform: true,
    screenButton: false,
    themeColor: themeColor.pink,
    themeMode: ThemeMode.auto,
    localeRevision,
};

export type State = Readonly<typeof initState>;

export type Action = {
    [key in keyof State]: { type: key; payload: State[key] | ((state: State) => State[key]) };
}[keyof State];

const reducer = (state: State, action: Action): State => {
    const payload = action.payload;
    return {
        ...state,
        [action.type]: typeof payload === "function" ? payload(state) : payload,
    };
};

const langCodeList = i18n.langCodeList;

const init = (lazyInit: () => string): State => {
    const state: Mutable<State> = { ...initState };

    const languages = navigator.languages || [navigator.language || "fr-FR"];

    state.lang =
        languages
            .map((langCode) => {
                if (langCode.startsWith("fr")) {
                    return "fr-FR";
                }
                if (langCode.startsWith("en")) {
                    return "en-US";
                }
                return langCode;
            })
            .find((langCode) => langCodeList.includes(langCode)) || "fr-FR";

    try {
        const storedState = JSON.parse(lazyInit()) as State;
        const legacyLocale = !Object.hasOwn(storedState, "localeRevision");
        const validKeys = Object.keys(initState) as (keyof State)[];
        for (const key of validKeys) {
            if (key in storedState) {
                (state[key] as unknown) = storedState[key];
            }
        }

        // Before this fork introduced a real French locale, en-US contained the
        // French strings. Migrate that historical preference once so existing
        // users stay in French after the locale cleanup.
        if (legacyLocale && storedState.lang === "en-US") {
            state.lang = "fr-FR";
        }
    } catch {
        // It's OK if parsing failed
    }

    if (!langCodeList.includes(state.lang)) {
        state.lang = "fr-FR";
    }
    state.localeRevision = localeRevision;

    return state;
};

export const usePref = (lazyInit: () => string): [State, React.Dispatch<Action>] => useReducer(reducer, lazyInit, init);
