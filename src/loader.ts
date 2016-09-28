import * as Fs from 'fs-extra';
import { DEFAULT_CACHE_PATH, DEFAULT_CONFIG_PATH } from './constants/generator';

export module Config {
    export interface IConfig { 
        inputPath: string;
        outputPath: string;
        qualitySettings: { [quality: string]: IQualitySetting };
    }

    export interface IQualitySetting {
        defaultScale: number;
        defaultQuality?: number;
        scaleSettings?: IScaleSetting[];
        ignoreSettings?: string[];
    }

    export interface IScaleSetting {
        path: string;
        scale: number;
        quality?: number;
    }

    /**
     * 設定データを読み込み
     * 
     * @export
     * @returns {Promise<IConfig>}
     */
    export function read(): Promise<IConfig> {
        return new Promise<IConfig>((resolve: (data: IConfig) => void, reject: (err: any) => void) => {
            Fs.readJSON(DEFAULT_CONFIG_PATH, 'utf-8', (err: NodeJS.ErrnoException, json: IConfig) => {
                if (err) {
                    reject(err);
                }
                json.inputPath = `../${json.inputPath}`; 
                json.outputPath = `../${json.outputPath}`; 
                resolve(json);
            });
        });
    }
}

export module Cache {
    export interface ICache {
        [filePath: string]: IResizedData;
    }

    export interface IResizedData {
        updtTime: number;
        resizeData: { [quality: string]: IResize };
    }

    export interface IResize {
        scale: number;
        quality?: number;
    }

    /**
     * キャッシュデータを読み込み
     * 
     * @export
     * @returns {Promise<ICache>}
     */
    export function read(): Promise<ICache> {
        return new Promise<ICache>((resolve: (data: ICache) => void, reject: (err: any) => void) => {
            Fs.readJSON(DEFAULT_CACHE_PATH, 'utf-8', (err: NodeJS.ErrnoException, json: ICache) => {
                if (err) {
                    json = {};
                }
                resolve(json);
            });
        });
    }

    /**
     * キャッシュデータをファイルに書き込む
     * 
     * @export
     * @param {ICache} data
     * @returns {Promise<void>}
     */
    export function write(data: ICache): Promise<void> {
        return new Promise<void>((resolve: () => void, reject: (err: any) => void) => {
            Fs.writeJSON(DEFAULT_CACHE_PATH, data, (err: NodeJS.ErrnoException) => {
                if (err) {
                    reject(err);
                    console.error('errorだよ');
                }
                resolve();
            });
        });
    }
}