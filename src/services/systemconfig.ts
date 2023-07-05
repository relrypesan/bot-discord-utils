import { ObjectId } from "mongodb";
import { getDb } from "./database";
import { SystemConfig } from "../models/systemconfig";

const collectionName = "system_config";

async function createSystemConfig(systemConfig: SystemConfig): Promise<SystemConfig> {
    const db = getDb();
    const collection = db.collection(collectionName);

    const result = await collection.insertOne(systemConfig);
    systemConfig._id = result.insertedId;

    return systemConfig;
}

export async function getSystemConfigByGuildId(guild_id: string): Promise<SystemConfig> {
    const db = getDb();
    const collection = db.collection(collectionName);

    try {
        let result = await collection.findOne({ guild_id: { $eq: guild_id } });

        if (!result) {
            const temp = await createSystemConfig({guild_id}) as SystemConfig;
            return temp;
        }
    
        return result as SystemConfig;
    } catch (error) {
        console.error('Erro ao obter SystemConfig por guild ID\n'.red, error);
        throw new Error("Erro ao obter SystemConfig por ID");
    }
}

export async function updateSystemConfigById(id: ObjectId, systemConfig: SystemConfig): Promise<SystemConfig> {
    const db = getDb();
    const collection = db.collection(collectionName);

    try {
        const filter = { _id: new ObjectId(id) };
        const update = { $set: systemConfig };

        await collection.findOneAndUpdate(filter, update);
    
        return systemConfig as SystemConfig;
    } catch (error) {
        console.error('Erro ao atualizar SystemConfig por ID\n'.red, error);
        throw new Error("Erro ao atualizar SystemConfig por ID");
    }
}
