export declare const ToDoType: {
    readonly REMINDER: "REMINDER";
    readonly SERVICE: "SERVICE";
};
export type ToDoType = (typeof ToDoType)[keyof typeof ToDoType];
