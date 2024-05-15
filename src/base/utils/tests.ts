import { StaticBaseApp } from '../app';
import { StaticBaseController } from '../controller';

export const createTestServer = async (appClass: StaticBaseApp, controllerClass?: StaticBaseController): Promise<Express.Application> => {
    const app = new appClass();
    await app.initializeTest(controllerClass);
    return app.getInstance();
};

export const TRANSACTION_MOCK = { commit: () => Promise.resolve({}), rollback: () => Promise.resolve({}) };

export default {
    createTestServer,
    TRANSACTION_MOCK
};
