import { RequestHandler } from 'express';
import * as multer from 'multer';

export const DEFAULT_FILE_FIELD_NAME = 'files';

interface UploadMiddlewareOpts {
    fieldName: string;
    fieldSizeLimit?: number;
}

const defaulOpts: UploadMiddlewareOpts = {
    fieldName: DEFAULT_FILE_FIELD_NAME
};

export const UploadMiddleware = (opts = defaulOpts): RequestHandler => {
    return multer({ limits: { fieldNameSize: opts.fieldSizeLimit } }).array(opts.fieldName);
};

export default UploadMiddleware;
