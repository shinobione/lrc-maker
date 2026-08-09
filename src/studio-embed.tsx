import { stringify } from "@lrc-maker/lrc-parser";
import React, { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { render, unmountComponentAtNode } from "react-dom";
import animationCss from "./animation.css?inline";
import { appContext, AppProvider } from "./components/app.context.js";
import appCss from "./components/app.css?inline";
import asideCss from "./components/asidepanel.css?inline";
import audioCss from "./components/audio.css?inline";
import footerCss from "./components/footer.css?inline";
import { Footer } from "./components/footer.js";
import { studioContext, StudioProvider, type StudioSavedDetail } from "./components/studio.context.js";
import synchronizerCss from "./components/synchronizer.css?inline";
import { Synchronizer } from "./components/synchronizer.js";
import toastCss from "./components/toast.css?inline";
import { Toast, toastPubSub } from "./components/toast.js";
import { ActionType as LrcActionType, useLrc } from "./hooks/useLrc.js";
import skinCss from "./launchpad-skin.css?inline";
import polishCss from "./shinobiwan-polish.css?inline";
import themeCss from "./shinobiwan-theme.css?inline";
import embedCss from "./studio-embed.css?inline";
import { removeEmptyLyricLines, removeNonTimestampBracketTags } from "./utils/lyrics-cleanup.js";
import variablesCss from "./variables.css?inline";

const TRACK_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,119}$/;
const TAG_NAME = "shinobiwan-lyrics-studio";

const cssText = [
    variablesCss,
    appCss,
    footerCss,
    synchronizerCss,
    asideCss,
    audioCss,
    toastCss,
    animationCss,
    themeCss,
    skinCss,
    polishCss,
    embedCss,
].join("\n").replaceAll(":root", ":host");

interface EmbeddedSessionProps {
    trackId: string;
}

