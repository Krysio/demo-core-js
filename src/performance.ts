const mapOfDuration: {[key: string]: number} = {};
const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
        if (mapOfDuration[entry.name]) {
            mapOfDuration[entry.name]+= entry.duration;
        } else {
            mapOfDuration[entry.name] = entry.duration;
        }
    });
});

observer.observe({ entryTypes: ["measure"], buffered: true });

export let isWaitForPerformanceObserver = false;

export function printMeasures() {
    console.table(mapOfDuration);
}

export function mark(arg: TemplateStringsArray) {
    performance.mark(arg[0]);
}

export function measure(name: string, markA: string, markB: string) {
    isWaitForPerformanceObserver = true;
    performance.measure(name, markA, markB);
}
