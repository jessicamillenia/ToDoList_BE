import * as env from 'dotenv';
import App from './src/app';

/** main */
(async (): Promise<void> => {
    /** load envs */
    env.config();

    /** parse envs */
    const port = Number(process.env.APP_PORT);
    const serverMode = process.argv[2];

    /** instantiate and start server  */
    const app = new App({ port, syspar: true, statefulFeatureFlag: true, serverMode });
    await app.initialize();
    app.start();
})();
