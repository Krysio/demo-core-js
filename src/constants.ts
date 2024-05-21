import WBuffer from "./libs/WBuffer"

export type MapOfEffects = {
    activeUsers: WBuffer[],
    deactiveUsers: WBuffer[],
};

import User, { TYPE_USER_ADMIN, TYPE_USER_ROOT, TYPE_USER_VOTER } from '@/objects/user';
import Key from "@/objects/key";

export const TYPE_ANCHOR_HASH = 0;
export const TYPE_ANCHOR_INDEX = 1;

export interface CommandImplementation {
    isMultiAuthor: boolean;
    isInternalType: boolean;
    isNeedAutorize: boolean;
    anchorTypeID: typeof TYPE_ANCHOR_HASH | typeof TYPE_ANCHOR_INDEX;
    userTypeID: typeof TYPE_USER_ROOT | typeof TYPE_USER_ADMIN | typeof TYPE_USER_VOTER;
    parse: (buffer: WBuffer) => {};
};

export type CommandAuthorData = {
    type: typeof TYPE_USER_ROOT | typeof TYPE_USER_ADMIN | typeof TYPE_USER_VOTER;
    publicKey: Key;
    signature: WBuffer;
    userData: User;
};
export type CommandData = {
    buffer: WBuffer;
    version: number;
    typeID: number;
    authors: CommandAuthorData[];
    data: {[key: string]: any};
    anchorHash: WBuffer;
    anchorIndex: number;
    isValid: boolean;
    implementation: CommandImplementation;
    invalidMsg: string;
    hashableCommandPart: WBuffer;
};
