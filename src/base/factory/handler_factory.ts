/// <reference path="../typings/express.d.ts" />

import { NextFunction, Request, RequestHandler, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Context, RequestData, HandlerMethod, ResponseData, FileData } from '../typings/common';
import { MANDATORY_REQUEST_HEADER } from '../utils/constant';

const parseInput = (req: Request): RequestData => ({
    query: req.query,
    params: req.params,
    body: req.body,
    headers: req.headers,
    files: req.files ?? []
});

const getContext = (req: Request): Context => {
    req.context = { ...req.context };
    return req.context;
};

const getContentResponseHeader = (file: FileData): Record<string, string> => {
    const { options } = file;
    return options ? {
        'Content-Type': options.mimeType,
        'Content-Disposition': `attachment;filename="${options.fileName}"`,
        'Content-Length': options.size.toString(),
    } : {};
};

export const HandlerFactory = (method: HandlerMethod<ResponseData>): RequestHandler => async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        const data = parseInput(req);
        const context: Context = getContext(req);

        /** make data immutable */
        Object.freeze(data);

        const outData = await method(data, context);
        res.set(MANDATORY_REQUEST_HEADER.REQUEST_ID, context.request_id);

        if (outData?.headers) {
            res.set(outData.headers);
        }

        if (outData?.redirect) {
            return res.redirect(outData.redirect);
        }

        if (outData?.file) {
            const { buffer } = outData.file;
            const fileHeaders = getContentResponseHeader(outData.file);
            return res.set(fileHeaders).end(buffer, 'binary');
        }

        if (outData?.html) {
            return res.set({ 'Content-Type': 'text/html' }).send(outData.html);
        }

        return res.json(outData).status(outData?.code ?? StatusCodes.OK);

    } catch (err) {
        return next(err);
    }
};

export default HandlerFactory;
