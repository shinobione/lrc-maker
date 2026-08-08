import * as React from "react";
import { AppProvider } from "./app.context.js";
import { Content } from "./content.js";
import { Footer } from "./footer.js";
import { Header } from "./header.js";
import { StudioProvider } from "./studio.context.js";
import { Toast } from "./toast.js";

export const App: React.FC = () => {
    return (
        <React.StrictMode>
            <AppProvider>
                <StudioProvider>
                    <Header />
                    <Content />
                    <Footer />
                    <Toast />
                </StudioProvider>
            </AppProvider>
        </React.StrictMode>
    );
};
