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
export const TYPE_ANCHOR_INDEX = 1 as AnchorTypeID;

type ValueTypeID = number & { __TYPE__: 'ValueTypeID' };

export const TYPE_VALUE_PRIMARY = 0 as ValueTypeID;
export const TYPE_VALUE_SECONDARY = 1 as ValueTypeID;

export interface ICommand {
    typeID?: number;
    isInternal: boolean;
    isMultiAuthor: boolean;
    anchorTypeID: AnchorTypeID;
    isValueHasKey: boolean;
    valueTypeID: ValueTypeID;

    parse(buffer: WBuffer): ICommand;
    toBuffer(): WBuffer;

    verify(node: Node, frame: Frame): Promise<void>;
    apply?: (node: Node, frame: Frame) => Promise<void>;

    getKeyOfValue?: (frame: Frame) => WBuffer;
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
