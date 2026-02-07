const { getLocaleFileContent, getLocaleFilePath, writeLocaleFile, getAvailableLanguages } = require('./helpers/locale');

function main() {
    const params = process.argv;

    if (params.length !== 4) {
        console.log('Invalid parameters. Usage: npm run locale:entry:all -- [key] [value]\nExample: npm run locale:entry:all -- components.sequence.imageHistory "Image History"');
        process.exit(1);
    }

    const localeKeyPath = params[2];
    const value = params[3];

    const languages = getAvailableLanguages();

    for (const language of languages) {
        const filename = getLocaleFilePath(language);
        const locale = getLocaleFileContent(language, filename);
        writeLocaleFile(filename, locale, localeKeyPath, value);
    }
}

main();
