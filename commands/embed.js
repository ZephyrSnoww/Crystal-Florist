const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageCollector } = require("discord.js");
const helpers = require("../helpers");

module.exports = {
    channel: null,
    validOptions: {
        "channel": "channel",
        "title": "string",
        "description": "string",
        "color": "int",
        "user": "user",
        "footer text": "string",
        "footer image": "url",
        "timestamp": "boolean"
    },

    data: new SlashCommandBuilder()
        .setName("embed")
        .setDescription("Create an embed using messages!"),

    async execute(interaction) {
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
            description: "What would you like to change?\n\n*Say \"cancel\" to cancel creation*",
            author: interaction.user
        });
        
        await interaction.reply({ embeds: [outputEmbed, messageEmbed] });
        const replyMessage = await interaction.fetchReply();

        await this.getInput(60*5, interaction, outputEmbed, messageEmbed, replyMessage);
    },

    async getInput(waitTime, interaction, outputEmbed, messageEmbed, replyMessage, specific=null) {
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
            let outputString = "";
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
                return await this.getInput(60*5, interaction, outputEmbed, messageEmbed, replyMessage);
            }

            // If they cancel after being asked for something specific
            if (specific && message.content.toLowerCase() === "cancel") {
                // Return to default state
                messageEmbed.setDescription("What would you like to change?\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*");
                replyMessage.edit({ embeds: [outputEmbed, messageEmbed] });

                // Get input
                return await this.getInput(60*5, interaction, outputEmbed, messageEmbed, replyMessage);
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
                    return await this.getInput(60*5, interaction, outputEmbed, messageEmbed, replyMessage, "channel");
                }

                interaction.guild.channels.fetch(message.content.substring(2, message.content.length - 1)).then((channel) => {
                    this.channel = channel;
                });
                // Edit embeds to say so
                messageEmbed.setDescription("Channel set successfully!\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*");
                replyMessage.edit({ embeds: [outputEmbed, messageEmbed] });

                // Get input
                return await this.getInput(60*5, interaction, outputEmbed, messageEmbed, replyMessage);
            }

            // If the message content isnt a valid option
            if (!Object.keys(this.validOptions).includes(message.content.toLowerCase())) {
                // Edit embeds to say so
                messageEmbed.setDescription("Please enter a valid field to edit!\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*");
                messageEmbed.addField("Valid Fields", Object.keys(this.validOptions).join("\n"));
                replyMessage.edit({ embeds: [outputEmbed, messageEmbed] });

                // Get input
                return await this.getInput(60*5, interaction, outputEmbed, messageEmbed, replyMessage);
            }

            switch (message.content.toLowerCase()) {
                case "channel": outputString = "Send the channel you would like to send this embed in!"; break;
                case "title": outputString = "Send the title you want the embed to have!"; break;
                case "description": outputString = "Send the description you want the embed to have!"; break;
                case "color": outputString = "Send the color you would like the embed to have, formatted as a hex code!"; break;
                case "user": outputString = "Ping the user you would like the embed to have as its author, or say \"none\" to remove the author!"; break;
                case "footer text": outputString = "Send the text you would like the footer to have, or say \"none\" to remove the footer!"; break;
                case "footer image": outputString = "Send a link to the image you would like the footer to have, or say \"none\" to remove the image!"; break;
                case "timestamp":
                    let timestampEnabled;
                    if (messageEmbed.timestamp !== null) {
                        outputEmbed.setTimestamp(null);
                        timestampEnabled = false;
                    }
                    else {
                        messageEmbed.setTimestamp();
                        timestampEnabled = true;
                    }

                    messageEmbed.setDescription(`Timestamp toggled ${timestampEnabled ? "on" : "off"}!\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*`);
                    replyMessage.edit({ embeds: [outputEmbed, messageEmbed] });
                    return await this.getInput(60*5, interaction, outputEmbed, messageEmbed, replyMessage);
                default: outputString = "what"; break;
            }
            
            messageEmbed.setDescription(`${outputString}\n\n*Say \"cancel\" to go back*`);
            replyMessage.edit({ embeds: [outputEmbed, messageEmbed] });
            
            // Get input
            return await this.getInput(60*5, interaction, outputEmbed, messageEmbed, replyMessage, message.content.toLowerCase());
        }).catch((error) => {
            console.error(error);
            return interaction.followUp("Five minutes have passed with no response!\nEmbed creation cancelled.");
        });
    }
}