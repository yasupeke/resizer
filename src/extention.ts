import * as Path from 'path';

const IMAGE_EXT = ['.jpeg', '.jpg', '.gif', '.png'];

/**
 * 画像ファイルか判定
 * 
 * @export
 * @param {string} path
 * @returns {boolean}
 */
export function isImage(path: string): boolean { 
    const ext = Path.extname(path).toLowerCase();
    return IMAGE_EXT.indexOf(ext) >= 0;
}