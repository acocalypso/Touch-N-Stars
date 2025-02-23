const { readFileSync, writeFileSync, readdirSync } = require('fs');
const { set } = require('lodash');

const getLocaleFilePath = (lang) => {
    return `./src/locales/${lang}.json`;
};

const getLocaleFileContent = (language, filename) => {
    const file = getLocaleFilePath(language);
    const fileContent = readFileSync(filename);

    return JSON.parse(fileContent);
};

const writeLocaleFile = (filename, locale, key, value) => {
    set(locale, key, value);
    writeFileSync(filename, JSON.stringify(locale, null, 2));
};

const getAvailableLanguages = () => {
    const files = readdirSync('./src/locales');
    
    return files.map(file => file.split('.')[0]);
};

module.exports = {
    getLocaleFilePath,
    getLocaleFileContent,
    writeLocaleFile,
    getAvailableLanguages,
};
