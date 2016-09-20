import * as Path from 'path';
import * as Fs from 'fs-extra';
import { Cache } from './loader';
import { isImage } from './extention';

/**
 * 更新する入力パス取得
 *
 * @export
 * @param {string} inputDir
 * @returns {Promise<string[]>}
 */
export function getUpdateInputPaths(inputDir: string): Promise<string[]> {
    let filePaths: string[] = [];
    return Cache
        .read()
        .then((cache: { [filePath: string]: number }) => {
            return new Promise<string[]>((resolve: (inputFilePaths: string[]) => void, reject: (err: any) => void) => {
                const searchFile = (path: string) => {
                    const itemPaths = Fs.readdirSync(path);
                    for (let i = 0, len = itemPaths.length; i < len; i++) {
                        const itemPath = itemPaths[i];
                        const fullPath = Path.join(path, itemPath);
                        const stat = Fs.statSync(fullPath);
                        if (stat.isDirectory()) {
                            searchFile(fullPath);
                        } else {
                            if (!isImage(fullPath)) {
                                continue;
                            }
                            const cacheUpdtTime = cache[fullPath];
                            const updtTime = stat.mtime.getTime();
                            if (updtTime !== cacheUpdtTime) {
                                filePaths.push(fullPath);
                            }
                            cache[fullPath] = updtTime;
                        }
                    }
                }
                searchFile(inputDir);
                Cache.write(cache);
                resolve(filePaths);
            });
        });
};
