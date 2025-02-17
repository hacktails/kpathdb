import React from "react";
import ReactDOM from "react-dom/client";
import { DBProvider } from "../src/hooks";
import TodoApp from "./components/TodoApp";
import { PartialUpdateTest } from "./components/PartialUpdateTest";
import { dbConfig } from "./db-config";
import "./styles/test.css";

const App = () => {
    const [activeComponent, setActiveComponent] = React.useState<"todos" | "partial-update">("todos");

    return (
        <DBProvider config={dbConfig}>
            <div className="p-4">
                <div className="mb-4 space-x-4">
                    <button
                        onClick={() => setActiveComponent("todos")}
                        className={`px-4 py-2 rounded ${
                            activeComponent === "todos" ? "bg-blue-500 text-white" : "bg-gray-200"
                        }`}
                    >
                        Todo App
                    </button>
                    <button
                        onClick={() => setActiveComponent("partial-update")}
                        className={`px-4 py-2 rounded ${
                            activeComponent === "partial-update" ? "bg-blue-500 text-white" : "bg-gray-200"
                        }`}
                    >
                        Partial Update Test
                    </button>
                </div>

                {activeComponent === "todos" ? <TodoApp /> : <PartialUpdateTest />}
            </div>
        </DBProvider>
    );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
