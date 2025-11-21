import multer from 'multer';
import { sendError } from '../utils/apiResponse.js';
import { STATUS } from '../constants/httpStatus.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload only images.'), false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB file size limit
});

// Custom error handler for multer
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return sendError(res, STATUS.BAD_REQUEST, 'File is too large (Max 5MB)');
        }
        return sendError(res, STATUS.BAD_REQUEST, err.message);
    } else if (err) {
        return sendError(res, STATUS.BAD_REQUEST, err.message);
    }
    next();
};