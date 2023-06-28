import { RequestRole } from "../models/requestrole";
import { getDb } from "./database";

const collectionName = "request_roles";

export async function getRequestRoleByMessageId(message_id: string): Promise<RequestRole | null> {
    const db = getDb();
    const collection = db.collection(collectionName);

    try {
        const result = await collection.findOne({ message_id: { $eq: message_id } });
    
        return result as RequestRole | null;
    } catch (error) {
        console.error('Erro ao obter RequestRole por ID:', error);
        return null;
    }
}

export async function createRequestRole(requestrole: RequestRole): Promise<RequestRole> {
    const db = getDb();
    const collection = db.collection(collectionName);

    const result = await collection.insertOne(requestrole);
    requestrole._id = result.insertedId;

    return requestrole;
}
