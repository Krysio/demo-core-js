const EMPTY_FUNCTION = (param: any) => {};

/******************************/

export default class LazyPromise<T> {
    protected promise: Promise<T> | null = null;
    protected $resolve = EMPTY_FUNCTION;
    protected $reject = EMPTY_FUNCTION;

    /******************************/

    reset(): void {
        this.promise = new Promise((resolve, reject) => {
            this.$resolve = (argument) => {
                resolve(argument);
            };
            this.$reject = (argument) => {
                reject(argument);
            };
        });
    }

    /******************************/

    get() {
        if (this.promise === null) {
            this.reset();
        }

        return this.promise as Promise<T>;
    }

    resolve = (argument?: T) => {
        return this.$resolve(argument);
    }

    reject = (argument?: Error) => {
        return this.$reject(argument);
    }
}
