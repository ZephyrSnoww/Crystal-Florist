const { SlashCommandBuilder } = require("@discordjs/builders");
const helpers = require("../helpers");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check if I'm online!"),

    async execute(interaction) {
        const responses = [
            "I'm just tending to the roses!",
            "Sorry, I found a butterfly and wandered off!",
            "Don't worry, I'm here!",
            "Come check out this flower!",
            "I just saw the prettiest little bug!",
            "Check it out, I found a cool rock!",
            "I must have dozed off in the shade!"
        ];

        interaction.reply({
            embeds: [
                helpers.createEmbed({
                    title: "Pong!",
                    description: responses[Math.floor(Math.random() * responses.length)],
                    author: interaction.user
                })
            ]
        });

        console.log(`${interaction.user.username} pinged the bot!`);
    }
}