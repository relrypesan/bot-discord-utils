import { client } from "../..";
import { APIEmbed, ApplicationCommandOptionType, ApplicationCommandType, ButtonInteraction, CacheType, Channel, Collection, CommandInteraction, Emoji, Guild, GuildMember, Role, TextChannel } from "discord.js";
import { Command } from "../../structs/types/Command";
import { createRequestRole, getRequestRoleByMessageId, updateRequestRoleById } from "../../services/requestroles";
import { deleteApproveRoleById, getApproveRoleByMessageId } from "../../services/approveroles";
import { ApproveRole } from "../../models/approverole";
import { getSystemConfigByGuildId } from "../../services/systemconfig";

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

async function validacaoBotoes(interaction: ButtonInteraction<CacheType>): Promise<ApproveRole | false> {
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild;
    if (!guild) {
        await interaction.editReply({ content: "Guild não encontrada!" });
        return false;
    }
    if (!interaction.memberPermissions?.has('Administrator')) {
        await interaction.editReply({ content: "Você precisa ser um administrador para executar este comando!" });
        return false;
    }
    const approverole = await getApproveRoleByMessageId(interaction.message.id);
    if (!approverole || !approverole._id) {
        await interaction.editReply({ content: "Não foi encontrado esta solicitação!" });
        return false;
    }

    approverole.embed.timestamp = new Date().toISOString();
    approverole.embed.fields?.push({
        name: `-----------------------`,
        value: ``,
    }, {
        name: `Moderador`,
        value: `${interaction.user}`,
    }, {
        name: `Data e Hora`,
        value: new Date().toISOString(),
    });

    return approverole;
}

