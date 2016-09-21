import * as Fs from 'fs';

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
