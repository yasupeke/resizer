import * as Fs from 'fs-extra';
import * as Imagemagick from 'imagemagick';
import * as Progress from 'progress';
import { REG_INPUT_DIR_PATH, PARALLEL_MAX_COUNT, OUTPUT_DIR_PATH } from './constants/generator';
import { Config, Cache } from './loader';
import { getStat } from './file';

interface IResizeSettings {
    scale: number;
    quality: number;
}

interface ILoadedFeatures {
    [filePath: string]: Imagemagick.Features;
}

/**
 * 入力ファイルのFeaturesのキャッシュ
 */
let cacheloadedFeatures: ILoadedFeatures = {};

/**
 * 画像の設定取得
 * 
 * @param {string} inputPath
 * @param {ISettings} settings
 * @returns {IResizeSettings}
 */
function getResizeSettings(inputPath: string, settings: Config.ISettings): IResizeSettings {
    let setting: IResizeSettings = {
        scale: settings.defaultScale,
        quality: settings.defaultQuality
    };
    if (settings.scaleSettings) {
        settings.scaleSettings.some((scaleSetting: Config.IScaleSettings) => {
            if (!new RegExp(scaleSetting.path.replace(/\\/g, '\\\\')).test(inputPath)) return false;
            setting = {
                scale: scaleSetting.scale,
                quality: scaleSetting.quality
            };
            return true;
        });
    }
    return setting;
}

/**
 * 画像のFeatures取得
 * 
 * @param {string} inputPath
 * @returns {Promise<Imagemagick.Features>}
 */
function getImageFeatures(inputPath: string): Promise<Imagemagick.Features> {
    const loadedFeature = cacheloadedFeatures[inputPath];
    return new Promise<Imagemagick.Features>((resolve: (features: Imagemagick.Features) => void) => {
        if (loadedFeature) {
            resolve(loadedFeature);
        } else {
            Imagemagick.identify(inputPath, (err: any, features: Imagemagick.Features) => {
                if (err || !features) {
                    throw err;
                }
                cacheloadedFeatures[inputPath] = features;
                resolve(features);
            });
        }
    });
}

/**
 * リサイズ
 * 
 * @param {string} inputPath
 * @param {string} outputPath
 * @param {number} width
 * @param {IScaleSettings} resizeSettings
 * @returns {Promise<void>}
 */
function resize(inputPath: string, outputPath: string, width: number, resizeSettings: IResizeSettings): Promise<void> {
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
 * リサイズするか
 * 
 * @param {string} quality
 * @param {string} inputPath
 * @param {Imagemagick.Features} features
 * @param {IResizeSettings} settings
 * @param {Cache.ICache} cache
 * @returns {boolean}
 */
function isResize(quality: string, inputPath: string, features: Imagemagick.Features, settings: IResizeSettings, cache: Cache.ICache): boolean {
    const cacheData = cache[inputPath];
    if (!cacheData) {
        return true;
    }

    const stat = getStat(inputPath);
    const updttime = stat.mtime.getTime();
    if (updttime !== cacheData.updtTime) {
        return true;
    }

    const cacheQualityData = cacheData.resizeData[quality];
    if (!cacheQualityData) {
        return true;
    }

    if (cacheQualityData.scale !== settings.scale) {
        return true;
    }

    if (cacheQualityData.quality !== settings.quality) {
        return true;
    }

    return false;
}

/**
 * 作成
 * 
 * @export
 * @param {string} quality
 * @param {ISettings} settings
 * @param {string[]} inputPaths
 * @param {Cache.ICache} cache
 * @returns {Promise<Cache.ICache>}
 */
export function generate(quality: string, settings: Config.ISettings, inputPaths: string[], cache: Cache.ICache): Promise<Cache.ICache> {
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
        const updateCache = (quality: string, inputPath: string, settings: IResizeSettings): void => {
            const stat = getStat(inputPath);
            cache[inputPath] = {
                updtTime: stat.mtime.getTime(),
                resizeData: {
                    [quality]: {
                        scale: settings.scale,
                        quality: settings.quality
                    }
                }
            };
        };
        const execResize = (inputPath: string): Promise<void> => {
            return new Promise<void>((res: () => void) => {
                const outputPath = `${OUTPUT_DIR_PATH}/${quality}/${inputPath.replace(REG_INPUT_DIR_PATH, '')}`;
                const resizeSettings = getResizeSettings(inputPath, settings);
                getImageFeatures(inputPath)
                    .then((features: Imagemagick.Features) => {
                        if (isResize(quality, inputPath, features, resizeSettings, cache)) {
                            resize(inputPath, outputPath, features.width, resizeSettings)
                                .then(() => {
                                    updateCache(quality, inputPath, resizeSettings);
                                    progress.tick();
                                    res();
                                });
                        } else {
                            progress.tick();
                            res();
                        }
                    })
                    .catch((err: any) => {
                        throw err;
                    });
            });
        };
        const exec = (paths: string[]): Promise<void> => {
            const execPaths = paths.splice(0, PARALLEL_MAX_COUNT);
            return Promise.all<Promise<void>>(execPaths.map((inputPath: string) => {
                return execResize(inputPath);
            }))
                .then(() => {
                    if (paths.length > 0) {
                        exec(paths);
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