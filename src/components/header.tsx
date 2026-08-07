import ROUTER from "#const/router.json" assert { type: "json" };
import { useContext } from "react";
import { prependHash } from "../utils/router.js";
import { appContext, ChangBits } from "./app.context.js";
import { EditorSVG, HomeSVG, PreferencesSVG, SynchronizerSVG } from "./svg.js";

export const Header: React.FC = () => {
    const { lang } = useContext(appContext, ChangBits.lang);

    return (
        <header className="app-header">
            <div className="app-brand-group">
                <a id={ROUTER.home} className="app-title" title={lang.header.home} href={prependHash(ROUTER.home)}>
                    <span className="app-title-text">{lang.app.name}</span>
                    <span className="app-title-svg">
                        <HomeSVG />
                    </span>
                </a>
                <a
                    className="shinobiwan-brand"
                    href="https://shinobione.github.io/LaunchPAD-APP/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open SHINOBIWAN LaunchPAD"
                    title="SHINOBIWAN LaunchPAD"
                >
                    <img src="./logo.png" alt="SHINOBIWAN" />
                </a>
            </div>
            <nav className="app-nav">
                <a id={ROUTER.editor} className="app-tab" title={lang.header.editor} href={prependHash(ROUTER.editor)}>
                    <EditorSVG />
                </a>
                <a
                    id={ROUTER.synchronizer}
                    className="app-tab"
                    title={lang.header.synchronizer}
                    href={prependHash(ROUTER.synchronizer)}
                >
                    <SynchronizerSVG />
                </a>
                <a
                    id={ROUTER.preferences}
                    className="app-tab"
                    title={lang.header.preferences}
                    href={prependHash(ROUTER.preferences)}
                >
                    <PreferencesSVG />
                </a>
            </nav>
        </header>
    );
};
