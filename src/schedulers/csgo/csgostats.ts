import { Scheduler } from "../../structs/types/Scheduler";
import parse from 'html-dom-parser';
import {
    Comment,
    Element,
    ProcessingInstruction,
    Text
  } from 'domhandler';
import { EnumRank, RankingDetails } from "../../models/csgostats";
import { createCsgoStats, getListCsgoStats } from "../../services/csgostats";

var MILLIS_DIA_1 = (24 * 60 * 60 * 1000);
var SECONDS_DIA_1 = (24 * 60 * 60);

function getRanking(doc: Array<Comment | Element | ProcessingInstruction | Text>): string {
    // url da imagem
    // @ts-ignore
    var url_image_rank: string = doc[2].children[3].children[3].children[1].children[7].children[1].children[1].children[3].children[1].children[3].children[1].children[1].attribs.src
    var url_splited = url_image_rank.split('/');
    var name_png_rank = url_splited[url_splited.length - 1]
    var number_rank = parseInt(name_png_rank.split('.')[0]);
    return EnumRank[number_rank]
}

function getPlayerKD(doc: Array<Comment | Element | ProcessingInstruction | Text>): string | undefined {
    try {
        // recupera o K/D
        // @ts-ignore
        var player_kd = doc[2].children[3].children[3].children[1].children[7].children[5].children[5].children[3].children[3].children[1].children[1].children[3].children[1].children[1].children[3].children[3].children[1].children[1].children[0].data
        return player_kd;
    } catch ( error ) {
        return undefined;
    }
}

function getPageCsgoStatsInfoPlayer(steam_id: string, time_start: number, time_end: number): Promise<{rank: string, player_kd: string | undefined}> {
    // fetch("https://csgostats.gg/pt-BR/player/76561199106946325?type=comp&date_start=1692846000&date_end=1693450799")
    return fetch(`https://csgostats.gg/pt-BR/player/${steam_id}?type=comp&date_start=${time_start}&date_end=${time_end}`)
        .then(async(response) => {
            return response.text();
        })
        .then(html => {
            var doc = parse(html);

            var rank = getRanking(doc);
            var player_kd = getPlayerKD(doc);

            // callback(rank, player_kd);

            console.log("response convertido");
            return {rank, player_kd}
        })
        .catch(error => {
            console.error("houve um erro ao capturar informação da requisição", error);
            throw error
        });
}

export default new Scheduler({
    name: "csgostats",
    wait_run: 5,
    wait_start: 5,
    async run({ client }) {
        console.log("executando scheduler");
        
        var data_atual = new Date(new Date().getTime() + MILLIS_DIA_1);
        var data_7_dias_atras = new Date(new Date().getTime() - (6 * MILLIS_DIA_1))

        // converte de millis para segundos
        var seconds_atual = Math.floor(data_atual.getTime() / 1000);
        var seconds_7_dias_atras = Math.floor(data_7_dias_atras.getTime() / 1000);

        // remove horas,minutos, segundos quebrados e adiciona 3 hora para UTC
        seconds_atual = (seconds_atual - (seconds_atual % SECONDS_DIA_1) + (3 * 60 * 60) - 1);
        seconds_7_dias_atras = (seconds_7_dias_atras - (seconds_7_dias_atras % SECONDS_DIA_1) + (3 * 60 * 60));

        getListCsgoStats()
            .then(listCsgoStats => {
                console.log(`Lista consultada, tamanho: ${listCsgoStats.length}`);
                listCsgoStats.forEach(csgostats => {
                    const guild = client.guilds.cache.get(csgostats.guild_id);
                    if (!guild) return;
                    csgostats.users.forEach(user => {
                        const member = guild.members.cache.get(user.user_id);
                        if (!member) return;
                        getPageCsgoStatsInfoPlayer(user.steam_id, seconds_7_dias_atras, seconds_atual)
                            .then(({rank, player_kd}) => {
                                rank = rank.toLowerCase();
                                var rankRaw = Object.entries(csgostats.rankings).find(v => v[0] === rank);
                                if (!rankRaw || !rankRaw[1]) return;

                                var rankDetails: RankingDetails = rankRaw[1];

                                var listPromises: Promise<any>[] = []
                                Object.entries(csgostats.rankings)
                                    .filter(([key, value]: [string, RankingDetails]) => value.role_id !== rankDetails.role_id)
                                    .forEach(async ([key, value]: [string, RankingDetails]) => {
                                        listPromises.push(member.roles.remove(value.role_id))
                                    })

                                Promise.all(listPromises)
                                    .then(() => {
                                        const role = member.roles.cache.get(rankDetails.role_id)
                                        if (role) return
                                        member.roles.add(rankDetails.role_id)
                                            .then(v => {
                                                console.log("Sucesso ao cadastrar role");
                                            })
                                            .catch(error => {
                                                console.error("Erro ao adicionar role", error);
                                            });
                                            if (guild.ownerId == member.id) {
                                                console.log("Não é possivel alterar o nick do dono do servidor");
                                                return;
                                            }
                                            member.setNickname(`[${player_kd}] - ${member.user.username}`);
                                    })
                            })
                            .catch(error => {
                                console.error("Houve um erro ao processar info do player", error);
                            });
                    })
                })
            })
            .then(error =>{
                console.error("Houve um erro ao consultar lista de CSGO Stats", error);
            });
    },
})