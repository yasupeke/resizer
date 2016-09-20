import * as Path from 'path';
import * as Fs from 'fs-extra';
import { OUTPUT_DIR_PATH, REG_INPUT_DIR_PATH } from './constants/generator';

/**
 * 出力ディレクトリ作成 
 *
 * @export
 * @param {string} quality
 * @param {string[]} inputPaths
 * @returns {Promise<void>}
 */
export function generateDir(quality: string, inputPaths: string[]): Promise<void> {
    let outputDirs: string[] = [];
    return new Promise<void>((resolve: () => void, reject: () => void) => {
        for (let i = 0, len = inputPaths.length; i < len; i++) {
            const inputPath = inputPaths[i];
            const outputPath = `${OUTPUT_DIR_PATH}/${quality}/${inputPath.replace(REG_INPUT_DIR_PATH, '')}`;
            const outputDir = Path.dirname(outputPath);
            if (outputDirs.indexOf(outputDir) < 0) {
                Fs.mkdirpSync(outputDir);
                outputDirs.push(outputDir);
            }
        }
        resolve();
    });
}
