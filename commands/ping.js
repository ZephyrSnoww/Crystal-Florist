const { SlashCommandBuilder } = require("@discordjs/builders");
const { pingResponses } = require("../data/misc/random_messages.json");
const helpers = require("../helpers");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check if I'm online!"),

    async execute(interaction) {
        interaction.reply({
            embeds: [
                helpers.createEmbed({
                    title: "Pong!",
                    description: pingResponses[Math.floor(Math.random() * pingResponses.length)],
                    author: interaction.user
                })
            ]
        });

        console.log(`${interaction.user.username} pinged the bot!`);
    }
}