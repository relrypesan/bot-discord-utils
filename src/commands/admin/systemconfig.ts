import { ApplicationCommandOptionType, ApplicationCommandType, CacheType, ChannelType, CommandInteraction } from "discord.js";
import { Command } from "../../structs/types/Command";
import { getSystemConfigByGuildId, updateSystemConfigById } from "../../services/systemconfig";

export default new Command({
    name: "systemconfig",
    description: "comando para configurações do bot no servidor",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "teamgroup",
            description: "configurações para a funcionalidade de sorteio de times",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "canal-espera",
                    description: "canal de voz que será utilizado para voltar todos os jogadores",
                    type: ApplicationCommandOptionType.Channel,
                    required: true
                },
                {
                    name: "canal-time-1",
                    description: "canal de voz direcionado para o time 1",
                    type: ApplicationCommandOptionType.Channel,
                    required: true
                },
                {
                    name: "canal-time-2",
                    description: "canal de voz direcionado para o time 2",
                    type: ApplicationCommandOptionType.Channel,
                    required: true
                }
            ]
        },
    ],
    isAdmin: true,
    async run({interaction, options}) {
        if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;
        await interaction.deferReply({ephemeral: true});

        async function systemConfigTeamGroup(interaction: CommandInteraction<CacheType>) {
            const canalEspera = options.getChannel("canal-espera", true);
            const canalTime1 = options.getChannel("canal-time-1", true);
            const canalTime2 = options.getChannel("canal-time-2", true);
            
            if (canalEspera.type !== ChannelType.GuildVoice) {
                await interaction.editReply({content: "ERRO! 'canal-espera' deve ser um canal de voz!"});
                return;
            }
            if (canalTime1.type !== ChannelType.GuildVoice) {
                await interaction.editReply({content: "ERRO! 'canal-time-1' deve ser um canal de voz!"});
                return;
            }
            if (canalTime2.type !== ChannelType.GuildVoice) {
                await interaction.editReply({content: "ERRO! 'canal-time-2' deve ser um canal de voz!"});
                return;
            }

            const systemConfigGuild = await getSystemConfigByGuildId(interaction.guildId || "");
            if (!systemConfigGuild || !systemConfigGuild._id) {
                await interaction.editReply({content: "Erro inesperado ao buscar system_config da guild!"});
                return;
            }

            await updateSystemConfigById(systemConfigGuild._id, {
                ...systemConfigGuild,
                teamgroup: {
                    channel_id_waiting: canalEspera.id,
                    channel_id_team1: canalTime1.id,
                    channel_id_team2: canalTime2.id
                }
            });
            
            await interaction.editReply({content: "Sucesso! Todos os canais foram configurados."});
        }

        try {
            const subCommand = options.getSubcommand();
    
            switch(subCommand) {
                case "teamgroup":
                    await systemConfigTeamGroup(interaction);
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
})
