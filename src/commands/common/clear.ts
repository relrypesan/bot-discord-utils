import { ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";
import { Command } from "../../structs/types/Command";

export default new Command({
    name: "limpar",
    description: "deleta mensagens do chat",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "quantidade",
            description: "O total de mensagens a serem deletadas",
            type: ApplicationCommandOptionType.Integer,
        }
    ],
    isAdmin: true,
    async run({ interaction, options }) {
        if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;
        await interaction.deferReply({ ephemeral: true });

        let amount = options.getInteger("quantidade");

        if (!amount) amount = 9999999;

        interaction.channel?.bulkDelete(Math.min(amount, 100), true)
            .then(deletedMessages => {
                interaction.editReply({ content: `${deletedMessages.size} mensagens limpas` })
            })
            .catch(reason => {
                interaction.editReply({ content: `Não foi possível deletar mensagens: \n${reason}` })
            });

    },
})