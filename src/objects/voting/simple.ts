/**
 * Simple voting accept/reject
 * Values:
 *  0 - voting invalid
 *  1 - accept
 *  2 - reject
 */
import WBuffer from "@/libs/WBuffer";
import { Voting, IVoting, TYPE_VOTING_SIMPLE, Type } from ".";

@Type(TYPE_VOTING_SIMPLE)
export class VotingSimple extends Voting implements IVoting {
    public value: number = 0;
    public isAllowFlow = true;

    parseValue(buffer: WBuffer): VotingSimple {
        this.value = buffer.readUleb128();

        const flags = buffer.readUleb128();

        this.isAllowFlow = !!(flags & 1);

        return this;
    }

    toBufferValue(): WBuffer {
        const flags = 0;

        if (this.isAllowFlow) flags | 1;

        return WBuffer.concat([
            WBuffer.uleb128(this.value),
            WBuffer.uleb128(flags)
        ]);
    }
}
