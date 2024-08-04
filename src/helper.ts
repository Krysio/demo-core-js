export function isProductionEnv() { return process.env.NODE_ENV === 'production'; }
export function isTestingEnv() { return process.env.NODE_ENV === 'test'; }
