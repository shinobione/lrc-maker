import { createContext, useCallback, useEffect, useMemo, useState } from "react";

const TRACK_MANAGER_URL = import.meta.env.VITE_TRACK_MANAGER_URL
    || "https://launchpad-r2-api.jerryquinet.workers.dev";
const TRACK_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,119}$/;

interface LyricsContextPayload {
    ok: true;
    schemaVersion: 1;
    context: "lyrics-studio-v1";
    trackId: string;
    title: string;
    audio: {
        filename: string;
        path: string;
        contentType: string;
        size: number;
        etag: string;
    };
    lyrics: {
        filename: "lyrics.txt";
        text: string;
        etag: string;
        updatedAt: string;
        timestampsAvailable: boolean;
        timestampCount: number;
        segmentCount: number;
    };
}

interface SavePayload {
    ok: boolean;
    saved?: boolean;
    noChange?: boolean;
    updatedAt?: string;
    lyricsEtag?: string;
    error?: string;
    code?: string;
    quality?: { items?: readonly { level: string; message: string }[] };
}

export interface StudioLaunch {
    trackId: string;
    returnPath: string | null;
}

export interface StudioSavedDetail {
    trackId: string;
    updatedAt: string;
}

interface StudioState {
    launch: StudioLaunch | null;
    context: LyricsContextPayload | null;
    status: "standalone" | "loading" | "ready" | "saving" | "saved" | "error";
    message: string;
    audioUrl: string | null;
    embedded: boolean;
    reload: () => Promise<void>;
    saveLyrics: (lyrics: string) => Promise<void>;
    returnToStudio: () => void;
}

interface StudioProviderProps {
    launch?: StudioLaunch | null;
    embedded?: boolean;
    onSaved?: (detail: StudioSavedDetail) => void;
    onClose?: () => void;
}

const parseLaunch = (): StudioLaunch | null => {
    const query = new URLSearchParams(location.search);
    if (query.get("studio") !== "lyrics-v1") return null;
    const trackId = query.get("trackId") || "";
    if (!TRACK_ID_PATTERN.test(trackId)) return null;

    const candidate = query.get("returnPath");
    let returnPath: string | null = null;
    if (candidate?.startsWith("/shinobiwan-studio/") && !candidate.includes("\\")) {
        const resolved = new URL(candidate, location.origin);
        if (resolved.origin === location.origin) returnPath = `${resolved.pathname}${resolved.search}${resolved.hash}`;
    }
    return { trackId, returnPath };
};

const initialLaunch = parseLaunch();
const noopAsync = async (): Promise<void> => {};

export const canonicalizeLyricsText = (text: string): string =>
    String(text ?? "").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

export const studioContext = createContext<StudioState>({
    launch: null,
    context: null,
    status: "standalone",
    message: "",
    audioUrl: null,
    embedded: false,
    reload: noopAsync,
    saveLyrics: noopAsync,
    returnToStudio: () => {},
});

const adminUrl = (path: string): string => `${TRACK_MANAGER_URL.replace(/\/$/, "")}${path}`;

const readJson = async <T,>(response: Response): Promise<T> => {
    const type = response.headers.get("content-type") || "";
    if (!type.includes("application/json")) {
        throw new Error("Authentifiez-vous d’abord dans Track Manager, puis rechargez ce contexte.");
    }
    const payload = await response.json() as T & { error?: string };
    if (!response.ok) throw new Error(payload.error || `Track Manager a répondu ${response.status}.`);
    return payload;
};

