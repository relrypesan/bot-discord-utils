declare namespace NodeJS {
    interface ProcessEnv {
        BOT_TOKEN: string;
        MONGODB_HOST: string;
        MONGODB_USERNAME: string;
        MONGODB_PASSWORD: string;
        MONGODB_DATABASE: string;
    }
}