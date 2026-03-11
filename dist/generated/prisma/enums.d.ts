export declare const ContactStatus: {
    readonly NO_EXCHANGE: "NO_EXCHANGE";
    readonly MET: "MET";
    readonly CLIENT: "CLIENT";
    readonly UNDESIRABLE: "UNDESIRABLE";
};
export type ContactStatus = (typeof ContactStatus)[keyof typeof ContactStatus];
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
