import * as Path from 'path';
import * as Fs from 'fs-extra';
import * as Imagemagick from 'imagemagick';
import * as Progress from 'progress';
import { DEFAULT_PARALLEL_MAX_COUNT } from './constants/generator';
import { Config, Cache } from './loader';
import * as File from './file';
import * as Util from './util';

/**
 * リサイズ
 * 
 * @param {string} inputPath
 * @param {string} outputPath
 * @param {number} width
 * @param {Util.IScaleSettings} resizeSettings
 * @returns {Promise<void>}
 */
function resize(inputPath: string, outputPath: string, width: number, resizeSettings: Util.IResizeSettings): Promise<void> {
    return new Promise<void>((resolve: () => void, reject: (err: any) => void) => {
        Imagemagick.resize(
            {
                srcPath: inputPath,
                dstPath: outputPath,
                width: width * resizeSettings.scale,
                quality: resizeSettings.quality || 1
            },
            (err: any) => {
                if (err) {
                    reject(err);
                }
                resolve();
            }
        );
    });
}

/**
 * 作成
 * 
 * @export
 * @param {string} inputDirPath
 * @param {string} outputDirPath
 * @param {string} quality
 * @param {Config.IQualitySetting} settings
 * @param {string[]} inputPaths
 * @param {Cache.ICache} cache
 * @returns {Promise<Cache.ICache>}
 */
export function resizeAll(
    inputDirPath: string,
    outputDirPath: string,
    quality: string,
    settings: Config.IQualitySetting,
    inputPaths: string[],
    cache: Cache.ICache
): Promise<Cache.ICache> {
    const regInputDirPath = new RegExp(`^${Path.join(__dirname, inputDirPath).replace(/\\/g, '\\\\')}\\\\`)
    return new Promise<Cache.ICache>((resolve: (cache: Cache.ICache) => void) => {
        const progress = new Progress(
            `resized ${quality} [:bar] :percent :elapsed`,
            {
                total: inputPaths.length,
                width: 40,
                complete: '=',
                incomplete: ' '
            }
        );
        const updateCache = (q: string, ip: string, s: Util.IResizeSettings): void => {
            const stat = File.getStat(ip);
            cache[ip] = {
                updtTime: stat.mtime.getTime(),
                resizeData: {
                    [q]: {
                        scale: s.scale,
                        quality: s.quality
                    }
                }
            };
        };
        const execResize = (ip: string): Promise<void> => {
            return new Promise<void>((res: () => void) => {
                const outputPath = Path.join(__dirname, `${outputDirPath}/${quality}/${ip.replace(regInputDirPath, '')}`);
                const resizeSettings = Util.getResizeSettings(ip, settings);
                if (resizeSettings.scale === 1 && resizeSettings.quality === 1) {
                    File.copy(ip, outputPath)
                        .then(() => {
                            res();
                        });
                } else {
                    Util.getImageFeatures(ip)
                        .then((features: Imagemagick.Features) => {
                            if (Util.isResize(quality, ip, features, resizeSettings, cache)) {
                                resize(ip, outputPath, features.width, resizeSettings)
                                    .then(() => {
                                        updateCache(quality, ip, resizeSettings);
                                        res();
                                    });
                            } else {
                                res();
                            }
                        })
                        .catch((err: any) => {
                            throw err;
                        });
                }
            });
        };
        const exec = (ps: string[]): Promise<void> => {
            const execPaths = ps.splice(0, DEFAULT_PARALLEL_MAX_COUNT);
            return Promise.all<Promise<void>>(execPaths.map((inputPath: string) => {
                if (Util.isIgnore(inputPath, settings)) {
                    return Promise.resolve();
                } else {
                    return execResize(inputPath);
                }
            }))
                .then(() => {
                    progress.tick(execPaths.length);
                    if (ps.length > 0) {
                        exec(ps);
                    } else {
                        resolve(cache);
                    }
                })
                .catch((err: any) => {
                    throw err;
                });
        };
        exec(inputPaths.concat());
    });
}