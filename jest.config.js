/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: 'src',
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/$1'
    }
};
