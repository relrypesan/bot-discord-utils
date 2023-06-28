import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, CacheType, Channel, Collection, CommandInteraction, Emoji, Interaction, Role, SelectMenuComponentOptionData, StringSelectMenuBuilder } from "discord.js";
import { Command } from "../../structs/types/Command";
import { createRequestRole } from "../../services/requestroles";

interface RequestRole {
    cacheSelectChannel?: Channel,
    cacheSelectRole?: Role,
    selectedChannel?: Channel,
    reactionRoles?: {
        role: Role,
        emoji: Emoji
    }[],
}

const cacheRequestRole = new Map<string, RequestRole>();

export default new Command({
    name: "requestrole",
    description: "cria uma mensagem com botões para solicitar cargo",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "addrole",
            description: "adiciona uma role e um emoji no cache",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "cargo",
                    description: "cargo que será solicitado ao pressionar o emoji",
                    type: ApplicationCommandOptionType.Role,
                    required: true,
                },
                {
                    name: "emoji",
                    description: "emoji da reação para solicitar o cargo",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                }
            ]
        }
    ],
    async run({interaction, options}) {
        if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;
        await interaction.deferReply({ephemeral: true});
        if (!interaction.channel) return;

        if(!interaction.memberPermissions.has('Administrator')) {
            await interaction.editReply({content: "Você precisa ser um administrador para executar este comando!"});
            return;
        }

        const subCommand = options.getSubcommand();

        console.log(`subCommand: ${subCommand}`);

        await interaction.editReply({content: "Executado com sucesso!"});

        // const selectDataRoles: SelectMenuComponentOptionData[] = [];

        // interaction.guild.roles.cache.filter(role => {
        //     // filtro para remover roles de bots e role @everyone
        //     return !role.managed && role.id !== interaction.guild.id
        // }).forEach(role => {
        //     selectDataRoles.push({
        //         label: role.name,
        //         value: role.id
        //     });
        // });

        // console.log(`roles: ${JSON.stringify(selectDataRoles)}`);

        // const rowSelect = new ActionRowBuilder<StringSelectMenuBuilder>({components: [
        //     new StringSelectMenuBuilder({
        //         customId: "requestrole-select-role",
        //         placeholder: "Selecione o cargo que gostaria de adicionar",
        //         options: selectDataRoles
        //     })
        // ]});

        // const rowButtons = new ActionRowBuilder<ButtonBuilder>({components:[
        //     new ButtonBuilder({
        //         customId: "participar-button", label: "Participar", style: ButtonStyle.Success,
        //     }),
        //     new ButtonBuilder({
        //         customId: "sortear-button", label: "Sortear", style: ButtonStyle.Secondary,
        //     }),
        // ]});

        // const message = await interaction.channel.send({
        //     embeds: [{description: "teste"}],
        //     components: [rowSelect, rowButtons],
        // });

        // cacheRequestRole.set(message.id, {});
        // setTimeout(() => {
        //     const requestrole = cacheRequestRole.get(message.id);
        //     if (!requestrole) return;

        //     cacheRequestRole.delete(message.id);

        //     message.edit({components: [], content: "Comando CANCELADO!!! Tempo expirado."});
        // }, 1000 * 60 * 10);

        // createRequestRole({
        //     guild_id: interaction.guildId,
        //     channel_id: interaction.channelId,
        //     message_id: message.id,
        //     reactions: [],
        // })
        // .then(() => {
        //     interaction.editReply({content: "Executado com sucesso!"});
        // })
        // .catch(error => {
        //     console.error(`Houve um erro ao criar RequestRole!`, error);
        //     interaction.editReply({content: "Houve um erro ao criar RequestRole"});
        // });

    },
    buttons: new Collection([
        ["requestrole-adicionar", async (interaction) => {
            await interaction.deferReply({ephemeral: true});
            if(!interaction.memberPermissions?.has('Administrator')) {
                await interaction.editReply({content: "Você precisa ser um administrador para executar este comando!"});
                return;
            }

            await interaction.editReply({content: "Foi executado"});
        }],
        ["requestrole-cancelar", async (interaction) => {
            await interaction.deferReply({ephemeral: true});
            if(!interaction.memberPermissions?.has('Administrator')) {
                await interaction.editReply({content: "Você precisa ser um administrador para executar este comando!"});
                return;
            }

            await interaction.editReply({content: "Foi executado"});
        }],
    ]),
    selects: new Collection([
        ["requestrole-select-role", async (interaction) => {
            await interaction.deferReply({ephemeral: true});
            if(!interaction.memberPermissions?.has('Administrator')) {
                await interaction.editReply({content: "Você precisa ser um administrador para executar este comando!"});
                return;
            }

            interaction.deferUpdate();
        }]
    ])
})
