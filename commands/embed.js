const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageCollector } = require("discord.js");
const helpers = require("../helpers");

module.exports = {
    channel: null,

    data: new SlashCommandBuilder()
        .setName("embed")
        .setDescription("Create an embed using messages!"),

    async execute(interaction) {
        // Define what valid options are
        let validOptions = {
            "channel": "channel",
            "title": "string",
            "description": "string",
            "color": "int",
            "user": "user",
            "footer text": "string",
            "footer image": "url",
            "timestamp": "boolean"
        }

        this.channel = null;

        // Create the preview embed
        let outputEmbed = helpers.createEmbed({
            title: "Preview embed",
            description: "This is what your embed will look like!",
            color: "#ffffff",
            timestamp: false
        });

        // Create the message embed
        let messageEmbed = helpers.createEmbed({
            title: "Creating embed...",
            description: "What would you like to change?",
            author: interaction.user
        });

        // Send preview and message embeds, then get input
        // await interaction.reply({ embeds: [outputEmbed, messageEmbed] }, { fetchReply: true }).then(async () => {
        //     await this.getInput(60, interaction, validOptions, outputEmbed, messageEmbed, replyMessage);
        // });
        await interaction.reply({ embeds: [outputEmbed, messageEmbed] });
        const replyMessage = await interaction.fetchReply();

        // const filter = message => message.content.includes("bruh");

        // interaction.channel.awaitMessages({
        //     filter: () => true,
        //     max: 5,
        //     time: 10000,
        //     errors: ["time"]
        // }).then((messages) => {
        //     console.log(messages.first().content);
        //     messages.first().replay("bruh");
        //     return;
        // }).catch((error) => {
        //     console.error(error);
        // });

        // const collector = await interaction.channel.createMessageCollector({
        //     filter,
        //     max: 1,
        //     time: 10000
        // });

        // collector.on("collect", (message) => {
        //     console.log(message.content);
        //     collector.stop();
        // });

        // collector.on("end", (collected) => {
        //     console.log("done!");
        // });

        await this.getInput(60, interaction, validOptions, outputEmbed, messageEmbed, replyMessage);
    },

    async getInput(waitTime, interaction, validOptions, outputEmbed, messageEmbed, replyMessage, specific=null) {
        // Define a filter for message collection
        const filter = (message) => message.author.id == interaction.user.id;

        // Wait for 1 message with a specific timeout
        await interaction.channel.awaitMessages({
            filter,
            max: 1,
            time: waitTime * 1000,
            errors: ["time"]
        }).then(async (messages) => {
            // Get the collected message
            let message = messages.first();
            message.delete();
            messageEmbed.fields = [];

            // If they try to finish the embed
            if (message.content.toLowerCase() === "done") {
                // If theyve given a channel
                if (this.channel) {
                    // Edit the message
                    messageEmbed.setTitle("Success!");
                    messageEmbed.setDescription("Embed sent!");
                    replyMessage.edit({ embeds: [messageEmbed] });

                    // Send the embed
                    return this.channel.send({ embeds: [outputEmbed] });
                }
                
                // Otherwise, they havent given a channel
                // Tell them they have to
                messageEmbed.setDescription("You must specify the channel you want me to send the embed in!\n\n*Say \"cancel\" to cancel creation*");
                replyMessage.edit({ embeds: [outputEmbed, messageEmbed] });

                // Get input
                return await this.getInput(60, interaction, validOptions, outputEmbed, messageEmbed, replyMessage);
            }

            // If they cancel after being asked for something specific
            if (specific && message.content.toLowerCase() === "cancel") {
                // Return to default state
                messageEmbed.setDescription("What would you like to change?\n\n*Say \"done\" to finish*");
                replyMessage.edit({ embeds: [outputEmbed, messageEmbed] });

                // Get input
                return await this.getInput(60, interaction, validOptions, outputEmbed, messageEmbed, replyMessage);
            }

            // If they cancel without being asked something specific
            if (message.content.toLowerCase() === "cancel") {
                // Edit the embed, stop listening
                messageEmbed.setTitle("Alright!");
                messageEmbed.setDescription("Embed creation cancelled!");
                return replyMessage.edit({ embeds: [messageEmbed] });
            }

            // If they were prompted for a channel
            if (specific === "channel") {
                // If their message isnt a channel tag
                if (!/<#(\d+)>/.test(message.content)) {
                    // Edit embeds to say so
                    messageEmbed.setDescription("Please enter a valid channel!\n\n*Say \"cancel\" to go back*");
                    replyMessage.edit({ embeds: [outputEmbed, messageEmbed] });

                    // Get input
                    return await this.getInput(60, interaction, validOptions, outputEmbed, messageEmbed, replyMessage, "channel");
                }

                interaction.guild.channels.fetch(message.content.substring(2, message.content.length - 1)).then((channel) => {
                    this.channel = channel;
                });
                // Edit embeds to say so
                messageEmbed.setDescription("Channel set successfully!\n\n*Say \"done\" to finish*");
                replyMessage.edit({ embeds: [outputEmbed, messageEmbed] });

                // Get input
                return await this.getInput(60, interaction, validOptions, outputEmbed, messageEmbed, replyMessage);
            }

            // If the message content isnt a valid option
            if (!Object.keys(validOptions).includes(message.content.toLowerCase())) {
                // Edit embeds to say so
                messageEmbed.setDescription("Please enter a valid field to edit!\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*");
                messageEmbed.addField("Valid Fields", Object.keys(validOptions).join("\n"));
                replyMessage.edit({ embeds: [outputEmbed, messageEmbed] });

                // Get input
                return await this.getInput(60, interaction, validOptions, outputEmbed, messageEmbed, replyMessage);
            }

            if (message.content.toLowerCase() === "channel") {
                // Edit embeds to say so
                messageEmbed.setDescription("Send the channel you would like to send this embed in!\n\n*Say \"cancel\" to go back*");
                replyMessage.edit({ embeds: [outputEmbed, messageEmbed] });

                // Get input
                return await this.getInput(60, interaction, validOptions, outputEmbed, messageEmbed, replyMessage, "channel");
            }
            
        }).catch((error) => {
            console.error(error);
            return interaction.followUp("A minute has passed with no response!\nI'm no longer listening...");
        });
    }
}