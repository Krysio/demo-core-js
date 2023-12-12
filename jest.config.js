/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: 'src',
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/$1'
    }
};