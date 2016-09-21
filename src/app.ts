import * as Path from 'path';
import * as Fs from 'fs-extra';
import { INPUT_DIR_PATH } from './constants/generator';
import { getUpdateInputPaths } from './path';
import { generate } from './generator';
import { generateDir } from './dir';
import { Config } from './loader';


function execute(settings: Config.IQualitySettings, inputFilePaths: string[]): void {
    for (let quality in settings) {
        const qualityConfig = settings[quality];
        generateDir(quality, inputFilePaths)
            .then(() => {
                generate(quality, qualityConfig, inputFilePaths)
                    .then(() => {
                        delete settings[quality];
                        execute(settings, inputFilePaths);
                    });
            })
            .catch((err: any) => {
                throw err;
            });
        break;
    }
}

Promise.all<Config.IQualitySettings, string[]>([
    Config.read(),
    getUpdateInputPaths(INPUT_DIR_PATH)
])
    .then<void>((results: [Config.IQualitySettings, string[]]) => {
        execute(results[0], results[1]);
    })
    .catch((err: any) => {
        throw err;
    });
