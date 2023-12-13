export default function getLazyPromise<T = void>() {
    const api = {};
    const promise = new Promise<T>((resolve, reject) => Object.assign(api, {resolve, reject}));

    return Object.assign(promise, api) as Promise<T> & {resolve(arg: T): void, reject(error: any): void};
}
