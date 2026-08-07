import { type State as LrcState, stringify } from "@lrc-maker/lrc-parser";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Action as LrcAction } from "../hooks/useLrc.js";
import { ActionType as LrcActionType } from "../hooks/useLrc.js";
import { lrcFileName } from "../utils/lrc-file-name.js";
import { appContext } from "./app.context.js";
import { CopySVG, DownloadSVG, OpenFileSVG, UtilitySVG } from "./svg.js";
import { toastPubSub } from "./toast.js";

const disableCheck = {
    autoCapitalize: "none",
    autoComplete: "off",
    autoCorrect: "off",
    spellCheck: false,
};

type HTMLInputLikeElement = HTMLInputElement & HTMLTextAreaElement;

type UseDefaultValue<T = React.RefObject<HTMLInputLikeElement>> = (
    defaultValue: string,
    ref?: T,
) => { defaultValue: string; ref: T };

const useDefaultValue: UseDefaultValue = (defaultValue, ref) => {
    const or = <T, K>(a: T, b: K): NonNullable<T> | K => a ?? b;

    const $ref = or(ref, useRef<HTMLInputLikeElement>(null));

    useEffect(() => {
        if ($ref.current) {
            $ref.current.value = defaultValue;
        }
    }, [defaultValue, $ref]);
    return { ref: $ref, defaultValue };
};

export const Eidtor: React.FC<{
    lrcState: LrcState;
    lrcDispatch: React.Dispatch<LrcAction>;
}> = ({ lrcState, lrcDispatch }) => {
    const { prefState, lang, trimOptions } = useContext(appContext);

    const parse = useCallback(
        (ev: React.FocusEvent<HTMLTextAreaElement>) => {
            lrcDispatch({
                type: LrcActionType.parse,
                payload: { text: ev.target.value, options: trimOptions },
            });
        },
        [lrcDispatch, trimOptions],
    );

    // SHINOBIWAN fork: output is intentionally lyrics-only. Metadata parsed from
    // imported files may remain available internally, but is never re-injected
    // into the editor, local autosave or downloaded LRC text.
    const text = stringify({ ...lrcState, info: new Map() }, prefState);

    const textarea = useRef<HTMLInputLikeElement>(null);
    const [href, setHref] = useState<string | undefined>(undefined);

    const onDownloadClick = useCallback(() => {
        setHref((url) => {
            if (url) {
                URL.revokeObjectURL(url);
            }

            return URL.createObjectURL(
                new Blob([textarea.current!.value], {
                    type: "text/plain;charset=UTF-8",
                }),
            );
        });
    }, []);

    const onTextFileUpload = useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            if (ev.target.files === null || ev.target.files.length === 0) {
                return;
            }
            const fileReader = new FileReader();
            fileReader.addEventListener("load", () => {
                lrcDispatch({
                    type: LrcActionType.parse,
                    payload: { text: fileReader.result as string, options: trimOptions },
                });
            });
            fileReader.readAsText(ev.target.files[0], "UTF-8");
        },
        [lrcDispatch, trimOptions],
    );

    const onCopyClick = useCallback(() => {
        textarea.current?.select();
        document.execCommand("copy");
    }, []);

    const onRemoveEmptyLines = useCallback(() => {
        const target = textarea.current;
        if (!target) {
            return;
        }

        const lines = target.value.split(/\r?\n/);
        const cleaned = lines.filter((line) => line.trim().length > 0);

        if (cleaned.length === lines.length) {
            toastPubSub.pub({
                type: "info",
                text: lang.notify.noEmptyLines,
            });
            return;
        }

        const value = cleaned.join("\n");
        target.value = value;
        lrcDispatch({
            type: LrcActionType.parse,
            payload: { text: value, options: trimOptions },
        });
        toastPubSub.pub({
            type: "success",
            text: lang.notify.emptyLinesRemoved,
        });
    }, [lang.notify.emptyLinesRemoved, lang.notify.noEmptyLines, lrcDispatch, trimOptions]);

    const downloadName = useMemo(() => lrcFileName(lrcState.info), [lrcState.info]);

    return (
        <div className="app-editor">
            <section className="editor-tools" aria-label="Outils LRC">
                <label className="editor-tools-item ripple" title={lang.editor.uploadText}>
                    <input hidden={true} type="file" accept="text/*, .txt, .lrc" onChange={onTextFileUpload} />
                    <OpenFileSVG />
                </label>
                <button className="editor-tools-item ripple" title={lang.editor.copyText} onClick={onCopyClick}>
                    <CopySVG />
                </button>
                <a
                    className="editor-tools-item ripple"
                    title={lang.editor.downloadText}
                    href={href}
                    onClick={onDownloadClick}
                    download={downloadName}
                >
                    <DownloadSVG />
                </a>
                <button
                    type="button"
                    className="editor-tools-item editor-clean-lines ripple"
                    title={lang.editor.removeEmptyLines}
                    aria-label={lang.editor.removeEmptyLines}
                    onClick={onRemoveEmptyLines}
                >
                    <UtilitySVG />
                </button>
            </section>

            <textarea
                className="app-textarea"
                aria-label="LRC editor"
                onBlur={parse}
                {...disableCheck}
                {...useDefaultValue(text, textarea)}
            />
        </div>
    );
};
