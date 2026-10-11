const fs = require('fs');
const path = require('path');

const STATIC_DIR = path.resolve(__dirname, '..', 'static');
const DEFAULT_IMAGE = 'default.png';

/**
 * Safely deletes a file from server/static if it exists and is not a default asset.
 * @param {string} fileName
 */
const deleteStaticFile = async (fileName) => {
    try {
        if (!fileName || fileName === DEFAULT_IMAGE || fileName === '.gitkeep') {
            return;
        }

        const filePath = path.resolve(STATIC_DIR, fileName);

        // Security check: ensure path is within STATIC_DIR
        if (!filePath.startsWith(STATIC_DIR)) {
            console.warn(`[fileHelper] Security warning: Attempt to delete file outside static dir: ${filePath}`);
            return;
        }

        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    } catch (err) {
        console.error(`[fileHelper] Error deleting file ${fileName}:`, err.message);
    }
};

module.exports = {
    deleteStaticFile,
    DEFAULT_IMAGE,
};
