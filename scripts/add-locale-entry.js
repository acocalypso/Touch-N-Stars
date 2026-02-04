import { getLocaleFileContent, getLocaleFilePath, writeLocaleFile } from './helpers/locale.js';

function main() {
    const params = process.argv;

    if (params.length !== 5) {
        console.log('Invalid parameters. Usage: npm run locale:entry -- [lang] [key] [value]\nExample: npm run locale:entry -- en components.sequence.imageHistory "Image History"');
        process.exit(1);
    }

    const language = params[2];
    const localeKeyPath = params[3];
    const value = params[4];

    const filename = getLocaleFilePath(language);
    const locale = getLocaleFileContent(language, filename);
    writeLocaleFile(filename, locale, localeKeyPath, value);
}

main();
