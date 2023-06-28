import { APIEmbed, ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, BaseMessageOptions, ButtonBuilder, ButtonStyle, Collection, User } from "discord.js";
import { Command } from "../../structs/types/Command";
import { Mutex } from "async-mutex";

interface Timinho {
    mutex: Mutex;
    participantes: Map<string,User>;
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
                customId: "participar-button", label: "Participar", style: ButtonStyle.Success,
            }),
            new ButtonBuilder({
                customId: "sortear-button", label: "Sortear", style: ButtonStyle.Secondary,
            }),
        ]});

        const message = await interaction.channel.send({
            embeds: [messageEmbed],
            components: [row],
        });
        cacheTiminho.set(message.id, {participantes, mutex: new Mutex()});

        setTimeout(() => {
            const timinho = cacheTiminho.get(message.id);
            if (!timinho) {
                console.log("Este sorteio não existe mais no cache!");
                return;
            }
            cacheTiminho.delete(message.id);

            const embed = convertArrayToListString(participantes);
            embed.title = `${embed.title} - CANCELADO!!!`;
            embed.description = `TEMPO LIMITE ATINGIDO!\n${embed.description}`;

            message.edit({embeds: [embed], components:[]})
            .catch(error => {
                console.log(`Houve um erro ao editar o sorteio após o tempo limite!\n${error}`.red);
            });
        }, 1000 * 60 * 5);

        interaction.editReply({content: "Sorteio de time criado! O sorteio expira em 5 minutos se não for sorteado."});

    },
    buttons: new Collection([
        ["participar-button", async (interaction) => {
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
        ["sortear-button", async (interaction) => {
            const timinho = cacheTiminho.get(interaction.message.id);
            if (!timinho) {
                interaction.reply({ephemeral: true, content: "Este sorteio não foi encontrado ou já aconteceu!"});
                return;
            }
            cacheTiminho.delete(interaction.message.id);

            const messageEmbed = convertArrayToListString(timinho.participantes);

            let time1: User[] = [];
            let time2: User[] = [];

            while(timinho.participantes.size != 0) {
                let participantesArray = Array.from(timinho.participantes.values());
                let keysArray = Array.from(timinho.participantes.keys());
                let numeroSorteado = Math.floor(Math.random() * keysArray.length);
                let user = participantesArray[numeroSorteado];

                timinho.participantes.delete(user.id);

                time1.push(user);

                participantesArray = Array.from(timinho.participantes.values());
                keysArray = Array.from(timinho.participantes.keys());
                if (participantesArray.length != 0) {
                    numeroSorteado = Math.floor(Math.random() * keysArray.length);
                    user = participantesArray[numeroSorteado];
    
                    timinho.participantes.delete(user.id);
    
                    time2.push(user);
                }
            }
            
            const stringJuntasTime1 = time1.map((user, index) => `${index}. ${user}`).join("\n");
            const stringJuntasTime2 = time2.map((user, index) => `${index}. ${user}`).join("\n");
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
        }]
    ])
})