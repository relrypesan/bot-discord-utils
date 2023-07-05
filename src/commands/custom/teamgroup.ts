import { APIEmbed, ActionRowBuilder, ApplicationCommandType, ButtonBuilder, ButtonStyle, Collection, User, VoiceChannel } from "discord.js";
import { Command } from "../../structs/types/Command";
import { Mutex } from "async-mutex";
import { getSystemConfigByGuildId } from "../../services/systemconfig";

interface Timinho {
    mutex: Mutex;
    participantes: Map<string,User>;
    time1: User[];
    time2: User[];
}

const cacheTiminho = new Map<string, Timinho>();

interface Mapa {
    nome: string;
    peso: number;
}

const mapas: Mapa[] = [
    // mapas de major
    { nome: "Inferno", peso: 233 },
    { nome: "Mirage", peso: 202 },
    { nome: "Overpass", peso: 190 },
    { nome: "Ancient", peso: 180 },
    { nome: "Nuke", peso: 160 },
    { nome: "Vertigo", peso: 152 },
    { nome: "Anubis", peso: 116 },

    // outros mapas
    { nome: "Dust II", peso: 50 },
    { nome: "Train", peso: 50 },
    { nome: "Cache", peso: 20 },
    { nome: "Tuscan", peso: 10 },
    { nome: "Agency", peso: 10 },
    { nome: "Office", peso: 10 },
];

function sorteioMapa(): string {
    const totalPeso = mapas.reduce((total, item) => total + item.peso, 0);
    const numeroSorteado = Math.random() * totalPeso;

    let somaPesos = 0;
    for (const item of mapas) {
        somaPesos += item.peso;

        if (numeroSorteado <= somaPesos) {
            return item.nome;
        }
    }

    throw new Error(`Erro inesperado, não deveria ocorrer este erro!!!`);
}

function convertArrayToListString(participantes: Map<string,User>) : APIEmbed {
    const array : User[] = Array.from(participantes.values());
    let stringJuntas = array.map((user, index) => `${index}. ${user}`).join("\n");

    const messageEmbed: APIEmbed = {
        title: "Sorteio de times!",
        description: `Existem ${participantes.size} participante(s) no sorteio de times:\n${stringJuntas}`,
    }

    return messageEmbed;
}