export default new Command({
    name: "requestrole",
    description: "cria uma mensagem com botões para solicitar cargo",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "create",
            description: "cria um novo requestrole",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "canal-request",
                    description: "canal que terá a mensagem para solicitar cargo",
                    type: ApplicationCommandOptionType.Channel,
                    required: true
                },
                {
                    name: "canal-aprovacao",
                    description: "canal que receberá a solicitação dos cargos",
                    type: ApplicationCommandOptionType.Channel,
                    required: true
                }
            ]
        },
        {
            name: "addrole",
            description: "adiciona uma role e um emoji no cache",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "message_id",
                    description: "id da mensagem que será utilizada para o requestrole",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
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
        },
        {
            name: "remrole",
            description: "remove uma role do request",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "message_id",
                    description: "id da mensagem que será utilizada para remover a role",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: "indice",
                    description: "o indice do cargo que deve ser removido da mensagem, deve ser maior que 0",
                    type: ApplicationCommandOptionType.Number,
                    required: true,
                }
            ]
        }
    ],
    isAdmin: true,
    async run({ interaction, options }) {
        if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;
        await interaction.deferReply({ ephemeral: true });

        async function requestRoleCreate(interaction: CommandInteraction<CacheType>) {
            const canalRequest = options.getChannel("canal-request", true) as TextChannel;
            const canalAprovacao = options.getChannel("canal-aprovacao", true) as TextChannel;
            const embed: APIEmbed = {
                title: "JOGOS",
                description: "Selecione os jogos que você joga para que os moderadores liberem os acessos."
            }
            const message = await canalRequest.send({ embeds: [embed] });

            await createRequestRole({
                guild_id: canalRequest.guildId,
                channel_id: canalRequest.id,
                message_id: message.id,
                channel_approve: canalAprovacao.id,
                embed,
                reactions: [],
            })
                .then(async () => {
                    await interaction.editReply({ content: "Mensagem enviada e cadastrada na base de dados!" });
                })
                .catch(async () => {
                    await interaction.editReply({ content: "Houve um ERRO ao cadastra os dados na base de dados!" });
                });
        }

        async function requestRoleAddRole(interaction: CommandInteraction<CacheType>) {
            const message_id = options.getString("message_id", true);
            const role = options.getRole("cargo", true) as Role;
            const emoji = options.getString("emoji", true);
            const requestMessage = await getRequestRoleByMessageId(message_id);
            if (!requestMessage || !requestMessage._id) {
                await interaction.editReply({ content: "Não foi encontrado esta mensagem na base de dados!" });
                return;
            }

            const channel = await interaction.guild?.channels.fetch(requestMessage.channel_id) as TextChannel;
            if (!channel) {
                throw new Error(`Canal com ID: ${requestMessage.channel_id} não foi encontrado!`);
            }
            const message = await channel.messages.fetch(requestMessage.message_id);
            if (!message) {
                throw new Error(`Mensagem com ID: ${requestMessage.message_id} não foi encontrada!`);
            }

            if (requestMessage.reactions.filter(value => value.emoji === emoji).length > 0) {
                await interaction.editReply({ content: "ERRO: já existe este emoji como reação" });
                return;
            }

            requestMessage.reactions.push({ role_id: role.id, emoji });
            await updateRequestRoleById(requestMessage._id, requestMessage);

            const arrayReactions = await Promise.all(requestMessage.reactions.map(async (value, index) => {
                const role = await interaction.guild?.roles.fetch(value.role_id);
                return { ...value, role };
            }))

            const stringCargos = arrayReactions.map((value, index) => {
                return `${index}. ${value.emoji} - ${value.role}`;
            }).join("\n");

            const embedMessage: APIEmbed = {
                ...requestMessage.embed,
                description: `${requestMessage.embed.description}\n\n${stringCargos}`
            }

            message.edit({ embeds: [embedMessage] });
            message.react(emoji);

            await interaction.editReply({ content: "Cargo adicionado ao requestrole com sucesso!" });
        }

        async function requestRoleRemRole(interaction: CommandInteraction<CacheType>) {
            const message_id = options.getString("message_id", true);
            const index = options.getNumber("indice", true);
            const requestMessage = await getRequestRoleByMessageId(message_id);
            if (!requestMessage || !requestMessage._id) {
                await interaction.editReply({ content: "Não foi encontrado esta mensagem na base de dados!" });
                return;
            }
            if (index <= 0) {
                await interaction.editReply({ content: "valor da mensagem deve ser maior que 0!" });
                return;
            }

            const channel = await interaction.guild?.channels.fetch(requestMessage.channel_id) as TextChannel;
            if (!channel) {
                throw new Error(`Canal com ID: ${requestMessage.channel_id} não foi encontrado!`);
            }
            const message = await channel.messages.fetch(requestMessage.message_id);
            if (!message) {
                throw new Error(`Mensagem com ID: ${requestMessage.message_id} não foi encontrada!`);
            }
            const reactionRole = requestMessage.reactions.at(index - 1);
            if (!reactionRole) {
                await interaction.editReply({ content: "AVISO! Não foi encontrado este cargo nesta mensagem!" });
                return;
            }

            const deletedReaction = requestMessage.reactions.splice(index - 1, 1)[0];

            message.reactions.cache
                .filter((value) => value.emoji.name == deletedReaction.emoji)
                .each((messageReaction) => messageReaction.remove());

            await updateRequestRoleById(requestMessage._id, requestMessage);

            const arrayReactions = await Promise.all(requestMessage.reactions.map(async (value, index) => {
                const role = await interaction.guild?.roles.fetch(value.role_id);
                return { ...value, role };
            }))

            const stringCargos = arrayReactions.map((value, index) => {
                return `${index}. ${value.emoji} - ${value.role}`;
            }).join("\n");

            const embedMessage: APIEmbed = {
                ...requestMessage.embed,
                description: `${requestMessage.embed.description}\n\n${stringCargos}`
            }

            message.edit({ embeds: [embedMessage] });

            await interaction.editReply({ content: "Cargo removido do requestrole com sucesso!" });
        }

        try {
            const subCommand = options.getSubcommand();

            switch (subCommand) {
                case "create":
                    await requestRoleCreate(interaction);
                    break;
                case "addrole":
                    await requestRoleAddRole(interaction);
                    break;
                case "remrole":
                    await requestRoleRemRole(interaction);
                    break;
            }

            if (!interaction.replied) {
                await interaction.editReply({ content: "Executado com sucesso!" });
            }
        } catch (error) {
            if (!interaction.replied) {
                await interaction.editReply({ content: "Houve um ERRO na execução do comando!" });
            }
        }
    },
    buttons: new Collection([
        ["approve_roles-aprovar", async (interaction) => {
            const approverole = await validacaoBotoes(interaction);
            if (!approverole || !approverole._id || !client.user) return;
            const guild = interaction.guild as Guild;

            approverole.embed.color = 0x00d830;
            approverole.embed.footer = {
                text: `Aprovado por: ${interaction.user.username}`,
                icon_url: `https://cdn-icons-png.flaticon.com/512/190/190411.png`
            }

            let member: GuildMember;

            try {
                member = await guild.members.fetch(approverole.user_id);
            } catch (error) {
                await interaction.editReply({ content: "ERRO! Não foi encontrado o usuario, ele pode ter saido do servidor." });
                return;
            }

            const memberBot = await guild.members.fetch(client.user.id);
            const role = await guild.roles.fetch(approverole.role_id);

            if (!role) {
                await interaction.editReply({ content: "ERRO! Não foi encontrado o cargo, ele pode ter sido deletado." });
                return;
            }
            if (memberBot.roles.highest.comparePositionTo(role) <= 0) {
                await interaction.editReply({ content: "ERRO! O Bot precisa ter uma permissão maior que o cargo que ele está tentando gerenciar." });
                return;
            }

            member.roles.add(role)
                .then(async() => {
                    console.log(`O moderador: ${interaction.user.username} aprovou a role ${role.name} para o usuário ${member.user.username}`);
                    let systemconfig;

                    try {
                        systemconfig = await getSystemConfigByGuildId(guild.id);
                    } catch (error) {}

                    const embed: APIEmbed = {
                        title: `Cargo Aprovado!`,
                        color: 0x00EE00,
                        description: `O cargo: **${role.name}** foi aprovado por um moderador, agora aproveite os canais dos seus jogos favoritos 😍`,
                        thumbnail: {
                            url: `https://cdn.discordapp.com/attachments/1126653446720847912/1126653637796577371/MATTUTOS-v2.jpg`
                        },
                        timestamp: new Date().toISOString(),
                        footer: {
                            text: `Aprovado por: ${interaction.user.username}`
                        }
                    }

                    if (systemconfig && systemconfig.channel_id_global) {
                        const linkChannelGlobal = `https://discord.com/channels/${systemconfig.guild_id}/${systemconfig.channel_id_global}`;
                        embed.url = linkChannelGlobal;
                        embed.description = `${embed.description}\n\nConfira:\n${embed.url}\n`;
                    }

                    member.user.send({embeds: [embed]})
                })
                .catch((error) => {
                    console.error('Erro ao adicionar a role:', error);
                });

            await deleteApproveRoleById(approverole._id);

            interaction.message.edit({ embeds: [approverole.embed], components: [] });

            await interaction.editReply({ content: "Foi executado" });
        }],
        ["approve_roles-recusar", async (interaction) => {
            const approverole = await validacaoBotoes(interaction);
            if (!approverole || !approverole._id) return;

            approverole.embed.color = 0xd90000;
            approverole.embed.footer = {
                text: `Recusado por: ${interaction.user.username}`,
                icon_url: `https://img.freepik.com/icones-gratis/botao-x_318-391115.jpg`
            }

            interaction.message.edit({ embeds: [approverole.embed], components: [] });

            await deleteApproveRoleById(approverole._id);

            await interaction.editReply({ content: "Foi executado" });
        }],
    ]),
})
