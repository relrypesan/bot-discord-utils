import { APIEmbed, ApplicationCommandOptionType, ApplicationCommandType, ButtonInteraction, CacheType, Channel, Collection, CommandInteraction, Emoji, Guild, Interaction, Role, TextChannel } from "discord.js";
import { Command } from "../../structs/types/Command";
import { createRequestRole, getRequestRoleByMessageId, updateRequestRoleById } from "../../services/requestroles";
import { deleteApproveRoleById, getApproveRoleByMessageId } from "../../services/approveroles";
import { ApproveRole } from "../../models/approverole";

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
    await interaction.deferReply({ephemeral: true});
    const guild = interaction.guild;
    if (!guild) {
        await interaction.editReply({content: "Guild não encontrada!"});
        return false;
    }
    if (!interaction.memberPermissions?.has('Administrator')) {
        await interaction.editReply({content: "Você precisa ser um administrador para executar este comando!"});
        return false;
    }
    const approverole = await getApproveRoleByMessageId(interaction.message.id);
    if (!approverole || !approverole._id) {
        await interaction.editReply({content: "Não foi encontrado esta solicitação!"});
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
        }
    ],
    isAdmin: true,
    async run({interaction, options}) {
        if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;
        await interaction.deferReply({ephemeral: true});

        async function requestRoleCreate(interaction: CommandInteraction<CacheType>, canalRequest: TextChannel, canalAprovacao: TextChannel) {
            const embed: APIEmbed = {
                title: "JOGOS",
                description: "Selecione os jogos que você joga para que os moderadores liberem os acessos."
            }
            const message = await canalRequest.send({embeds:[embed]});

            await createRequestRole({
                guild_id: canalRequest.guildId,
                channel_id: canalRequest.id,
                message_id: message.id,
                channel_approve: canalAprovacao.id,
                embed,
                reactions: [],
            })
            .then(async () => {
                await interaction.editReply({content: "Mensagem enviada e cadastrada na base de dados!"});
            })
            .catch(async () => {
                await interaction.editReply({content: "Houve um ERRO ao cadastra os dados na base de dados!"});
            });
        }

        async function requestRoleAddRole(interaction: CommandInteraction<CacheType>, message_id: string, role: Role, emoji: string) {
            const requestMessage = await getRequestRoleByMessageId(message_id);
            if(!requestMessage || !requestMessage._id) {
                await interaction.editReply({content:"Não foi encontrado esta mensagem na base de dados!"});
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
                await interaction.editReply({content: "ERRO: já existe este emoji como reação"});
                return;
            }

            requestMessage.reactions.push({role_id: role.id, emoji});
            await updateRequestRoleById(requestMessage._id, requestMessage);

            const arrayReactions = await Promise.all(requestMessage.reactions.map(async(value, index) => {
                const role = await interaction.guild?.roles.fetch(value.role_id);
                return {...value, role };
            }))

            const stringCargos = arrayReactions.map((value, index) => {
                return `${index}. ${value.emoji} - ${value.role}`;
            }).join("\n");

            console.log(JSON.stringify(stringCargos));

            const embedMessage: APIEmbed = {
                ...requestMessage.embed,
                description: `${requestMessage.embed.description}\n\n${stringCargos}`
            }

            message.edit({embeds: [embedMessage]});
            message.react(emoji);
            
            await interaction.editReply({content: "Cargo adicionado ao requestrole com sucesso!"})
        }

        try {
            const subCommand = options.getSubcommand();
    
            switch(subCommand) {
                case "create":
                    const canalRequest = options.getChannel("canal-request", true) as TextChannel;
                    const canalAprovacao = options.getChannel("canal-aprovacao", true) as TextChannel;
                    await requestRoleCreate(interaction, canalRequest, canalAprovacao);
                    break;
                case "addrole":
                    const message_id = options.getString("message_id", true);
                    const cargo = options.getRole("cargo", true) as Role;
                    const emoji = options.getString("emoji", true);
                    await requestRoleAddRole(interaction, message_id, cargo, emoji);
                    break;
            }
    
            if ( !interaction.replied ) {
                await interaction.editReply({content: "Executado com sucesso!"});
            }
        } catch (error) {
            if ( !interaction.replied ) {
                await interaction.editReply({content: "Houve um ERRO na execução do comando!"});
            }
        }
    },
    buttons: new Collection([
        ["approve_roles-aprovar", async (interaction) => {
            const approverole = await validacaoBotoes(interaction);
            if (!approverole || !approverole._id) return;
            const guild = interaction.guild as Guild;

            approverole.embed.color = 0x00d830;
            approverole.embed.footer = {
                text: `Aprovado por: ${interaction.user.username}`,
                icon_url: `https://cdn-icons-png.flaticon.com/512/190/190411.png`
            }

            interaction.message.edit({embeds: [approverole.embed], components: []});

            const member = await guild.members.fetch(approverole.user_id);
            const role = await guild.roles.fetch(approverole.role_id);

            if (member && role) {
                member.roles.add(role)
                    .then(() => {
                        console.log(`A role ${role.name} foi adicionada para o usuário ${member.user.tag}`);
                    })
                    .catch((error) => {
                        console.error('Erro ao adicionar a role:', error);
                    });
            }
                
            await deleteApproveRoleById(approverole._id);

            await interaction.editReply({content: "Foi executado"});
        }],
        ["approve_roles-recusar", async (interaction) => {
            const approverole = await validacaoBotoes(interaction);
            if (!approverole || !approverole._id) return;

            approverole.embed.color = 0xd90000;
            approverole.embed.footer = {
                text: `Recusado por: ${interaction.user.username}`,
                icon_url: `https://img.freepik.com/icones-gratis/botao-x_318-391115.jpg`
            }

            interaction.message.edit({embeds: [approverole.embed], components: []});
                
            await deleteApproveRoleById(approverole._id);

            await interaction.editReply({content: "Foi executado"});
        }],
    ]),
})
