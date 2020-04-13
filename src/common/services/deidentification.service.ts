import {FhirService} from '@/common/services/fhir.service';
import {environment} from '@/common/environment';
import RandExp from 'randexp';
import moment from 'moment-timezone';
import {Utils} from '@/common/utils/util';

export class DeidentificationService {
    fhirService: FhirService;
    typeMappings: any;
    parameterMappings: any;
    rareValueMappings: any;
    requiredElements: string[];
    identifiers: string[][];
    quasis: string[][];
    sensitives: string[][];
    riskyQuasis: string[];
    equivalenceClasses: any;
    canBeAnonymizedMore: boolean;
    anonymizedData;

    constructor (typeMappings: any, parameterMappings: any, rareValueMappings: any, requiredElements: string[]) {
        this.fhirService = new FhirService();
        this.typeMappings = typeMappings;
        this.parameterMappings = parameterMappings;
        this.rareValueMappings = rareValueMappings;
        this.requiredElements = requiredElements;
        this.identifiers = [];
        this.quasis = [];
        this.sensitives = [];
        this.riskyQuasis = [];
        this.equivalenceClasses = {};
        this.canBeAnonymizedMore = true;
    }

    getEntries (resource: string, profile: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.fhirService.search('StructureDefinition',
                {_summary: 'data', base: `${environment.hl7}/StructureDefinition/${resource}`}, true)
                .then(res => {
                    let query = {};
                    if (resource !== profile) { // Not a Base Profile
                        const url = res.data.entry.find(item => item.resource.id === profile).resource.url;
                        query = {_profile: url};
                    }
                    this.fhirService.search(resource, query, true)
                        .then(response => {
                            resolve({resource, profile, entries: response.data.entry});
                        })
                })
        })
    }

    deidentify (resource: string, profile: string, identifiers: string[][], quasis: string[][], sensitives: string[][],
                entries, kAnonymityValid: boolean, kValue: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.identifiers = identifiers;
            this.quasis = quasis;
            this.sensitives = sensitives;
            entries.map(entry => this.changeAttributes(resource + '.' + profile, entry.resource));
            let finalData: any[] = [];
            if (kAnonymityValid) {
                const bulk = JSON.parse(JSON.stringify(entries));
                this.anonymizedData = JSON.parse(JSON.stringify(bulk.splice(0, environment.kAnonymityBlockSize)));
                while (this.anonymizedData.length) {
                    [this.identifiers, this.quasis, this.sensitives, this.canBeAnonymizedMore] = [identifiers, quasis, sensitives, true];
                    const anonymizedBulk = this.makeKAnonymous(resource, profile, kValue, this.anonymizedData);
                    finalData.push(...anonymizedBulk);
                    this.anonymizedData = JSON.parse(JSON.stringify(bulk.splice(0, environment.kAnonymityBlockSize)));
                }
            } else {
                finalData = entries;
            }
            resolve({resource, profile, entries: finalData, quasis});
        })
    }

    makeKAnonymous (resource: string, profile: string, kValue: number, anonymizedData) {
        const keys: string[] = [];
        this.quasis.forEach(paths => {
            let [key, i] = [resource + '.' + profile, 0];
            while (i < paths.length) {
                key += '.' + paths[i++];
            }
            if (this.parameterMappings[key].name === 'Pass Through' || this.parameterMappings[key].name === 'Generalization' ||
                (this.parameterMappings[key].name === 'Substitution' && !environment.primitiveTypes[this.typeMappings[key]].regex
                    && this.parameterMappings[key].lengthPreserved)) {
                keys.push(key);
            }
        });
        keys.sort().forEach(key => {
            const required = this.requiredElements.includes(key);
            let equivalenceClasses = this.generateEquivalenceClasses(resource, key, anonymizedData);
            while (this.canBeAnonymizedMore) {
                let parametersChanged = false;
                let eqClassesSmall = false;
                equivalenceClasses.forEach(eqClass => {
                    if (eqClass.length < kValue) {
                        if (!parametersChanged) {
                            this.changeParameters(resource, eqClass, key, required);
                            parametersChanged = true;
                        }
                        eqClass = eqClass.map(entry => this.changeAttributes(resource + '.' + profile, entry.resource));
                        eqClassesSmall = true;
                    }
                });
                equivalenceClasses = this.generateEquivalenceClasses(resource, key, anonymizedData);
                anonymizedData = [].concat(...equivalenceClasses);
                if (eqClassesSmall) {
                    this.canBeAnonymizedMore = false;
                }
            }
            equivalenceClasses = equivalenceClasses.filter(eqClass => eqClass.length >= kValue);
            anonymizedData = [].concat(...equivalenceClasses);
        });
        return anonymizedData;
    }

    changeParameters (resource: string, eqClass: any[], key: string, required: boolean) {
        const primitiveType = this.typeMappings[key];
        const algorithm = this.parameterMappings[key];
        [this.quasis, this.sensitives, this.identifiers] = [[], [], []];
        switch (algorithm.name) {
            case 'Pass Through':

                // TODO change according to primitive type

                break;
            case 'Generalization':
                if (primitiveType === 'decimal') { // Decimal places of the floating number will be rounded
                    if (this.parameterMappings[key].roundDigits) {
                        this.parameterMappings[key].roundDigits--;
                        this.quasis.push(key.split('.').slice(2));
                    } else if (!required) {
                        this.identifiers.push(key.split('.').slice(2));
                        this.canBeAnonymizedMore = false;
                    } else {
                        this.canBeAnonymizedMore = false;
                    }
                } else if (primitiveType === 'integer' || primitiveType === 'unsignedInt' || primitiveType === 'positiveInt') { // Last digits of the integer will be rounded
                    const minDigitLength = this.getDigitLength(eqClass[0].resource, key);
                    if (this.parameterMappings[key].roundDigits < minDigitLength - 1) {
                        this.parameterMappings[key].roundDigits++;
                        this.quasis.push(key.split('.').slice(2));
                    } else if (!required) {
                        this.identifiers.push(key.split('.').slice(2));
                        this.canBeAnonymizedMore = false;
                    } else {
                        this.canBeAnonymizedMore = false;
                    }
                } else if (primitiveType === 'time') { // HH:mm:ss ['Hours', 'Minutes', 'Seconds'] TO BE ROUNDED
                    if (this.parameterMappings[key].dateUnit === 'Seconds') {
                        this.parameterMappings[key].dateUnit = 'Minutes'; // Generalize data more
                        this.quasis.push(key.split('.').slice(2));
                    } else if (this.parameterMappings[key].dateUnit === 'Minutes') {
                        this.parameterMappings[key].dateUnit = 'Hours'; // Generalize data more
                        this.quasis.push(key.split('.').slice(2));
                    } else if (this.parameterMappings[key].dateUnit === 'Hours' && !required) { // remove attribute
                        this.identifiers.push(key.split('.').slice(2));
                        this.canBeAnonymizedMore = false;
                    } else { // remove entries that not satisfies k-anonymity as F. Prasser, et al. (Record Suppression)
                        this.canBeAnonymizedMore = false;
                    }
                } else { // instant YYYY-MM-DDThh:mm:ss.sss+zz:zz ['Years', 'Months', 'Days', 'Hours', 'Minutes'] TO BE ROUNDED
                    // date (YYYY, YYYY-MM, or YYYY-MM-DD) or dateTime (YYYY, YYYY-MM, YYYY-MM-DD or YYYY-MM-DDThh:mm:ss+zz:zz) ['Years', 'Months', 'Days'] TO BE REMOVED
                    if (this.parameterMappings[key].dateUnit === 'Minutes') {
                        this.parameterMappings[key].dateUnit = 'Hours'; // Generalize data more
                        this.quasis.push(key.split('.').slice(2));
                    } else if (this.parameterMappings[key].dateUnit === 'Hours') {
                        this.parameterMappings[key].dateUnit = 'Days'; // Generalize data more
                        this.quasis.push(key.split('.').slice(2));
                    } else if (this.parameterMappings[key].dateUnit === 'Days') {
                        this.parameterMappings[key].dateUnit = 'Months'; // Generalize data more
                        this.quasis.push(key.split('.').slice(2));
                    } else if (this.parameterMappings[key].dateUnit === 'Months') {
                        this.parameterMappings[key].dateUnit = 'Years'; // Generalize data more
                        this.quasis.push(key.split('.').slice(2));
                    } else if (this.parameterMappings[key].dateUnit === 'Years' && !required) { // remove attribute
                        this.identifiers.push(key.split('.').slice(2));
                        this.canBeAnonymizedMore = false;
                    } else { // remove entries that not satisfies k-anonymity as F. Prasser, et al. (Record Suppression)
                        this.canBeAnonymizedMore = false;
                    }
                }
                break;
            case 'Substitution': // data with regex is already filtered
                if (algorithm.lengthPreserved) { // anonymize again with fixed length
                    this.parameterMappings[key] = environment.algorithms.SUBSTITUTION;
                    this.parameterMappings[key].lengthPreserved = false;
                    this.quasis.push(key.split('.').slice(2));
                } else if (!required) { // remove attribute
                    this.identifiers.push(key.split('.').slice(2));
                    this.canBeAnonymizedMore = false;
                } else { // remove entries that not satisfies k-anonymity as F. Prasser, et al. (Record Suppression)
                    this.canBeAnonymizedMore = false;
                }
                break;
        }
    }

    generateEquivalenceClasses (resource: string, key: string, entries) {
        const equivalenceClasses = Utils.groupBy(entries, item => {
            const groups: any[] = [];
            const result = Utils.returnEqClassElements(key.split('.').slice(2), item.resource, []);
            groups.push(result);
            return groups; // undefined values are considered as the same
        });
        equivalenceClasses.sort((a: any, b: any) => {
            const element1 = Utils.returnEqClassElements(key.split('.').slice(2), a[0].resource, []);
            const element2 = Utils.returnEqClassElements(key.split('.').slice(2), b[0].resource, []);
            return this.sortFunction(element1, element2, key);
        });
        return equivalenceClasses;
    }

    sortFunction (element1, element2, key): number {
        if (element1 === undefined) {
            return 1;
        } else if (element2 === undefined) {
            return -1;
        }
        switch (this.typeMappings[key]) {
            case 'instant':
                const [dates1, times1] = element1.split('T');
                const [year1, month1, day1] = dates1.split('-');
                const [hour1, minute1, second1] = times1.split(':');
                element1 = new Date(+year1, +month1 - 1, +day1, +hour1, +minute1, +second1.substring(0, 2));
                const [dates2, times2] = element2.split('T');
                const [year2, month2, day2] = dates2.split('-');
                const [hour2, minute2, second2] = times2.split(':');
                element2 = new Date(+year2, +month2 - 1, +day2, +hour2, +minute2, +second2.substring(0, 2));
                break;
            case 'date':
            case 'dateTime':
                const [tempYear1, tempMonth1, tempDay1] = element1.split('-');
                element1 = new Date(+tempYear1, tempMonth1 ? +tempMonth1 - 1 : 0, tempDay1 ? +tempDay1 : 1);
                const [tempYear2, tempMonth2, tempDay2] = element2.split('-');
                element2 = new Date(+tempYear2, tempMonth2 ? +tempMonth2 - 1 : 0, tempDay2 ? +tempDay2 : 1);
                break;
            case 'time':
                element1 = new Date(moment(element1, 'HH:mm:ss'));
                element2 = new Date(moment(element2, 'HH:mm:ss'));
                break;
        }
        if (element1 < element2) {
            return -1;
        } else if (element1 > element2) {
            return 1;
        }
        return 0;
    }

    changeAttributes (prefix: string, attributes) {
        this.quasis.forEach(paths => {
            let key = prefix;
            let attribute = attributes;
            let i = 0;
            while (i < paths.length && attribute) {
                key += '.' + paths[i];
                attribute = this.handleQuasis(key, attribute, paths, i++, paths.length - 1);
            }
        });
        this.sensitives.forEach(paths => {
            let key = prefix;
            let attribute = attributes;
            let i = 0;
            while (i < paths.length && attribute) {
                key += '.' + paths[i];
                attribute = this.handleSensitives(key, attribute, paths, i++, paths.length - 1);
            }
        });
        this.identifiers.forEach(paths => {
            let key = prefix;
            let attribute = attributes;
            let i = 0;
            while (i < paths.length && attribute) {
                key += '.' + paths[i];
                attribute = this.removeIdentifiers(key, attribute, paths, i++, paths.length - 1);
            }
        });
        return this.clearResource(attributes);
    }

    removeIdentifiers (key: string, attribute, paths, index: number, end: number) {
        if (attribute[paths[index]] && Utils.isArray(attribute[paths[index]])) { // array
            const len = attribute[paths[index]].length;
            for (let i = 0; i < len; i++) {
                const elem = attribute[paths[index]][i];
                if (paths[index + 1]) { // objects in array
                    attribute[paths[index]][i] = this.removeIdentifiers(key + '.' + paths[index + 1], elem, paths.slice(1), index, end - 1);
                } else { // primitives in array
                    delete attribute[paths[index]];
                }
            }
        } else if (index === end && attribute[paths[index]]) { // primitives/leaves
            delete attribute[paths[index]];
        }
        return attribute;
    }

    handleQuasis (key: string, attribute, paths, index: number, end: number) {
        if (attribute[paths[index]] && Utils.isArray(attribute[paths[index]])) { // array
            const len = attribute[paths[index]].length;
            for (let i = 0; i < len; i++) {
                const elem = attribute[paths[index]][i];
                if (paths[index + 1]) { // objects in array
                    attribute[paths[index]][i] = this.handleQuasis(key + '.' + paths[index + 1], elem, paths.slice(1), index, end - 1);
                } else { // primitives in array
                    attribute[paths[index]][i] = this.executeAlgorithm(key, this.parameterMappings[key], elem, this.typeMappings[key]);
                }
            }
        } else if (index === end && attribute[paths[index]]) { // primitives/leaves
            attribute[paths[index]] = this.executeAlgorithm(key, this.parameterMappings[key], attribute[paths[index]], this.typeMappings[key]);
        }
        return attribute;
    }

    handleSensitives (key: string, attribute, paths, index: number, end: number) {
        if (attribute[paths[index]] && Utils.isArray(attribute[paths[index]])) { // array
            const len = attribute[paths[index]].length;
            for (let i = 0; i < len; i++) {
                const elem = attribute[paths[index]][i];
                if (paths[index + 1]) { // objects in array
                    attribute[paths[index]][i] = this.handleSensitives(key + '.' + paths[index + 1], elem, paths.slice(1), index, end - 1);
                } else { // primitives in array
                    if (this.parameterMappings[key].hasRare && this.rareValueMappings[key] && this.rareValueMappings[key].length
                        && (this.rareValueMappings[key].includes(attribute[paths[index]][i]))) {
                        attribute[paths[index]][i] = this.executeAlgorithm(key, this.parameterMappings[key].algorithm, elem, this.typeMappings[key]);
                    }
                }
            }
        } else if (index === end && attribute[paths[index]]) { // primitives/leaves
            if (this.parameterMappings[key].hasRare && this.rareValueMappings[key] && this.rareValueMappings[key].length
                && (this.rareValueMappings[key].includes(attribute[paths[index]]))) {
                attribute[paths[index]] = this.executeAlgorithm(key, this.parameterMappings[key].algorithm, attribute[paths[index]], this.typeMappings[key]);
            }
        }
        return attribute;
    }

    executeAlgorithm (key, parameters, data, primitiveType) {
        const regex = environment.primitiveTypes[primitiveType].regex;
        switch (parameters.name) {
            case 'Pass Through':
                break;
            case 'Redaction':
                this.identifiers.push(key.split('.').slice(2));
                break;
            case 'Substitution':
                if (regex) {
                    data = new RandExp(regex).gen();
                } else {
                    data = new Array(Number(parameters.lengthPreserved ? data.length : parameters.fixedLength) + 1)
                        .join( parameters.substitutionChar );
                }
                break;
            case 'Recoverable Substitution':
                data = btoa(data); // recover function is atob(data)
                break;
            case 'Fuzzing':
                data += this.getRandomFloat(-parameters.percentage, parameters.percentage);
                if (primitiveType === 'integer') { // A signed integer in the range −2,147,483,648..2,147,483,647
                    data = Math.round(data);
                } else if (primitiveType === 'unsignedInt') { // Any non-negative integer in the range 0..2,147,483,647
                    data = Math.round(Math.abs(data));
                } else if (primitiveType === 'positiveInt') { // Any positive integer in the range 1..2,147,483,647
                    data = Math.round(Math.abs(data)) ? Math.round(Math.abs(data)) : 1;
                }
                break;
            case 'Generalization':
                if (primitiveType === 'decimal') { // Decimal places of the floating number will be rounded
                    const denary = Math.pow(10, parameters.roundDigits);
                    data = parameters.roundedToFloor ? Math.floor(data * denary) / denary : Math.ceil(data * denary) / denary;
                } else if (primitiveType === 'integer' || primitiveType === 'unsignedInt' || primitiveType === 'positiveInt') { // Last digits of the integer will be rounded
                    const denary = Math.pow(10, parameters.roundDigits);
                    data = parameters.roundedToFloor ? Math.floor(data / denary) * denary : Math.ceil(data / denary) * denary;
                } else if (primitiveType === 'time') { // HH:mm:ss ['Hours', 'Minutes', 'Seconds'] TO BE ROUNDED
                    let tempDate = moment(data, 'HH:mm:ss');
                    tempDate = this.roundTime(new Date(tempDate), parameters.dateUnit);
                    data = moment(tempDate).format('HH:mm:ss');
                } else if (primitiveType === 'instant') { // YYYY-MM-DDThh:mm:ss.sss+zz:zz ['Years', 'Months', 'Days', 'Hours', 'Minutes'] TO BE ROUNDED
                    const [dates, times] = data.split('T');
                    const [year, month, day] = dates.split('-');
                    const [hour, minute, second] = times.split(':');
                    let tempDate = new Date(+year, +month - 1, +day, +hour, +minute, +second.substring(0, 2));
                    tempDate = this.roundTime(tempDate, parameters.dateUnit);
                    data = moment(tempDate).tz(moment.tz.guess()).format('YYYY-MM-DDTHH:mm:ss.000Z');
                } else { // date (YYYY, YYYY-MM, or YYYY-MM-DD) or dateTime (YYYY, YYYY-MM, YYYY-MM-DD or YYYY-MM-DDThh:mm:ss+zz:zz) ['Years', 'Months', 'Days'] TO BE REMOVED
                    const [year, month, day] = data.split('-');
                    if (!month || parameters.dateUnit === 'Years') {
                        data = year;
                    } else if (parameters.dateUnit === 'Months') {
                        data = year + '-' + month;
                    } else { // parameters.dateUnit === 'Days'
                        if (!day) {
                            data = year + '-' + month;
                        } else {
                            data = year + '-' + month + '-' + day.substring(0, 2);
                        }
                    }
                }
                break;
            case 'Date Shifting': // Date will be shifted randomly within a range that you provide
                if (primitiveType === 'time') { // HH:mm:ss ['Hours', 'Minutes', 'Seconds']
                    let tempDate = moment(data, 'HH:mm:ss');
                    tempDate = this.getRandomDate(new Date(tempDate), parameters.dateUnit, parameters.range);
                    data = moment(tempDate).format('HH:mm:ss');
                } else if (primitiveType === 'instant') { // YYYY-MM-DDThh:mm:ss.sss+zz:zz ['Years', 'Months', 'Days', 'Hours', 'Minutes']
                    const [dates, times] = data.split('T');
                    const [year, month, day] = dates.split('-');
                    const [hour, minute, second] = times.split(':');
                    let tempDate = new Date(+year, +month - 1, +day, +hour, +minute, +second.substring(0, 2));
                    tempDate = this.getRandomDate(tempDate, parameters.dateUnit, parameters.range);
                    data = moment(tempDate).tz(moment.tz.guess()).format('YYYY-MM-DDTHH:mm:ss.000Z');
                } else { // date (YYYY, YYYY-MM, or YYYY-MM-DD) or dateTime (YYYY, YYYY-MM, YYYY-MM-DD or YYYY-MM-DDThh:mm:ss+zz:zz) ['Years', 'Months', 'Days']
                    const [year, month, day] = data.split('-');
                    let tempDate = new Date(+year, month ? +month - 1 : 0, day ? +day : 1);
                    tempDate = this.getRandomDate(tempDate, parameters.dateUnit, parameters.range);
                    data = moment(tempDate).tz(moment.tz.guess()).format(day ? 'YYYY-MM-DD' : (month ? 'YYYY-MM' : 'YYYY'));
                }
                break;
        }
        return data;
    }

    clearResource (attributes) {
        Object.keys(attributes).forEach(key => {
            if (Utils.isArray(attributes[key])) { // array
                let index = 0;
                for (const elem of attributes[key]) {
                    if (!Object.keys(elem).length) { // empty object
                        attributes[key].splice(index, 1);
                    } else {
                        index++;
                    }
                }
                if (!attributes[key].length) {
                    delete attributes[key];
                }
            } else if (typeof attributes[key] === 'object') { // not array and not primitive type. it is object
                attributes[key] = this.clearResource(attributes[key]);
            }
        });
        return attributes;
    }

    roundTime (date: Date, unit: string): Date {
        let p = 1;
        switch (unit) {
            case 'Years':
                const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
                const lastDayOfYear = new Date(date.getFullYear(), 11, 31);
                const deltaToFirstDay = Math.abs(date.getTime() - firstDayOfYear.getTime());
                const deltaToLastDay = Math.abs( lastDayOfYear.getTime() - date.getTime());
                if (deltaToFirstDay <= deltaToLastDay) {
                    return firstDayOfYear;
                } else {
                    return new Date(date.getFullYear() + 1, 0, 1);
                }
            case 'Months':
                const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
                const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                const deltaToFirst = Math.abs(date.getTime() - firstDayOfMonth.getTime());
                const deltaToLast = Math.abs( lastDayOfMonth.getTime() - date.getTime());
                if (deltaToFirst <= deltaToLast) {
                    return firstDayOfMonth;
                } else {
                    return new Date(date.getFullYear(), date.getMonth() + 1, 1);
                }
            case 'Days':
                p = 24 * 60 * 60 * 1000; // milliseconds in a day
                const userOffset = date.getTimezoneOffset() * 60 * 1000; // user's offset time
                return new Date((Math.round(date.getTime() / p ) * p) + userOffset ); // redefine variable
            case 'Hours':
                p = 60 * 60 * 1000; // milliseconds in an hour
                break;
            case 'Minutes':
                p = 60 * 1000; // milliseconds in a minute
                break;
        }
        return new Date(Math.round(date.getTime() / p ) * p);
    }

    getRandomDate (date: Date, unit: string, range: number) {
        range = Number(range);
        let [start, end] = [date, date];
        switch (unit) {
            case 'Years':
                start = new Date(date.getFullYear() - range, date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
                end = new Date(date.getFullYear() + range, date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
                break;
            case 'Months':
                start = new Date(date.getFullYear(), date.getMonth() - range, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
                end = new Date(date.getFullYear(), date.getMonth() + range, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
                break;
            case 'Days':
                start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - range, date.getHours(), date.getMinutes(), date.getSeconds());
                end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + range, date.getHours(), date.getMinutes(), date.getSeconds());
                break;
            case 'Hours':
                start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() - range, date.getMinutes(), date.getSeconds());
                end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() + range, date.getMinutes(), date.getSeconds());
                break;
            case 'Minutes':
                start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes() - range, date.getSeconds());
                end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes() + range, date.getSeconds());
                break;
            case 'Seconds':
                start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds() - range);
                end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds() + range);
                break;
        }
        return new Date(Math.round(this.getRandomFloat(start.getTime(), end.getTime())));
    }

    getRandomFloat (min, max) {
        return Math.random() * (max - min) + min;
    }

    getDigitLength (resource, key) {
        const integer = Utils.returnEqClassElements(key.split('.').slice(2), resource, []);
        return integer.toString().length;
    }

}
