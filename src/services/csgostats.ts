import { ObjectId } from "mongodb";
import { getDb } from "./database";
import { CSGOStats } from "../models/csgostats";

const collectionName = "csgo_stats";

export async function createCsgoStats(csgoStats: CSGOStats): Promise<CSGOStats> {
    const db = getDb();
    const collection = db.collection(collectionName);

    const result = await collection.insertOne(csgoStats);
    csgoStats._id = result.insertedId;

    return csgoStats;
}

export async function getListCsgoStats(): Promise<CSGOStats[]> {
    const db = getDb();
    const collection = db.collection(collectionName);

    try {
        let result = await collection.find().toArray();

        return result as CSGOStats[];
    } catch (error) {
        console.error('Erro ao obter CsgoStats por guild ID\n'.red, error);
        throw new Error("Erro ao obter CsgoStats por ID");
    }
}

export async function getCsgoStatsByGuildId(guild_id: string): Promise<CSGOStats | null> {
    const db = getDb();
    const collection = db.collection(collectionName);

    try {
        let result = await collection.findOne({ guild_id: { $eq: guild_id } });

        // if (!result) {
        //     const temp = await createCsgoStats({ guild_id }) as CSGOStats;
        //     return temp;
        // }

        return result as CSGOStats | null;
    } catch (error) {
        console.error('Erro ao obter CsgoStats por guild ID\n'.red, error);
        throw new Error("Erro ao obter CsgoStats por ID");
    }
}

export async function updateCsgoStatsById(id: ObjectId, csgoStats: CSGOStats): Promise<CSGOStats> {
    const db = getDb();
    const collection = db.collection(collectionName);

    try {
        const filter = { _id: new ObjectId(id) };
        const update = { $set: csgoStats };

        await collection.findOneAndUpdate(filter, update);

        return csgoStats as CSGOStats;
    } catch (error) {
        console.error('Erro ao atualizar CsgoStats por ID\n'.red, error);
        throw new Error("Erro ao atualizar CsgoStats por ID");
    }
}
