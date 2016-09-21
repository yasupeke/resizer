import * as Path from 'path';
import * as Fs from 'fs-extra';
import { INPUT_DIR_PATH } from './constants/generator';
import { getInputPaths } from './path';
import { generate } from './generator';
import { createDir } from './dir';
import { Config, Cache } from './loader';

function execute(settings: Config.IQualitySettings, cache: Cache.ICache, inputFilePaths: string[]): Promise<Cache.ICache> {
    return new Promise<Cache.ICache>((resolve: (cache: Cache.ICache) => void) => {
        const exec = (settings: Config.IQualitySettings, cache: Cache.ICache, inputFilePaths: string[]): void => {
            for (let quality in settings) {
                const qualityConfig = settings[quality];
                createDir(quality, inputFilePaths)
                    .then(() => {
                        return generate(quality, qualityConfig, inputFilePaths, cache);
                    })
                    .then((newCache: Cache.ICache) => {
                        delete settings[quality];
                        if (Object.keys(settings).length > 0) {
                            exec(settings, cache, inputFilePaths);
                        } else {
                            resolve(newCache);
                        }
                    })
                    .catch((err: any) => {
                        throw err;
                    });
                break;
            }
        };
        exec(settings, cache, inputFilePaths);
    });
}

Promise.all<Config.IQualitySettings, Cache.ICache, string[]>([
    Config.read(),
    Cache.read(),
    getInputPaths(INPUT_DIR_PATH)
])
    .then<Cache.ICache>((results: [Config.IQualitySettings, Cache.ICache, string[]]) => {
        return execute(results[0], results[1], results[2]);
    })
    .then<void>((cache: Cache.ICache) => { 
        Cache.write(cache);
    })
    .catch((err: any) => {
        throw err;
    });
