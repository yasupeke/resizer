/**
 * 入力パス
 */
export const INPUT_DIR_PATH = 'input';

/**
 * 出力パス
 */
export const OUTPUT_DIR_PATH = 'output';

/**
 * 並列処理最大数
 */
export const PARALLEL_MAX_COUNT = 10;

/**
 * 入力パス正規表現
 */
export const REG_INPUT_DIR_PATH = new RegExp(`^${INPUT_DIR_PATH}\\\\`);

/**
 * キャッシュファイル名
 */
export const CACHE_FILE_NAME = '.cache';

/**
 * キャッシュファイルパス
 */
export const CACHE_PATH = `${CACHE_FILE_NAME}`;

/**
 * 設定ファイル名
 */
export const CONFIG_FILE_NAME = `config.json`;

/**
 * 設定ファイルパス
 */
export const CONFIG_PATH = `${CONFIG_FILE_NAME}`;