const { SlashCommandBuilder } = require("@discordjs/builders");
const helpers = require("../helpers");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("create-embed")
        .setDescription("Create an embed!")
        .addChannelOption(option => option
            .setName("channel")
            .setDescription("The channel to send the embed in")
            .setRequired(true))
        .addStringOption(option => option
            .setName("title")
            .setDescription("The title of the embed")
            .setRequired(true))
        .addStringOption(option => option
            .setName("description")
            .setDescription("The description of the embed")
            .setRequired(true))
        .addIntegerOption(option => option
            .setName("color")
            .setDescription("The color of the embed (formatted as a 0x000000 hex code)")
            .setRequired(true))
        .addUserOption(option => option
            .setName("user")
            .setDescription("The user to display at the top of the embed")
            .setRequired(false))
        .addStringOption(option => option
            .setName("footer")
            .setDescription("The footer of the embed")
            .setRequired(false))
        .addBooleanOption(option => option
            .setName("timestamp")
            .setDescription("Whether or not to add a timestamp to the embed")
            .setRequired(false)),

    async execute(interaction) {
        const channel = interaction.options.getChannel("channel");
        const title = interaction.options.getString("title");
        const description = interaction.options.getString("description");
        const color = interaction.options.getInteger("color");
        const user = interaction.options.getUser("user");
        const footer = interaction.options.getString("footer");
        const timestamp = interaction.options.getBoolean("timestamp");

        if (!["GUILD_TEXT", "GUILD_NEWS", "GUILD_NEWS_THREAD", "GUILD_PUBLIC_THREAD", "GUILD_PRIVATE_THREAD"].includes(channel.type)) {
            return interaction.reply({
                embeds: [
                    helpers.createEmbed({
                        title: "Whoops!",
                        description: "You must select a text channel!",
                        author: interaction.user,
                    })
                ] 
            });
        }

        channel.send({
            embeds: [
                helpers.createEmbed({
                    title: title,
                    description: description,
                    color: color,
                    author: user,
                    footer: footer ? {
                        text: footer,
                        image: null
                    } : null,
                    timestamp: timestamp === undefined ? false : timestamp
                })
            ]
        });

        interaction.reply({
            embeds: [
                helpers.createEmbed({
                    title: "Alright!",
                    description: "Embed successfully created!",
                    author: interaction.user,
                })
            ]
        });

        console.log(`${interaction.user.username} created an embed!`);
    }
}