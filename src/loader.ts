import * as Fs from 'fs-extra';
import { CACHE_PATH, CONFIG_PATH } from './constants/generator';

export module Config {
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
    /**
     * キャッシュデータを読み込み
     * 
     * @export
     * @returns {Promise<{ [filePath: string]: number }>}
     */
    export function read(): Promise<{ [filePath: string]: number }> {
        return new Promise<{ [filePath: string]: number }>((resolve: (data: { [filePath: string]: number }) => void, reject: (err: any) => void) => {
            Fs.readJSON(CACHE_PATH, 'utf-8', (err: NodeJS.ErrnoException, json: { [filePath: string]: number }) => {
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
     * @param {{ [filePath: string]: number }} data
     * @returns {Promise<void>}
     */
    export function write(data: { [filePath: string]: number }): Promise<void> {
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