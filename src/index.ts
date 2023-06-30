import { ExtendedClient } from "./structs/ExtendedClient"
export * from "colors";
import * as fs from 'fs';
import * as path from 'path';
import config from "./config.json";
import { connect } from "./services/database";

const packagePath = path.resolve(__dirname, '../package.json');
const packageContent = fs.readFileSync(packagePath, 'utf8');
const packageData = JSON.parse(packageContent);

console.log("Versão da aplicação: ", packageData.version);

connect();

process.on('uncaughtException', (error) => {
    console.error('Erro não tratado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promessa não tratada:', reason);
});

const client = new ExtendedClient();
client.start();

export { client, config }