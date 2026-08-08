/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_TRACK_MANAGER_URL?: string;
    app: {
        hash: string;
        version: string;
        updateTime: string;
    };
}
