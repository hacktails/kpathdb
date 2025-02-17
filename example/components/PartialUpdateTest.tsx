import React from "react";
import { useQuery, useMutation } from "../../src/hooks";

interface User {
    id: string;
    name: string;
    email: string;
    age: number;
    preferences: {
        theme: "light" | "dark";
        notifications: boolean;
    };
}

export const PartialUpdateTest = () => {
    const { data: users, error, refresh } = useQuery<User>("users");
    const { mutate, loading } = useMutation<User>("users");

    const [newUser, setNewUser] = React.useState({
        name: "",
        email: "",
        age: 0,
    });

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        await mutate(
            "add",
            {
                id: crypto.randomUUID(),
                ...newUser,
                preferences: {
                    theme: "light",
                    notifications: true,
                },
            },
            { partial: false }
        );
        refresh();
        setNewUser({ name: "", email: "", age: 0 });
    };

    const handlePartialUpdate = async (id: string, field: keyof User, value: any) => {
        await mutate(
            "update",
            {
                id,
                [field]: value,
            },
            { partial: true }
        );
        refresh();
    };

    if (error) return <div>Error: {error.message}</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Partial Update Test</h1>

            <form onSubmit={handleCreateUser} className="mb-8 space-y-4">
                <div>
                    <input
                        type="text"
                        value={newUser.name}
                        onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Name"
                        className="border p-2 rounded"
                    />
                </div>
                <div>
                    <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="Email"
                        className="border p-2 rounded"
                    />
                </div>
                <div>
                    <input
                        type="number"
                        value={newUser.age}
                        onChange={(e) => setNewUser((prev) => ({ ...prev, age: parseInt(e.target.value) }))}
                        placeholder="Age"
                        className="border p-2 rounded"
                    />
                </div>
                <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded">
                    Create User
                </button>
            </form>

            <div className="space-y-4">
                {users?.map((user) => (
                    <div key={user.id} className="border p-4 rounded">
                        <h3 className="font-bold">{user.name}</h3>
                        <p>Email: {user.email}</p>
                        <p>Age: {user.age}</p>
                        <p>Theme: {user.preferences.theme}</p>
                        <p>Notifications: {user.preferences.notifications ? "On" : "Off"}</p>

                        <div className="mt-2 space-x-2">
                            <button
                                onClick={() => handlePartialUpdate(user.id, "age", user.age + 1)}
                                className="bg-green-500 text-white px-2 py-1 rounded"
                            >
                                Increment Age
                            </button>
                            <button
                                onClick={() =>
                                    handlePartialUpdate(user.id, "preferences", {
                                        ...user.preferences,
                                        theme: user.preferences.theme === "light" ? "dark" : "light",
                                    })
                                }
                                className="bg-purple-500 text-white px-2 py-1 rounded"
                            >
                                Toggle Theme
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
