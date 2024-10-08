import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import { Key } from "@/objects/key";
import { Command, ICommand, TYPE_ANCHOR_HASH, TYPE_ANCHOR_INDEX } from "@/objects/commands";
import { isValidCommandVersion } from "@/modules/commandParser";
import { doubleSha256 } from "@/libs/crypto/sha256";

export type CommandAuthorData = {
    publicKey: Key;
    signature: WBuffer;
};

/**
 * Common implementation for each command
 */
export class Frame<CommandDataType extends ICommand = ICommand> {
    public version: number = 1;
    public typeID: number = null;

    public anchorHash: WBuffer;
    public anchorIndex: number;

    public authors: CommandAuthorData[] = [];

    public data: CommandDataType = null;

    public isValid: boolean = null;
    public invalidMsg: string = null;

    public buffer: WBuffer = null;
    public bufferForHash: WBuffer = null;
    public bufferForBlock: WBuffer = null;

    constructor(data?: CommandDataType) {
        if (data) {
            this.data = data;
            this.typeID = this.data.typeID;
        }
    }

    public getHash() {
        return doubleSha256(this.toBuffer('hash'));
    }

    public getAuthor() {
        return this.authors[0];
    }

    //#region buffer

    /**
     * Create instance by reading bytedata
     * Code used: Frame.parse(bufferData);
     */
    public static parse(buffer: WBuffer, source: 'block' | 'net'): Frame {
        return new Frame().parse(buffer, source);
    }

    public parse(buffer: WBuffer, source: 'block' | 'net'): Frame {
        this.buffer = buffer;

        const cursor = buffer.cursor;
    
        this.parseVersion();
        this.parseType(source);
        this.parseAnchor(source);
        this.parseAuthors();
        this.parseData();

        this.bufferForHash = buffer.subarray(cursor, buffer.cursor);

        this.parseSignatures();

        this.buffer = buffer.subarray(cursor, buffer.cursor);

        return this;
    }

    public parseVersion(): void {
        const { buffer } = this;
    
        this.version = buffer.readUleb128();
    
        if (isValidCommandVersion(this.version) === false) {
            throw new Error('Frame parse: Invalid command version');
        }
    }

    public parseType(source: 'block' | 'net'): void {
        const { buffer } = this;

        this.data = Command.type(buffer.readUleb128()) as CommandDataType;

        if (this.data === null) {
            throw new Error('Frame parse: Unsupportet command type');
        }
    
        if (source === 'net' && this.data.isInternal === true) {
            throw new Error('Frame parse: Internal command type');
        }
    }

    public parseAnchor(source: 'block' | 'net'): void {
        if (source === 'block') {
            return;
        }

        const { buffer } = this;
    
        if (this.data.anchorTypeID === TYPE_ANCHOR_HASH) {
            this.anchorHash = buffer.read(32);
        } else {
            this.anchorIndex = buffer.readUleb128();
        }
    }
    
    public parseAuthors(): void {
        if (this.data.isInternal) {
            return;
        }

        const { buffer } = this;
    
        this.authors = [];
    
        if (this.data.isMultiAuthor === true) {
            this.authors.length = buffer.readUleb128();
        } else {
            this.authors.length = 1;
        }
        
        for (let i = 0; i < this.authors.length; i++) {
            const publicKey = Key.parse(buffer);
    
            this.authors[i] = {
                signature: null,
                publicKey,
            };
        }
    }

    public parseData(): void {
        const { buffer } = this;
    
        this.data = this.data.parse(buffer) as CommandDataType;
    }

    public parseSignatures(): void {
        if (this.data.isInternal) {
            return;
        }

        const { buffer } = this;
    
        for (const author of this.authors) {
            author.signature = author.publicKey.parseSignature(buffer);
        }
    }

    public toBuffer(target: 'block' | 'hash' | 'net') {
        return WBuffer.concat([
            WBuffer.uleb128(1),
            WBuffer.uleb128(this.data.typeID),
            this.toBufferAnchor(target),
            this.toBufferAuthors(),
            this.data.toBuffer(),
            this.toBufferSignatures(target),
        ]);
    }

    public toBufferAnchor(target: 'block' | 'hash' | 'net') {
        if (target === 'block') {
            return EMPTY_BUFFER;
        }

        switch (this.data.anchorTypeID) {
            case TYPE_ANCHOR_HASH: {
                return this.anchorHash;
            }
            case TYPE_ANCHOR_INDEX: {
                return WBuffer.uleb128(this.anchorIndex);
            }
        }
    }

    public toBufferAuthors() {
        if (this.data.isInternal) {
            return EMPTY_BUFFER;
        }

        if (this.data.isMultiAuthor === false) {
            return this.authors[0].publicKey.toBuffer();
        }

        return WBuffer.concat([
            WBuffer.uleb128(this.authors.length),
            ...this.authors.map((author) => author.publicKey.toBuffer())
        ]);
    }

    public toBufferSignatures(target: 'block' | 'hash' | 'net') {
        if (target === 'hash') {
            return EMPTY_BUFFER;
        }

        if (this.data.isInternal) {
            return EMPTY_BUFFER;
        }

        if (this.data.isMultiAuthor === false) {
            return this.authors[0].signature;
        }

        return WBuffer.concat(this.authors.map((author) => author.signature));
    }

    //#endregion buffer

    /**
     * Used to generate a unique identifier, like a checksum,
     * that allows the system to identify and track repeated values searched for by the system
     */
    public getKeyOfValue(): WBuffer {
        if (this.data.getKeyOfValue) {
            return this.data.getKeyOfValue(this);
        }

        if (this.data.isInternal === true) {
            return WBuffer.uleb128(this.typeID);
        }

        return this.toBufferAuthors();
    }
}

/**
 * Extending the class {Frame} with useful functions 
 * from a client or testing perspective
 */
export class ExFrame extends Frame {
    public setAnchor(anchor: number | WBuffer) {
        if (anchor instanceof WBuffer) {
            if (this.data.anchorTypeID !== TYPE_ANCHOR_HASH) {
                throw new Error('Frame: set invalid anchor');
            }

            this.anchorHash = anchor;

            return;
        }

        if (this.data.anchorTypeID !== TYPE_ANCHOR_INDEX) {
            throw new Error('Frame: set invalid anchor');
        }
        
        this.anchorIndex = anchor;
    }

    public addAuthor(key: Key) {
        const item = {
            publicKey: key,
            signature: null as WBuffer
        };

        this.authors.push(item);

        return (signature: WBuffer) => item.signature = signature;
    }

    public addSignature(publicKey: Key, signature: WBuffer) {
        for (const authorData of this.authors) {
            if (authorData.publicKey.isEqual(publicKey)) {
                authorData.signature = signature;
                return;
            }
        }

        throw new Error('User\'s mistake');
    }
}
