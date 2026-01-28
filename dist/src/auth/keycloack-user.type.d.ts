export type KeycloakJwtPayload = {
    sub: string;
    preferred_username?: string;
    email?: string;
    name?: string;
    iss: string;
    aud?: string | string[];
    realm_access?: {
        roles?: string[];
    };
};
