import WBuffer from "./WBuffer";
import { EMPTY_HASH } from "./crypto/sha256";

export function merkleCreateRoot(listOfHashes: WBuffer[]) {
    if (listOfHashes.length === 0)
        return EMPTY_HASH;
    else if (listOfHashes.length == 1)
        return listOfHashes[0];

    while (listOfHashes.length > 1) {
        // duplicate the last hash
        if (listOfHashes.length % 2 !== 0)
            listOfHashes.push(listOfHashes.at(-1));

        const newList: WBuffer[] = [];

        for (let i = 0; i < listOfHashes.length; i += 2) {
            newList.push(WBuffer.concat([listOfHashes[i], listOfHashes[i + 1]]));
        }

        listOfHashes = newList;
    }

    return listOfHashes[0];
}
