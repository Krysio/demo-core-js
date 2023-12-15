import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import User, { UserAdmin, UserRoot, UserVoter } from "./user";
import { KeySecp256k1 } from "./key";

describe('To & from buffer', () => {
    describe('Root', () => {
        for (const type of ['net', 'db'] as (Parameters<typeof User.fromBuffer>[1])[]) {
            test(type, () => {
                const [privateKey, publicKey] = getKeyPair();
                const key = new KeySecp256k1(publicKey);
                const user = new UserRoot(key);
                const buffer1 = user.toBuffer(type);
                const hash1 = user.getHash();
        
                user.fromBuffer(buffer1, type);
        
                const buffer2 = user.toBuffer(type);
                const hash2 = user.getHash();
                
                expect(buffer1.isEqual(buffer2)).toBe(true);
                expect(hash1.isEqual(hash2)).toBe(true);
            });
        }
    });
    describe('Admin', () => {
        for (const type of ['net', 'db'] as (Parameters<typeof User.fromBuffer>[1])[]) {
            test(type, () => {
                const [privateKey, publicKey] = getKeyPair();
                const userID = User.generateUserId();
                const parentID = User.generateUserId();
                const key = new KeySecp256k1(publicKey);
                const meta = 'Some text';
                const user = new UserAdmin({
                    userID,
                    parentID,
                    key,
                    meta
                });
                const buffer1 = user.toBuffer(type);
                const hash1 = user.getHash();
        
                user.fromBuffer(buffer1, type);
        
                const buffer2 = user.toBuffer(type);
                const hash2 = user.getHash();
                
                expect(buffer1.isEqual(buffer2)).toBe(true);
                expect(hash1.isEqual(hash2)).toBe(true);
            });
        }
    });
    describe('Voter', () => {
        for (const type of ['net', 'db'] as (Parameters<typeof User.fromBuffer>[1])[]) {
            test(type, () => {
                const [privateKey, publicKey] = getKeyPair();
                const userID = User.generateUserId();
                const parentID = User.generateUserId();
                const key = new KeySecp256k1(publicKey);
                const meta = 'Some text';
                const user = new UserVoter({
                    userID,
                    parentID,
                    key,
                    meta
                });
                const buffer1 = user.toBuffer(type);
                const hash1 = user.getHash();
        
                user.fromBuffer(buffer1, type);
        
                const buffer2 = user.toBuffer(type);
                const hash2 = user.getHash();
                
                expect(buffer1.isEqual(buffer2)).toBe(true);
                expect(hash1.isEqual(hash2)).toBe(true);
            });
        }
    });
});
