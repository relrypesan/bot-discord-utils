import { Document, ObjectId } from 'mongodb';

export interface Reaction {
    emoji: string;
    role_id: string;
}

export interface RequestRole extends Document {
    _id?: ObjectId;
    guild_id: string;
    channel_id: string;
    message_id: string;
    reactions: Reaction[]
}