export default new Command({
    name: "timinho",
    description: "sorteia os membros em times",
    type: ApplicationCommandType.ChatInput,
    async run({interaction, options}) {
        if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;

        await interaction.deferReply({ephemeral: true});
        if (!interaction.channel) return;

        let participantes: Map<string, User> = new Map([[interaction.user.id, interaction.user]]);

        const messageEmbed = convertArrayToListString(participantes);

        const row = new ActionRowBuilder<ButtonBuilder>({components:[
            new ButtonBuilder({
                customId: "teamgroup-button-participar", label: "Participar", style: ButtonStyle.Success,
            }),
            new ButtonBuilder({
                customId: "teamgroup-button-sortear", label: "Sortear", style: ButtonStyle.Secondary,
            }),
        ]});

        const message = await interaction.channel.send({
            embeds: [messageEmbed],
            components: [row],
        });
        cacheTiminho.set(message.id, {participantes, mutex: new Mutex(), time1: [], time2: []});

        setTimeout(() => {
            const timinho = cacheTiminho.get(message.id);
            if (!timinho) return;
            cacheTiminho.delete(message.id);

            const embed = convertArrayToListString(participantes);
            embed.title = `${embed.title} - CANCELADO!!!`;
            embed.description = `TEMPO LIMITE ATINGIDO!\n${embed.description}`;

            message.edit({embeds: [embed], components:[]})
                .catch(error => {
                    console.error(`Houve um erro ao editar o sorteio após o tempo limite!\n${error}`.red);
                });
        }, 1000 * 60 * 90); // tempo para limpar o cache aumentado para 1h e 30min

        interaction.editReply({content: "Sorteio de time criado! O sorteio expira em 1 hora, caso não for sorteado."});

    },
    buttons: new Collection([
        ["teamgroup-button-participar", async (interaction) => {
            const timinho = cacheTiminho.get(interaction.message.id);
            if (!timinho) {
                interaction.reply({ephemeral: true, content: "Este sorteio não foi encontrado ou já aconteceu!"});
                return;
            }

            // bloqueia evento até liberar a execução em andamento
            const release = await timinho.mutex.acquire();
            try {
                let userJaParticipando = timinho.participantes.get(interaction.user.id);

                if (userJaParticipando) {
                    interaction.reply({ephemeral: true, content: "Você já está participando deste sorteio!"});
                    return
                }
    
                timinho.participantes.set(interaction.user.id, interaction.user);
    
                const messageEmbed = convertArrayToListString(timinho.participantes);
    
                await interaction.reply({ephemeral: true, content: "Agora você está participando deste sorteio!"});
    
                interaction.message.edit({embeds: [messageEmbed]});
            } finally {
                release();
            }
        }],
        ["teamgroup-button-sortear", async (interaction) => {
            const timinho = cacheTiminho.get(interaction.message.id);
            if (!timinho) {
                interaction.reply({ephemeral: true, content: "Este sorteio não foi encontrado ou já aconteceu!"});
                return;
            }
            // cacheTiminho.delete(interaction.message.id);

            const messageEmbed = convertArrayToListString(timinho.participantes);
            const participantes = new Map(timinho.participantes);

            while(participantes.size != 0) {
                let participantesArray = Array.from(participantes.values());
                let numeroSorteado = Math.floor(Math.random() * participantesArray.length);
                let user = participantesArray[numeroSorteado];

                participantes.delete(user.id);

                timinho.time1.push(user);

                participantesArray = Array.from(participantes.values());
                if (participantesArray.length != 0) {
                    numeroSorteado = Math.floor(Math.random() * participantesArray.length);
                    user = participantesArray[numeroSorteado];
    
                    participantes.delete(user.id);
    
                    timinho.time2.push(user);
                }
            }
            
            const stringJuntasTime1 = timinho.time1.map((user, index) => `${index}. ${user}`).join("\n");
            const stringJuntasTime2 = timinho.time2.map((user, index) => `${index}. ${user}`).join("\n");
            const nomeMapa = sorteioMapa();

            messageEmbed.fields = [
                {
                    name: "------------------",
                    value: "",
                    inline: false
                },
                {
                    name: "Time 1 - CT",
                    value: stringJuntasTime1,
                    inline: true
                },
                {
                    name: "Time 2 - TR",
                    value: stringJuntasTime2,
                    inline: false
                },
                {
                    name: "MAPA",
                    value: nomeMapa,
                    inline: true
                },
            ];

            await interaction.reply({ephemeral: true, content: "Times sorteados!"});
            
            interaction.message.edit({embeds: [messageEmbed], components: []});

            const config = await getSystemConfigByGuildId(interaction.guildId || "");
            if (!config.teamgroup) return;
            
            const row = new ActionRowBuilder<ButtonBuilder>({components:[
                new ButtonBuilder({
                    customId: "teamgroup-button-start-game", label: "Iniciar", style: ButtonStyle.Success,
                }),
            ]});
            
            interaction.message.edit({components: [row]});
        }],
        ["teamgroup-button-start-game", async (interaction) => {
            const timinho = cacheTiminho.get(interaction.message.id);
            if (!timinho) {
                interaction.reply({ephemeral: true, content: "Este sorteio não foi encontrado ou já aconteceu!"});
                return;
            }

            const config = await getSystemConfigByGuildId(interaction.guildId || "");
            const guild = interaction.guild;
            if (!config || !config.teamgroup || !guild) return;

            const channelTime1 = guild.channels.cache.find((value) => value.id === config.teamgroup?.channel_id_team1) as VoiceChannel | undefined;
            const channelTime2 = guild.channels.cache.find((value) => value.id === config.teamgroup?.channel_id_team2) as VoiceChannel | undefined;

            if (!channelTime1 || !channelTime2) {
                await interaction.reply({ephemeral: true, content: "Um ou mais canais de time não foi encontrado! Reconfigure os canais."});
                return;
            }

            timinho.time1.forEach(async (user) => {
                const member = guild.members.cache.find((gm) => gm.id === user.id);
                if (!member) return;
                member.voice.setChannel(channelTime1);
            });
            timinho.time2.forEach(async (user) => {
                const member = guild.members.cache.find((gm) => gm.id === user.id);
                if (!member) return;
                member.voice.setChannel(channelTime2);
            });

            if (!interaction.replied) {
                await interaction.reply({ephemeral: true, content: "Usuarios direcionados para os canais respectivos!"});
            }

            await interaction.message.edit({components: []});
            
            setTimeout(() => {
                const row = new ActionRowBuilder<ButtonBuilder>({components:[
                    new ButtonBuilder({
                        customId: "teamgroup-button-finish-game", label: "Finalizar", style: ButtonStyle.Danger,
                    }),
                ]});
    
                interaction.message.edit({components: [row]});
            }, 2000); // tempo para evitar miss click
        }],
        ["teamgroup-button-finish-game", async (interaction) => {
            const timinho = cacheTiminho.get(interaction.message.id);
            if (!timinho) {
                interaction.reply({ephemeral: true, content: "Este sorteio não foi encontrado ou já aconteceu!"});
                return;
            }

            const config = await getSystemConfigByGuildId(interaction.guildId || "");
            const guild = interaction.guild;
            if (!config || !config.teamgroup || !guild) return;

            const channelWaiting = guild.channels.cache.find((value) => value.id === config.teamgroup?.channel_id_waiting) as VoiceChannel | undefined;

            if (!channelWaiting) {
                await interaction.reply({ephemeral: true, content: "Canal de espera não foi encontrado! Reconfigure os canais."});
                return;
            }

            timinho.participantes.forEach(async (user) => {
                const member = guild.members.cache.find((gm) => gm.id === user.id);
                if (!member) return;
                member.voice.setChannel(channelWaiting);
            });

            if (!interaction.replied) {
                await interaction.reply({ephemeral: true, content: "Usuarios direcionados para o canal de espera!"});
            }

            cacheTiminho.delete(interaction.message.id);

            interaction.message.edit({components: []});
        }]
    ])
})