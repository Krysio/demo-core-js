import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import Key from "@/objects/key";
import { Command, ICommand, ICommandWithType, TYPE_ANCHOR_HASH, TYPE_ANCHOR_INDEX } from "@/objects/commands";
import { isValidCommandVersion } from "@/modules/commandParser";

export type CommandAuthorData = {
    publicKey: Key;
    signature: WBuffer;
};

export class Frame {
    public version: number = 1;
    public typeID: number = null;

    public anchorHash: WBuffer;
    public anchorIndex: number;

    public authors: CommandAuthorData[] = [];

    public data: ICommandWithType = null;

    public isValid: boolean = null;
    public invalidMsg: string = null;

    public buffer: WBuffer = null;
    public bufferForHash: WBuffer = null;
    public bufferForBlock: WBuffer = null;

    constructor(data?: ICommand) {
        if (data) {
            this.data = data as ICommandWithType;
            this.typeID = this.data.typeID;
        }
    }

    public static parse(buffer: WBuffer, source: 'block' | 'net' = 'net'): Frame {
        return new Frame().parse(buffer, source);
    }

    public parse(buffer: WBuffer, source: 'block' | 'net' = 'net'): Frame {
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

    public parseType(source: 'block' | 'net' = 'net'): void {
        const { buffer } = this;

        this.data = Command.type(buffer.readUleb128()) as ICommandWithType;
    
        if (this.data === null) {
            throw new Error('Frame parse: Unsupportet command type');
        }
    
        if (source === 'net' && this.data.isInternal === true) {
            throw new Error('Frame parse: Internal command type');
        }
    }

    public parseAnchor(source: 'block' | 'net' = 'net'): void {
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
    
        this.data = this.data.parse(buffer) as ICommandWithType;
    }

    public parseSignatures(): void {
        if (this.data.isInternal) {
            return;
        }

        const { buffer } = this;
    
        for (let author of this.authors) {
            author.signature = author.publicKey.parseSignature(buffer);
        }
    }

    public toBuffer(target: 'block' | 'hash' | 'net' = 'net') {
        return WBuffer.concat([
            WBuffer.uleb128(1),
            WBuffer.uleb128(this.data.typeID),
            this.toBufferAnchor(target),
            this.toBufferAuthors(),
            this.data.toBuffer(),
            this.toBufferSignatures(target),
        ]);
    }

    public toBufferAnchor(target: 'block' | 'hash' | 'net' = 'net') {
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

    public toBufferSignatures(target: 'block' | 'hash' | 'net' = 'net') {
        if (target === 'hash') {
            return EMPTY_BUFFER;
        }

        if (this.data.isInternal) {
            return EMPTY_BUFFER;
        }

        if (this.data.isMultiAuthor === false) {
            return this.authors[0].signature;
        }

        return WBuffer.concat([
            WBuffer.uleb128(this.authors.length),
            ...this.authors.map((author) => author.signature)
        ]);
    }
}
