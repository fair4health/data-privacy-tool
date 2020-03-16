
export class Utils {

    static groupBy (array, f) {
        const groups = {};
        array.forEach(o => {
            const group = JSON.stringify(f(o));
            groups[group] = groups[group] || [];
            groups[group].push(o);
        });
        return Object.keys(groups).map(group => {
            return groups[group];
        });
    }

    static isArray (what) {
        return Object.prototype.toString.call(what) === '[object Array]';
    }

}
