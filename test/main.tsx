import React from "react";
import ReactDOM from "react-dom/client";
import { DBProvider } from "../src/hooks";
import TodoApp from "./components/TodoApp";
import { dbConfig } from "./db-config";
import "./styles/test.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <DBProvider config={dbConfig}>
            <TodoApp />
        </DBProvider>
    </React.StrictMode>
);
