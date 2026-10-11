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

/**
 * Safely saves an uploaded file to server/static with a unique UUID name.
 * Validates allowed extensions.
 * @param {object} file - The file object from req.files (express-fileupload)
 * @param {string[]} [allowedExts=['.jpg', '.jpeg', '.png', '.webp']]
 * @returns {Promise<string>} The generated fileName saved in static dir
 */
const saveStaticFile = async (file, allowedExts = ['.jpg', '.jpeg', '.png', '.webp']) => {
    if (!file) {
        return DEFAULT_IMAGE;
    }

    const ext = path.extname(file.name || '').toLowerCase() || '.jpg';
    if (!allowedExts.includes(ext)) {
        throw new Error(`Invalid file type: ${ext}. Allowed: ${allowedExts.join(', ')}`);
    }

    const { v4: uuidv4 } = require('uuid');
    const fileName = `${uuidv4()}${ext}`;
    const targetPath = path.resolve(STATIC_DIR, fileName);

    await file.mv(targetPath);
    return fileName;
};

module.exports = {
    deleteStaticFile,
    saveStaticFile,
    DEFAULT_IMAGE,
};
