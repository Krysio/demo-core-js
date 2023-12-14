type RowOfMeasurement = {measurement: string, duration: number};
const mapOfDuration: {[key: string]: RowOfMeasurement} = {};
const listOfDuration: RowOfMeasurement[] = [];
const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
        if (mapOfDuration[entry.name]) {
            mapOfDuration[entry.name].duration += entry.duration;
        } else {
            const row: RowOfMeasurement = {
                duration: entry.duration,
                measurement: entry.name
            };
            mapOfDuration[entry.name] = row;
            listOfDuration.push(row);
        }
    });
});

observer.observe({ entryTypes: ["measure"], buffered: true });

export let isWaitForPerformanceObserver = false;

export function printMeasures() {
    listOfDuration.sort((a, b) => {
        if (a.measurement === b.measurement) return 0;
        return a.measurement > b.measurement ? 1 : -1;
    });
    console.table(listOfDuration, ['measurement', 'duration']);
}

let prevMarkName = '';

export function mark(arg: TemplateStringsArray) {
    prevMarkName = arg[0];
    performance.mark(arg[0]);
}

export function measure(name: string | TemplateStringsArray, markA?: string, markB?: string) {
    isWaitForPerformanceObserver = true;

    if (typeof name === 'string') {
        performance.measure(name, markA, markB);
    } else if (Array.isArray(name) && Array.isArray(name.raw)) { // TemplateStringsArray
        const startMark = prevMarkName;
        const endMark = `end:${name[0]}`;
        mark([endMark] as unknown as TemplateStringsArray);
        performance.measure(name[0], startMark, endMark);
    }
}
