import * as Imagemagick from 'imagemagick';
import { Config, Cache } from './loader';
import { getStat } from './file';


interface ILoadedFeatures {
    [filePath: string]: Imagemagick.Features;
}

/**
 * 入力ファイルのFeaturesのキャッシュ
 */
let cacheloadedFeatures: ILoadedFeatures = {};

export interface IResizeSettings {
    scale: number;
    quality: number;
}

/**
 * リサイズするか
 * 
 * @export
 * @param {string} quality
 * @param {string} inputPath
 * @param {Imagemagick.Features} features
 * @param {IResizeSettings} settings
 * @param {Cache.ICache} cache
 * @returns {boolean}
 */
export function isResize(quality: string, inputPath: string, features: Imagemagick.Features, settings: IResizeSettings, cache: Cache.ICache): boolean {
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
 * 無視の対象か
 * 
 * @export
 * @param {string} inputPath
 * @param {Config.IQualitySetting} settings
 * @returns {boolean}
 */
export function isIgnore(inputPath: string, settings: Config.IQualitySetting): boolean {
    if (settings.ignoreSettings) {
        return settings.ignoreSettings.some((ignoreSetting: string) => {
            if (new RegExp(ignoreSetting.replace(/\\/g, '\\\\')).test(inputPath)) {
                return true;
            } else {
                return false
            }
        });
    }
    return false;
}

/**
 * 画像の設定取得
 * 
 * @export
 * @param {string} inputPath
 * @param {ISettings} settings
 * @returns {IResizeSettings}
 */
export function getResizeSettings(inputPath: string, settings: Config.IQualitySetting): IResizeSettings {
    let setting: IResizeSettings = {
        scale: settings.defaultScale || 1,
        quality: settings.defaultQuality || 1
    };
    if (settings.scaleSettings) {
        settings.scaleSettings.some((scaleSetting: Config.IScaleSetting) => {
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
 * @export
 * @param {string} inputPath
 * @returns {Promise<Imagemagick.Features>}
 */
export function getImageFeatures(inputPath: string): Promise<Imagemagick.Features> {
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
