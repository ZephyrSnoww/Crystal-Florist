const { SlashCommandBuilder } = require("@discordjs/builders");
const helpers = require("../helpers");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("choose")
        .setDescription("Choose between some options!")
        .addStringOption(option => option
            .setName("options")
            .setDescription("The options to choose from, separated by \", \"")
            .setRequired(true))
        .addBooleanOption(option => option
            .setName("hidden")
            .setDescription("Whether my choice should be shown to everyone or just you")
            .setRequired(false)),

    async execute(interaction) {
        const options = interaction.options.getString("options");
        const hidden = interaction.options.getBoolean("hidden") || false;

        let splitOptions = options.split(/,\s*/gm);

        if (splitOptions.length === 1) {
            return interaction.reply({
                embeds: [
                    helpers.createEmbed({
                        title: "Whoops!",
                        description: "You must provide at least two options!",
                        author: interaction.user
                    })
                ],
                ephemeral: true
            });
        }

        let choice = splitOptions[Math.floor(Math.random() * splitOptions.length)];

        interaction.reply({
            embeds: [
                helpers.createEmbed({
                    title: choice,
                    description: `I choose ${choice}!`,
                    fields: [
                        {
                            name: "Options You Gave",
                            value: splitOptions.join("\n")
                        }
                    ],
                    author: interaction.user
                })
            ],
            ephemeral: hidden
        });

        return console.log(`${interaction.user.username} made a choice!`);
    }
}
