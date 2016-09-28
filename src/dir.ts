import * as Path from 'path';
import * as Fs from 'fs-extra';
import { Config } from './loader';
import { isIgnore } from './util';

/**
 * 出力ディレクトリ作成 
 * 
 * @export
 * @param {string} inputDirPath
 * @param {string} outputDirPath
 * @param {string} quality
 * @param {string[]} inputPaths
 * @returns {Promise<void>}
 */
export function createDir(
    inputDirPath: string,
    outputDirPath: string,
    quality: string,
    inputPaths: string[],
    settings: Config.IQualitySetting
): Promise<void> {
    const regInputDirPath = new RegExp(`^${Path.join(__dirname, inputDirPath).replace(/\\/g, '\\\\')}\\\\`)
    let outputDirs: string[] = [];
    return new Promise<void>((resolve: () => void, reject: () => void) => {
        for (let i = 0, len = inputPaths.length; i < len; i++) {
            const inputPath = inputPaths[i];
            const outputPath = Path.join(__dirname, `${outputDirPath}/${quality}/${inputPath.replace(regInputDirPath, '')}`);
            const outputDir = Path.dirname(outputPath);
            if (outputDirs.indexOf(outputDir) < 0 && !isIgnore(inputPath, settings)) {
                Fs.mkdirpSync(outputDir);
                outputDirs.push(outputDir);
            }
        }
        resolve();
    });
}
