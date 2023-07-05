import { Document, ObjectId } from 'mongodb';

export interface TeamGroup {
    channel_id_waiting: string;
    channel_id_team1: string;
    channel_id_team2: string;
}

export interface SystemConfig extends Document {
    _id?: ObjectId;
    guild_id: string;
    teamgroup?: TeamGroup;
}