import { Document, ObjectId } from 'mongodb';

export enum EnumRank {
    DESCONHECIDO,
    PRATA_1,
    PRATA_2,
    PRATA_3,
    PRATA_4,
    PRATA_ELITE,
    PRATA_ELITE_MESTRE,
    OURO_1,
    OURO_2,
    OURO_3,
    OURO_MESTRE,
    AK_1,
    AK_2,
    AK_CRUZADA,
    XERIFE,
    AGUIA_1,
    AGUIA_2,
    SUPREMO,
    GLOBAL,
}

export interface RankingDetails {
    role_id: string;
}

export interface Ranking {
    prata_1?: RankingDetails;
    prata_2?: RankingDetails;
    prata_3?: RankingDetails;
    prata_4?: RankingDetails;
    prata_elite?: RankingDetails;
    prata_elite_mestre?: RankingDetails;
    ouro_1?: RankingDetails;
    ouro_2?: RankingDetails;
    ouro_3?: RankingDetails;
    ouro_mestre?: RankingDetails;
    ak_1?: RankingDetails;
    ak_2?: RankingDetails;
    ak_cruzada?: RankingDetails;
    xerife?: RankingDetails;
    aguia_1?: RankingDetails;
    aguia_2?: RankingDetails;
    supremo?: RankingDetails;
    global?: RankingDetails;
}

export interface UserSteam {
    user_id: string;
    steam_id: string;
}

export interface CSGOStats extends Document {
    _id?: ObjectId;
    guild_id: string;
    rankings: Ranking;
    users: UserSteam[]
}
