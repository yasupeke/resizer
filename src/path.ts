import * as Path from 'path';
import * as Fs from 'fs-extra';
import { isImage } from './extention';
import { getStat } from './file';

/**
 * 入力ファイルパス取得
 *
 * @export
 * @param {string} inputDir
 * @returns {Promise<string[]>}
 */
export function getInputPaths(inputDir: string): Promise<string[]> {
    let filePaths: string[] = [];
    return new Promise<string[]>((resolve: (inputFilePaths: string[]) => void, reject: (err: any) => void) => {
        const searchFile = (path: string) => {
            const itemPaths = Fs.readdirSync(path);
            for (let i = 0, len = itemPaths.length; i < len; i++) {
                const itemPath = itemPaths[i];
                const fullPath = Path.join(path, itemPath);
                const stat = getStat(fullPath);
                if (stat.isDirectory()) {
                    searchFile(fullPath);
                } else {
                    if (!isImage(fullPath)) {
                        continue;
                    }
                    filePaths.push(fullPath);
                }
            }
        }
        searchFile(Path.join(__dirname, inputDir));
        resolve(filePaths);
    });
};
