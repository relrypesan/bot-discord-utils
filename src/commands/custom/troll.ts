import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, GuildMember, VoiceChannel } from "discord.js";
import { Command } from "../../structs/types/Command";

export default new Command({
    name: "tiltar",
    description: "zoe um amigo movendo ele para varios canais aleatorios por um periodo",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "usuario",
            description: "o amigo que será trolado",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: "quantidade",
            description: "quantidade de canais que o usuario irá passear.",
            type: ApplicationCommandOptionType.Integer,
            minValue: 5,
            maxValue: 100,
            required: false,
        },
    ],
    isAdmin: true,
    async run({ interaction, options }) {
        const guild = interaction.guild;
        if (!interaction.inCachedGuild() || !guild) return;

        const voiceChannels = guild.channels.cache
            .filter((channel) => channel.type === ChannelType.GuildVoice)
            .map((channel) => channel as VoiceChannel);

        if (voiceChannels.length <= 1) {
            interaction.reply({ ephemeral: true, content: "O servidor precisa ter mais de 1 canal de voz para que este comando funcione!" });
            return;
        }

        const user = options.getUser("usuario", true);
        const guildMember = guild.members.cache.find((m) => m.id === user.id) as GuildMember | undefined;

        if (!guildMember) {
            interaction.reply({ ephemeral: true, content: "Erro! Não foi possivel encontrar o membro no servidor." });
            return;
        }
        // if (guildMember.permissions.has('Administrator')) {
        //     interaction.reply({ephemeral: true, content: "O ademiro não pode ser trolado. 😜."});
        //     return;
        // }

        new Promise(async () => {
            const initialVoiceChannel = guildMember.voice.channel;
            const maxValue = options.getInteger("quantidade", false) || 5;

            for (let count = 0; count < maxValue; count++) {
                let guildMemberLocal = guild.members.cache.find((m) => m.id === user.id) as GuildMember | undefined;
                if (!guildMemberLocal) continue;

                const currentVoiceChannel = guildMemberLocal.voice.channel;

                let targetVoiceChannel
                do {
                    targetVoiceChannel = voiceChannels.at(Math.floor(Math.random() * voiceChannels.length));
                } while (!targetVoiceChannel || targetVoiceChannel.id === currentVoiceChannel?.id);

                await guildMember.voice.setChannel(targetVoiceChannel)
                    .catch(() => { });

                await new Promise(resolve => setTimeout(resolve, 800));
            }

            await guildMember.voice.setChannel(initialVoiceChannel)
                .catch(() => { });
        })

        interaction.reply({ ephemeral: true, content: "Seu amiguinho está sendo trolado! XD" });

    }
})