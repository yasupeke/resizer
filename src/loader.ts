import * as Fs from 'fs-extra';
import { CACHE_PATH, CONFIG_PATH } from './constants/generator';

export module Config {
    export interface IQualitySettings {
        [quality: string]: ISettings;
    }

    export interface ISettings {
        defaultScale: number;
        defaultQuality?: number;
        scaleSettings?: IScaleSettings[];
    }

    export interface IScaleSettings {
        path: string;
        scale: number;
        quality?: number;
    }

    /**
     * 設定データを読み込み
     * 
     * @export
     * @returns {Promise<IQualitySettings>}
     */
    export function read(): Promise<IQualitySettings> {
        return new Promise<IQualitySettings>((resolve: (data: IQualitySettings) => void, reject: (err: any) => void) => {
            Fs.readJSON(CONFIG_PATH, 'utf-8', (err: NodeJS.ErrnoException, json: IQualitySettings) => {
                if (err) {
                    json = {};
                }
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
            Fs.readJSON(CACHE_PATH, 'utf-8', (err: NodeJS.ErrnoException, json: ICache) => {
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
            Fs.writeJSON(CACHE_PATH, data, (err: NodeJS.ErrnoException) => {
                if (err) {
                    reject(err);
                    console.error('errorだよ');
                }
                resolve();
            });
        });
    }
}