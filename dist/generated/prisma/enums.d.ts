export declare const ToDoType: {
    readonly REMINDER: "REMINDER";
    readonly SERVICE: "SERVICE";
};
export type ToDoType = (typeof ToDoType)[keyof typeof ToDoType];
export declare const PluginRestrictedParamType: {
    readonly FUNCTION: "FUNCTION";
    readonly NAME: "NAME";
};
export type PluginRestrictedParamType = (typeof PluginRestrictedParamType)[keyof typeof PluginRestrictedParamType];
