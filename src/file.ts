import * as Fs from 'fs-extra';

/**
 * ファイル情報キャッシュ
 */
let cacheStats: { [filePath: string]: Fs.Stats } = {};


/**
 * FileのStat取得
 * 
 * @export
 * @param {string} filePath
 * @returns {Fs.Stats}
 */
export function getStat(filePath: string): Fs.Stats { 
    let stat = cacheStats[filePath];
    if (!stat) { 
        stat = Fs.statSync(filePath);
    }
    return stat;
}


/**
 * コピー 
 * 
 * @export
 * @param {string} inputPath
 * @param {string} outputPath
 * @returns {Promise<void>}
 */
export function copy(inputPath: string, outputPath: string): Promise<void> {
    return new Promise<void>((resolve: () => void, reject: (err: any) => void) => {
        Fs.copy(inputPath, outputPath, (err: any) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}
