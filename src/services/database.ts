import { MongoClient, Db } from "mongodb";

let db: Db;

export async function connect() {
    const { MONGODB_HOST, MONGODB_USERNAME, MONGODB_PASSWORD, MONGODB_DATABASE } = process.env;
    const url = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_HOST}/?retryWrites=true&w=majority`;

    try {
        const client = await MongoClient.connect(url);

        db = client.db(MONGODB_DATABASE);

        console.log('Conexão com o MongoDB estabelecida com sucesso!');
    } catch (error) {
        console.error('Erro ao conectar-se ao MongoDB:', error);
    }
}

export function getDb(): Db {
    if(!db) {
        throw new Error('Conexão com o MongoDB não estabelecida!');
    }
    return db;
}