const EmbeddedSession: React.FC<EmbeddedSessionProps> = ({ trackId }) => {
    const { prefState, trimOptions, lang } = useContext(appContext);
    const studio = useContext(studioContext);
    const [lrcState, lrcDispatch] = useLrc(() => ({ text: "", options: trimOptions, select: 0 }));
    const loadedRevision = useRef("");

    useEffect(() => {
        if (!studio.context) return;
        const revision = `${studio.context.trackId}:${studio.context.lyrics.etag}`;
        if (loadedRevision.current === revision) return;
        loadedRevision.current = revision;
        lrcDispatch({
            type: LrcActionType.parse,
            payload: { text: studio.context.lyrics.text, options: trimOptions },
        });
    }, [lrcDispatch, studio.context, trimOptions]);

    const serializeLyrics = useCallback(
        () => stringify({ ...lrcState, info: new Map() }, prefState),
        [lrcState, prefState],
    );

    const save = useCallback(() => {
        void studio.saveLyrics(serializeLyrics()).catch(() => {});
    }, [serializeLyrics, studio]);

    const applyCleanup = useCallback(
        (
            cleanup: (text: string) => { value: string; removed: number },
            noChangeMessage: string,
            changedMessage: string,
        ) => {
            const result = cleanup(serializeLyrics());
            if (result.removed === 0) {
                toastPubSub.pub({ type: "info", text: noChangeMessage });
                return;
            }

            lrcDispatch({
                type: LrcActionType.parse,
                payload: { text: result.value, options: trimOptions },
            });
            toastPubSub.pub({ type: "success", text: changedMessage });
        },
        [lrcDispatch, serializeLyrics, trimOptions],
    );

    const removeTags = useCallback(() => {
        applyCleanup(removeNonTimestampBracketTags, lang.notify.noTags, lang.notify.tagsRemoved);
    }, [applyCleanup, lang.notify.noTags, lang.notify.tagsRemoved]);

    const removeEmptyLines = useCallback(() => {
        applyCleanup(removeEmptyLyricLines, lang.notify.noEmptyLines, lang.notify.emptyLinesRemoved);
    }, [applyCleanup, lang.notify.emptyLinesRemoved, lang.notify.noEmptyLines]);

    const statusText = useMemo(() =>
        studio.message || ({
            standalone: "",
            loading: "Chargement du contexte protégé…",
            ready: "Contexte prêt — synchronisez directement dans Studio.",
            saving: "Validation et sauvegarde protégée…",
            saved: "lyrics.txt synchronisé et relu.",
            error: "Le contexte Lyrics requiert votre attention.",
        }[studio.status]), [studio.message, studio.status]);

    return (
        <div className="studio-embed-shell" data-track-id={trackId}>
            <header className="studio-embed-head">
                <div>
                    <span>LYRICS STUDIO · LRC MAKER ENGINE</span>
                    <strong>{studio.context?.title || trackId}</strong>
                    <small>Autorité : tracks/{trackId}/lyrics.txt</small>
                </div>
                <div className={`studio-embed-status ${studio.status}`}>{statusText}</div>
                <div className="studio-embed-actions">
                    {studio.status === "error" && (
                        <button type="button" onClick={() => void studio.reload()}>Réessayer</button>
                    )}
                    <button
                        type="button"
                        className="studio-embed-save"
                        onClick={save}
                        disabled={!studio.context || studio.status === "saving"}
                    >
                        {studio.status === "saving" ? "Sauvegarde…" : "Sauvegarder lyrics.txt"}
                    </button>
                </div>
            </header>

            <div className="studio-embed-toolbar" aria-label={lang.editor.utils}>
                <button type="button" onClick={removeTags} disabled={!studio.context}>
                    {lang.editor.removeTags}
                </button>
                <button type="button" onClick={removeEmptyLines} disabled={!studio.context}>
                    {lang.editor.removeEmptyLines}
                </button>
                <span>
                    Simple clic = sélectionner · double-clic = revenir au timestamp · Espace = timestamp + ligne
                    suivante.
                </span>
            </div>

            <main className="studio-embed-main">
                {!studio.context
                    ? <div className="studio-embed-loading">{statusText || "Chargement…"}</div>
                    : <Synchronizer state={lrcState} dispatch={lrcDispatch} />}
            </main>

            <Footer />
            <Toast />
        </div>
    );
};

const EmbeddedApp: React.FC<{ trackId: string; onSaved: (detail: StudioSavedDetail) => void }> = (
    { trackId, onSaved },
) => {
    const launch = useMemo(() => ({ trackId, returnPath: null }), [trackId]);
    return (
        <AppProvider embedded={true}>
            <StudioProvider launch={launch} embedded={true} onSaved={onSaved}>
                <EmbeddedSession trackId={trackId} />
            </StudioProvider>
        </AppProvider>
    );
};

class ShinoBiWanLyricsStudioElement extends HTMLElement {
    static get observedAttributes(): string[] {
        return ["track-id"];
    }

    readonly #root: ShadowRoot;
    readonly #mount: HTMLDivElement;

    constructor() {
        super();
        this.#root = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = cssText;
        this.#mount = document.createElement("div");
        this.#mount.className = "studio-embed-root";
        this.#root.append(style, this.#mount);
    }

    connectedCallback(): void {
        this.render();
    }

    attributeChangedCallback(): void {
        if (this.isConnected) this.render();
    }

    disconnectedCallback(): void {
        unmountComponentAtNode(this.#mount);
    }

    private render(): void {
        const trackId = this.getAttribute("track-id") || "";
        if (!TRACK_ID_PATTERN.test(trackId)) {
            this.#mount.textContent = "trackId canonique invalide.";
            return;
        }
        render(
            <EmbeddedApp
                trackId={trackId}
                onSaved={(detail) =>
                    this.dispatchEvent(
                        new CustomEvent<StudioSavedDetail>("lyrics-saved", {
                            detail,
                            bubbles: true,
                            composed: true,
                        }),
                    )}
            />,
            this.#mount,
        );
    }
}

if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, ShinoBiWanLyricsStudioElement);
}
