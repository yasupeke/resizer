import * as Imagemagick from 'imagemagick';
import * as Progress from 'progress';
import { REG_INPUT_DIR_PATH, PARALLEL_MAX_COUNT, OUTPUT_DIR_PATH } from './constants/generator';
import { Config } from './loader';


interface IResizeSettings {
    scale: number;
    quality: number;
}

/**
 * 入力ファイルのFeaturesのキャッシュ
 */
let cacheloadedFeatures: { [filePath: string]: Imagemagick.Features } = {};

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
    return new Promise<Imagemagick.Features>((resolve: (features: Imagemagick.Features) => void) => {
        Imagemagick.identify(inputPath, (err: any, features: Imagemagick.Features) => {
            if (err || !features) {
                throw err;
            }
            resolve(features);
        });
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
 * 作成
 * 
 * @export
 * @param {string} quality
 * @param {ISettings} settings
 * @param {string[]} inputPaths
 * @returns {Promise<void>}
 */
export function generate(quality: string, settings: Config.ISettings, inputPaths: string[]): Promise<void> {
    return new Promise<void>((resolve: () => void) => {
        const progress = new Progress(
            `resized ${quality} [:bar] :percent :elapsed`,
            {
                total: inputPaths.length,
                width: 40,
                complete: '=',
                incomplete: ' '
            }
        );
        const exec = (paths: string[]): Promise<void> => {
            const execPaths = paths.splice(0, PARALLEL_MAX_COUNT);
            return Promise.all<Promise<void>>(execPaths.map((inputPath: string) => {
                return new Promise<void>((res: () => void) => {
                    const outputPath = `${OUTPUT_DIR_PATH}/${quality}/${inputPath.replace(REG_INPUT_DIR_PATH, '')}`;
                    const loadedFeature = cacheloadedFeatures[inputPath];
                    const resizeSettings = getResizeSettings(inputPath, settings);
                    if (loadedFeature) {
                        resize(inputPath, outputPath, loadedFeature.width, resizeSettings)
                            .then(() => {
                                res();
                            });
                    } else {
                        getImageFeatures(inputPath)
                            .then((features: Imagemagick.Features) => {
                                resize(inputPath, outputPath, features.width, resizeSettings)
                                    .then(() => {
                                        progress.tick();
                                        res();
                                    });
                            })
                            .catch((err: any) => {
                                throw err;
                            });
                    }
                });
            }))
                .then(() => {
                    if (paths.length > 0) {
                        exec(paths);
                    } else {
                        resolve();
                    }
                })
                .catch((err: any) => {
                    throw err;
                });
        };
        exec(inputPaths.concat());
    });
}