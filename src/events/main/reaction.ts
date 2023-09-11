import { APIEmbed, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from "discord.js";
import { getRequestRoleByMessageId } from "../../services/requestroles";
import { Event } from "../../structs/types/Event";
import { createApproveRole, getApproveRoleByUserIdAndRoleId } from "../../services/approveroles";

export default new Event({
    name: "messageReactionAdd",
    async run(reaction, user) {
        if (user.bot) return;
        const guild = await reaction.message.guild;
        if (!guild) return;

        const requestrole = await getRequestRoleByMessageId(reaction.message.id);
        if (requestrole) {
            const channelApprove = await reaction.client.channels.fetch(requestrole.channel_approve) as TextChannel | null;
            if (!channelApprove) {
                throw new Error(`Houve um erro ao gerar a solicitação de cargo, o canal não existe ou o bot não tem permissão. ID: ${requestrole.channel_approve}`);
            }
            const roleReaction = await requestrole.reactions.filter(item => {
                if (reaction.emoji.id != null) { // Trata emojis criados pelo servidor
                    return `<:${reaction.emoji.name}:${reaction.emoji.id}>` == item.emoji
                }
                return reaction.emoji.name == item.emoji
            })[0];
            if (!roleReaction) {
                throw new Error(`Não foi encontrado este emoji na base: ${reaction.emoji.name}`);
            }
            const roleApprove = await guild.roles.fetch(roleReaction.role_id);
            if (!roleApprove) {
                throw new Error(`ERRO! Talvez este cargo já não exista mais! ${roleReaction.role_id}`);
            }

            if (await getApproveRoleByUserIdAndRoleId(user.id, roleApprove.id)) {
                console.log(`user: ${user.username} já possui uma solicitação ativa para o cargo: ${roleApprove.name}, id: ${roleApprove.id}`);
                return;
            }

            const member = await guild.members.fetch(user.id);
            if (member.roles.cache.get(roleApprove.id)) {
                console.log(`user: ${user.username} - ID: ${user.id} já possui a role: ${roleApprove.name} - ID: ${roleApprove.id}`);
                return;
            }

            const embed: APIEmbed = {
                title: `Aprovação`,
                description: `Solicitação de cargo`,
                color: 0xf2f700,
                thumbnail: {
                    url: user.displayAvatarURL(),
                },
                author: {
                    name: `${user.username}`,
                    icon_url: user.displayAvatarURL()
                },
                fields: [
                    {
                        name: `Usuario:`,
                        value: `${user}`,
                    },
                    {
                        name: `Cargo:`,
                        value: `${reaction.emoji} - ${roleApprove}`,
                    },
                    {
                        name: `Data e Hora:`,
                        value: new Date().toISOString(),
                    }
                ],
            };

            const row = new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder({
                        customId: "approve_roles-aprovar", label: "Aprovar", style: ButtonStyle.Success,
                    }),
                    new ButtonBuilder({
                        customId: "approve_roles-recusar", label: "Recusar", style: ButtonStyle.Danger,
                    }),
                ]
            });

            const message = await channelApprove.send({ embeds: [embed], components: [row] });

            await createApproveRole({
                guild_id: message.guildId,
                channel_id: message.channelId,
                message_id: message.id,
                embed: embed,
                role_id: roleApprove.id,
                user_id: user.id,
            });

        }
    },
})