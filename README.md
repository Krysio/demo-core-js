# A non-currency, blockchain-based system designed to collect votes.

This project is a prototype implementation of a single blockchain node written in TypeScript.

## System concept

There is a decentralized blockchain designed to collect the will of a closed group of users. The result of the system's operations is public blockchain data that can be read and interpreted by anyone who wants to.

### Other system features

 - use of digital signatures for authorization
 - use of these signatures to protect blockchain against modification and chain branching
 - ensuring privacy despite the signature
 - ensuring that the blockchain data cannot be manipulated by anyone
 - implementation of the liquid democracy
 - aiming for a large number of users

### and in the first steep

 - one, a general voting domain

## Some details

### Blockchain

Each command, equivalent of transaction in a currency-based blockchain system, must signed one of valid block. This ensures that the commands are non-transferable and that the blockchain is unmodifiable. The number of commands in a block define the value of that block.

### Data

One account is represented by one public key.

Uleb128 encoding is used to encode data.

## TODO

 - [ ] refactoring to the most suitable design pattern
 - [ ] E2E scenarios
 - [ ] command-line genesis-block creator
 - [ ] command-line launch