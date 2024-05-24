export default class Time {
    public static now() {
        return Date.now();
    }
    public static wait(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    public static timeToSQL(time: number) {
        return (new Date(time)).toISOString().replace('T', ' ').substring(0, 19);
    }
}
