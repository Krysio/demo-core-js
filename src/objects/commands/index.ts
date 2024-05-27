import WBuffer from "@/libs/WBuffer";
import { Node } from "@/main";
import { Frame } from "@/objects/frame";

const mapOftypes = new Map<number, Function>();
export const Type = (typeID: number) => {
    return (target: new (...args: any[]) => any) => {
        const ref = {[target.prototype.constructor.name]: class extends target {
            typeID = typeID;
            constructor(...args: any[]) {
                super(...args);
            }
        }};

        mapOftypes.set(typeID, ref[target.prototype.constructor.name]);
        return ref[target.prototype.constructor.name] as unknown as void;
    }
};

type AnchorTypeID = number & { __TYPE__: 'AnchorTypeID' };

export const TYPE_ANCHOR_HASH = 0 as AnchorTypeID;
export const TYPE_ANCHOR_INDEX = 10 as AnchorTypeID;

export interface ICommand {
    isInternal: boolean;
    isMultiAuthor: boolean;
    anchorTypeID: AnchorTypeID;
    primaryValue: number;
    secondaryValue: number;

    parse(buffer: WBuffer): ICommand;
    toBuffer(): WBuffer;
    verify(node: Node, frame: Frame): Promise<void>;
}
export interface ICommandWithType extends ICommand {
    typeID: number;
}

export class Command {
    static type(typeID: number) {
        const Typed = mapOftypes.get(typeID) as new () => ICommand;

        if (Typed) {
            return new Typed();
        }

        throw new Error('Unknown command type');
    }
}

export * from "./genesis";
export * from "./config";
