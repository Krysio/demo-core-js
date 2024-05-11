export default class Time {
    public static now() {
        return Date.now();
    }
    public static wait(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
