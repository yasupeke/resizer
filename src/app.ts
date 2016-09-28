import * as Path from 'path';
import * as Fs from 'fs-extra';
import { getInputPaths } from './path';
import { resizeAll } from './resize';
import { createDir } from './dir';
import { Config, Cache } from './loader';

function execute(config: Config.IConfig, cache: Cache.ICache, inputFilePaths: string[]): Promise<Cache.ICache> {
    return new Promise<Cache.ICache>((resolve: (cache: Cache.ICache) => void) => {
        const exec = (co: Config.IConfig, ca: Cache.ICache, ifp: string[]): void => {
            for (let quality in co.qualitySettings) {
                const qualityConfig = co.qualitySettings[quality];
                createDir(co.inputPath, co.outputPath, quality, ifp, qualityConfig)
                    .then(() => {
                        return resizeAll(co.inputPath, co.outputPath, quality, qualityConfig, ifp, ca);
                    })
                    .then((newCache: Cache.ICache) => {
                        delete co.qualitySettings[quality];
                        if (Object.keys(co.qualitySettings).length > 0) {
                            exec(co, ca, ifp);
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
        exec(config, cache, inputFilePaths);
    });
}

Promise.all<Config.IConfig, Cache.ICache>([
    Config.read(),
    Cache.read()
])
    .then<[Config.IConfig, Cache.ICache, string[]]>((results: [Config.IConfig, Cache.ICache]) => {
        const config = results[0];
        const cache = results[1];
        return getInputPaths(config.inputPath)
            .then<[Config.IConfig, Cache.ICache, string[]]>((inputPaths: string[]) => { 
                return [config, cache, inputPaths];
            });
    })
    .then<Cache.ICache>((results: [Config.IConfig, Cache.ICache, string[]]) => { 
        return execute(results[0], results[1], results[2])
    })
    .then<void>((cache: Cache.ICache) => { 
        Cache.write(cache);
    })
    .catch((err: any) => {
        throw err;
    });
