import { ApplicationCommandNonOptionsData, ApplicationCommandOptionType, ApplicationCommandType, CacheType, CommandInteraction } from "discord.js";
import { Command } from "../../structs/types/Command";
import { EnumRank } from "../../models/csgostats";

const optionsConfig: ApplicationCommandNonOptionsData[] = [];

Object.entries(EnumRank).forEach(([key, value]) => {
    if (typeof(value) === "number") return;
    var name = value.toString().toLowerCase();
    optionsConfig.push({
        name: name,
        description: `Role para definir a patente ${name.toUpperCase()}`,
        type: ApplicationCommandOptionType.Role,
        required: false
    });
})

export default new Command({
    name: "csgostats",
    description: "comando para configurações do csgo stats bot",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "config",
            description: "configurações para a funcionalidade de sorteio de times",
            type: ApplicationCommandOptionType.Subcommand,
            options: optionsConfig
        },
    ],
    isAdmin: true,
    async run({ interaction, options }) {
        if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;
        await interaction.deferReply({ ephemeral: true });

        async function csgoStatsConfig(interaction: CommandInteraction<CacheType>) {
            await interaction.editReply({ content: "Sucesso! Todos os canais foram configurados." });
        }

        try {
            const subCommand = options.getSubcommand();

            switch (subCommand) {
                case "config":
                    await csgoStatsConfig(interaction);
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
})
