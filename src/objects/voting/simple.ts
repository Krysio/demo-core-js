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
    parseValue(buffer: WBuffer): number {
        const value = buffer.readUleb128();

        if (value > 2) {
            throw new Error('Vote: Invalid value');
        }

        return value;
    }

    toBufferValue(value: number): WBuffer {
        return WBuffer.uleb128(value);
    }
}
