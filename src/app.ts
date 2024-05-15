import { App as BaseApp, SQLContext, RedisContext, EventBus } from './base';

class App extends BaseApp {
    public async initProviders(): Promise<void> {
        await SQLContext.initialize({ models_path: './database/models' });
        await EventBus.initialize({ group_id: process.env.SERVICE_NAME });
        RedisContext.initialize();
    }

    // public async initControllers(): Promise<void> {}
}

export default App;
