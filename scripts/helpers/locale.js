import { readFileSync, writeFileSync, readdirSync } from 'fs';
import lodash from 'lodash';
const { set } = lodash;

export const getLocaleFilePath = (lang) => {
    return `./src/locales/${lang}.json`;
};

export const getLocaleFileContent = (language, filename) => {
    const file = getLocaleFilePath(language);
    const fileContent = readFileSync(filename);

    return JSON.parse(fileContent);
};

export const writeLocaleFile = (filename, locale, key, value) => {
    set(locale, key, value);
    writeFileSync(filename, JSON.stringify(locale, null, 2));
};

export const getAvailableLanguages = () => {
    const files = readdirSync('./src/locales');

    return files.map(file => file.split('.')[0]);
};
