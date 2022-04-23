import { getKeys } from "@/libs/crypto/ec/secp256k1";
import { RunConfig } from "@/run";

export const defaultKeyPairs = {
  private: '732713759d40b658fddf9fa3749ba42ac85fc37937c5b77b5ac33b5a2876a04d',
  public: '02a212cd1b4eae6f4f81149342ae5f8490f1282b7b8bc07e89756575fd53e493c3'
};

export function testingGetDefaultInitials() {
  const config: RunConfig = {
    genesisTime: Date.now(),
    blockPeriod: 1e3,
    rootPublicKey: defaultKeyPairs.public
  };

  return config;
}
