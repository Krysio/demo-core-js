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

    parseValue(buffer: WBuffer): VotingSimple {
        this.value = buffer.readUleb128();

        return this;
    }

    toBufferValue(): WBuffer {
        return WBuffer.uleb128(this.value);
    }
}
