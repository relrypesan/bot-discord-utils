import { APIEmbed } from 'discord.js';
import { Document, ObjectId } from 'mongodb';

export interface ApproveRole extends Document {
    _id?: ObjectId;
    guild_id: string;
    channel_id: string;
    message_id: string;
    embed: APIEmbed;
    role_id: string;
    user_id: string;
}