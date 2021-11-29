const { SlashCommandBuilder } = require("@discordjs/builders");
const helpers = require("../helpers");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("create-vote")
        .setDescription("Start a vote!")
        .addStringOption(option => option
            .setName("title")
            .setDescription("The title of the vote")
            .setRequired(true))
        .addStringOption(option => option
            .setName("description")
            .setDescription("The description of the vote")
            .setRequired(true)),

    async execute(interaction) {
        interaction.reply({
            embeds: [
                helpers.createEmbed({
                    title: "Here you go!",
                    description: "",
                    author: interaction.user
                })
            ]
        });

        console.log(`${interaction.user.username} started a vote!`);
    }
}