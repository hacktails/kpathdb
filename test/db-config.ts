import { z } from "zod";
import { DBConfig } from "../src/types";

const todoSchema = z.object({
    id: z.string(),
    text: z.string().min(1),
    completed: z.boolean(),
});

export const dbConfig: DBConfig = {
    name: "TodoTestDB",
    version: 1,
    stores: {
        todos: {
            keyPath: "id",
            zodSchema: todoSchema,
            indexes: ["completed"],
        },
    },
};
