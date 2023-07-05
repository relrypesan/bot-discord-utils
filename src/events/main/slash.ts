import { CommandInteractionOptionResolver } from "discord.js";
import { client } from "../..";
import { Event } from "../../structs/types/Event";

export default new Event({
    name: "interactionCreate",
    run(interaction) {
        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        const options = interaction.options as CommandInteractionOptionResolver

        if (command.isAdmin && !interaction.memberPermissions?.has('Administrator')) {
            interaction.reply({ephemeral: true, content: `Você precisa ter um cargo de administrador para executar este comando!`});
            return;
        }

        command.run({ client, interaction, options })
        .catch(error => {
            console.log(`Houve um erro na execução do comando.\n${error}`.red);
        });
    },
})