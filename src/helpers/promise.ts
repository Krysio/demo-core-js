export function createBlockerPromise() {
    let handlers;
    const promise = new Promise((resolve, reject) => {
        handlers = { resolve, reject };
    }) as Promise<void>;

    Object.assign(promise, handlers);

    return promise as Promise<void> & { resolve(): void, reject(error: Error): void };
}

export function nextTickPromise() {
    return new Promise((resolve) => setTimeout(resolve, 0)) as Promise<void>;
}
