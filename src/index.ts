import { ExtendedClient } from "./structs/ExtendedClient"
export * from "colors";
import config from "./config.json";

process.on('uncaughtException', (error) => {
    console.error('Erro não tratado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promessa não tratada:', reason);
});

const client = new ExtendedClient();
client.start();

export { client, config }