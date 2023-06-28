import { ObjectId } from "mongodb";
import { getDb } from "./database";
import { ApproveRole } from "../models/approverole";

const collectionName = "approve_roles";

export async function createApproveRole(requestrole: ApproveRole): Promise<ApproveRole> {
    const db = getDb();
    const collection = db.collection(collectionName);

    const result = await collection.insertOne(requestrole);
    requestrole._id = result.insertedId;

    return requestrole;
}

export async function getApproveRoleByMessageId(message_id: string): Promise<ApproveRole | null> {
    const db = getDb();
    const collection = db.collection(collectionName);

    try {
        const result = await collection.findOne({ message_id: { $eq: message_id } });
    
        return result as ApproveRole | null;
    } catch (error) {
        console.error('Erro ao obter RequestRole por ID\n'.red, error);
        return null;
    }
}

export async function getApproveRoleByUserIdAndRoleId(user_id: string, role_id: string): Promise<ApproveRole | null> {
    const db = getDb();
    const collection = db.collection(collectionName);

    try {
        const result = await collection.findOne({ user_id: { $eq: user_id }, role_id: { $eq: role_id } });
    
        return result as ApproveRole | null;
    } catch (error) {
        console.error('Erro ao obter RequestRole por user e role id\n'.red, error);
        return null;
    }
}

export async function deleteApproveRoleById(id: ObjectId): Promise<boolean> {
    const db = getDb();
    const collection = db.collection(collectionName);

    try {
        const filter = { _id: new ObjectId(id) };

        await collection.deleteOne(filter);
    
        return true;
    } catch (error) {
        console.error('Erro ao atualizar RequestRole por ID\n'.red, error);
        throw new Error("Erro ao atualizar RequestRole por ID");
    }
}
