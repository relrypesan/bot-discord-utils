import { APIEmbed, ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, BaseMessageOptions, ButtonBuilder, ButtonStyle, Collection, User } from "discord.js";
import { Command } from "../../structs/types/Command";

interface Timinho {
    participantes: Map<string,User>
}

const cacheTiminho = new Map<string, Timinho>();

function convertArrayToListString(timinho: Timinho) : APIEmbed {
    const array : User[] = Array.from(timinho.participantes.values());
    let stringJuntas = array.map((user, index) => `${index}. ${user}`).join("\n");

    const messageEmbed: APIEmbed = {
        title: "Sorteio de times!",
        description: `Existem ${timinho.participantes.size} participante(s) no sorteio de times:\n${stringJuntas}`,
    }

    return messageEmbed;
}

export default new Command({
    name: "timinho",
    description: "sorteia os membros em times",
    type: ApplicationCommandType.ChatInput,
    // options: [
    //     {
    //         name: "quantidade",
    //         description: "A quantidade de times para sorteio. default: 2",
    //         type: ApplicationCommandOptionType.Integer,
    //     }
    // ],
    async run({interaction, options}) {
        if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;

        await interaction.deferReply({ephemeral: true});
        if (!interaction.channel) return;

        let participantes: Map<string, User> = new Map([[interaction.user.id, interaction.user]]);

        const messageEmbed = convertArrayToListString({participantes});

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
        cacheTiminho.set(message.id, {participantes});

        setTimeout(() => {
            const timinho = cacheTiminho.get(message.id);
            if (!timinho) {
                console.log("Este sorteio não existe mais no cache!");
                return;
            }
            cacheTiminho.delete(message.id);

            const embed = convertArrayToListString(timinho);
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

            let userJaParticipando = timinho.participantes.get(interaction.user.id);

            if (userJaParticipando) {
                interaction.reply({ephemeral: true, content: "Você já está participando deste sorteio!"});
                return
            }

            timinho.participantes.set(interaction.user.id, interaction.user);

            const messageEmbed = convertArrayToListString(timinho);

            await interaction.reply({ephemeral: true, content: "Agora você está participando deste sorteio!"});

            interaction.message.edit({embeds: [messageEmbed]});
        }],
        ["sortear-button", async (interaction) => {
            const timinho = cacheTiminho.get(interaction.message.id);
            if (!timinho) {
                interaction.reply({ephemeral: true, content: "Este sorteio não foi encontrado ou já aconteceu!"});
                return;
            }
            cacheTiminho.delete(interaction.message.id);

            const messageEmbed = convertArrayToListString(timinho);

            let time1: User[] = [];
            let time2: User[] = [];

            while(timinho.participantes.size != 0) {
                let participantesArray = Array.from(timinho.participantes.values());
                let keysArray = Array.from(timinho.participantes.keys());
                let numeroSorteado = Math.floor(Math.random() * keysArray.length);
                let user = participantesArray[numeroSorteado];

                timinho.participantes.delete(user.id);

                time1.push(user);

                if (participantesArray.length != 0) {
                    participantesArray = Array.from(timinho.participantes.values());
                    keysArray = Array.from(timinho.participantes.keys());
                    numeroSorteado = Math.floor(Math.random() * keysArray.length);
                    user = participantesArray[numeroSorteado];
    
                    timinho.participantes.delete(user.id);
    
                    time2.push(user);
                }
            }
            
            let stringJuntasTime1 = time1.map((user, index) => `${index}. ${user}`).join("\n");
            let stringJuntasTime2 = time2.map((user, index) => `${index}. ${user}`).join("\n");

            messageEmbed.fields = [
                {
                    name: "------------------",
                    value: "",
                    inline: false
                },
                {
                    name: "Time 1",
                    value: stringJuntasTime1,
                    inline: true
                },
                {
                    name: "Time 2",
                    value: stringJuntasTime2,
                    inline: false
                },
            ];

            await interaction.reply({ephemeral: true, content: "Times sorteados!"});
            
            interaction.message.edit({embeds: [messageEmbed], components: []});
        }]
    ])
})