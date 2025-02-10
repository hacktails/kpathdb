import React from "react";
import { useQuery, useMutation } from "../../src/hooks";

interface Todo {
    id: string;
    text: string;
    completed: boolean;
}

export default function TodoApp() {
    const { data: todos, error, refresh } = useQuery<Todo>("todos");
    const { mutate } = useMutation<Todo>("todos");

    const [newTodo, setNewTodo] = React.useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim()) return;

        await mutate("add", {
            id: crypto.randomUUID(),
            text: newTodo,
            completed: false,
        });
        setNewTodo("");
        refresh();
    };

    const toggleTodo = async (id: string) => {
        const todo = todos?.find((t) => t.id === id);
        if (todo) {
            await mutate("update", { ...todo, completed: !todo.completed });
            refresh();
        }
    };

    const deleteTodo = async (id: string) => {
        await mutate("delete", id);
        refresh();
    };

    if (error) return <div>Error: {error.message}</div>;

    return (
        <div className="todo-container">
            <h1>Todo List Test</h1>
            <form onSubmit={handleSubmit}>
                <input type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} placeholder="Add new todo" />
                <button type="submit">Add</button>
            </form>

            <ul className="todo-list">
                {todos?.map((todo) => (
                    <li key={todo.id} className={todo.completed ? "completed" : ""}>
                        <span onClick={() => toggleTodo(todo.id)}>{todo.text}</span>
                        <button onClick={() => deleteTodo(todo.id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