export const StudioProvider: React.FC<React.PropsWithChildren<StudioProviderProps>> = ({
    children,
    launch,
    embedded = false,
    onSaved,
    onClose,
}) => {
    const activeLaunch = launch === undefined ? initialLaunch : launch;
    const [context, setContext] = useState<LyricsContextPayload | null>(null);
    const [status, setStatus] = useState<StudioState["status"]>(activeLaunch ? "loading" : "standalone");
    const [message, setMessage] = useState("");

    const reload = useCallback(async () => {
        if (!activeLaunch) return;
        setStatus("loading");
        setMessage("");
        try {
            const response = await fetch(
                adminUrl(`/api/studio/tracks/${encodeURIComponent(activeLaunch.trackId)}/lyrics/context`),
                { credentials: "include", headers: { Accept: "application/json" } },
            );
            const next = await readJson<LyricsContextPayload>(response);
            if (next.context !== "lyrics-studio-v1" || next.trackId !== activeLaunch.trackId) {
                throw new Error("Le contexte Lyrics reçu ne correspond pas au morceau demandé.");
            }
            setContext(next);
            setStatus("ready");
        } catch (error) {
            setContext(null);
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "Impossible de charger le contexte Lyrics.");
        }
    }, [activeLaunch]);

    useEffect(() => {
        void reload();
    }, [reload]);

    const saveLyrics = useCallback(async (lyrics: string) => {
        if (!activeLaunch || !context) throw new Error("Contexte Lyrics indisponible.");
        setStatus("saving");
        setMessage("");
        const expectedCanonicalLyrics = canonicalizeLyricsText(lyrics);
        const common = {
            trackId: activeLaunch.trackId,
            lyrics: expectedCanonicalLyrics,
            expectedUpdatedAt: context.lyrics.updatedAt,
            expectedLyricsEtag: context.lyrics.etag,
        };

        try {
            const post = async (suffix: string, intent: string): Promise<SavePayload> => {
                const response = await fetch(
                    adminUrl(`/api/studio/tracks/${encodeURIComponent(activeLaunch.trackId)}/lyrics/sync/${suffix}`),
                    {
                        method: "POST",
                        credentials: "include",
                        headers: { Accept: "application/json", "Content-Type": "text/plain;charset=UTF-8" },
                        body: JSON.stringify({ ...common, intent }),
                    },
                );
                const payload = await readJson<SavePayload>(response);
                if (payload.ok !== true) throw new Error(payload.error || "Écriture Lyrics refusée.");
                return payload;
            };

            const validation = await post("validate", "lyrics-sync-validate-v1");
            if ((validation as SavePayload & { valid?: boolean }).valid !== true) {
                const issue = validation.quality?.items?.find((item) => item.level === "error")?.message;
                throw new Error(issue || "Les timestamps ne satisfont pas le contrat Lyrics Studio.");
            }
            const saved = await post("save", "lyrics-sync-save-v1");
            const refreshedResponse = await fetch(
                adminUrl(`/api/studio/tracks/${encodeURIComponent(activeLaunch.trackId)}/lyrics/context`),
                { credentials: "include", headers: { Accept: "application/json" } },
            );
            const refreshed = await readJson<LyricsContextPayload>(refreshedResponse);
            if (
                refreshed.trackId !== activeLaunch.trackId
                || canonicalizeLyricsText(refreshed.lyrics.text) !== expectedCanonicalLyrics
            ) {
                throw new Error("La relecture canonique ne correspond pas aux paroles sauvegardées.");
            }
            setContext(refreshed);
            setStatus("saved");
            setMessage(
                saved.noChange ? "Aucun changement — lyrics.txt est déjà à jour." : "lyrics.txt synchronisé et relu.",
            );
            const detail = { trackId: activeLaunch.trackId, updatedAt: refreshed.lyrics.updatedAt };
            onSaved?.(detail);
            if (!embedded) {
                window.opener?.postMessage(
                    { type: "shinobiwan:lyrics-saved:v1", ...detail },
                    location.origin,
                );
            }
        } catch (error) {
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "La sauvegarde Lyrics a échoué.");
            throw error;
        }
    }, [activeLaunch, context, embedded, onSaved]);

    const returnToStudio = useCallback(() => {
        if (onClose) {
            onClose();
            return;
        }
        if (activeLaunch?.returnPath) location.assign(activeLaunch.returnPath);
        else if (!embedded) window.close();
    }, [activeLaunch, embedded, onClose]);

    const value = useMemo<StudioState>(() => ({
        launch: activeLaunch,
        context,
        status,
        message,
        audioUrl: context ? adminUrl(context.audio.path) : null,
        embedded,
        reload,
        saveLyrics,
        returnToStudio,
    }), [activeLaunch, context, embedded, message, reload, returnToStudio, saveLyrics, status]);

    return <studioContext.Provider value={value}>{children}</studioContext.Provider>;
};
