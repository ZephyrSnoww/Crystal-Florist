const { SlashCommandBuilder } = require("@discordjs/builders");
const helpers = require("../helpers");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("links")
        .setDescription("Get all of my links!"),

    async execute(interaction) {
        interaction.reply({
            embeds: [
                helpers.createEmbed({
                    title: "Here you go!",
                    description: "\
[The Prismatic Garden](https://discord.gg/wRBKXz2rYD)\n\
[The Crystal Florist on Github](https://github.com/glacierheavner/Crystal-Florist)",
                    author: interaction.user
                })
            ]
        });

        console.log(`${interaction.user.username} got the bots links!`);
    }
}