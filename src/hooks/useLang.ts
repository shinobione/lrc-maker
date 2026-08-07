import { useCallback, useState } from "react";
import frFR from "../languages/fr-FR.json" assert { type: "json" };
import { languages } from "../languages/index.js";

export const useLang = (): [Language, (lang: string) => Promise<void>] => {
    const [value, setValue] = useState<Language>(frFR);

    const setLang = async (langCode: string): Promise<void> => {
        const l = await languages[`./${langCode}.json`]();
        setValue(l);
    };

    return [value, useCallback(async (lang: string) => setLang(lang), [])];
};
