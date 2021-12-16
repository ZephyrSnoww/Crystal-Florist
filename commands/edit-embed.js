const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageCollector } = require("discord.js");
const helpers = require("../helpers");

module.exports = {
    modOnly: true,

    channelToEdit: null,
    messageToEdit: null,
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
        .setName("edit-embed")
        .setDescription("Edit an embed using messages!"),

    async execute(interaction) {
        // Create reply embed
        let replyEmbed = helpers.createEmbed({
            title: "Alright!",
            description: "Send the ID of the message containing the embed you want to edit!\n\n*Say \"cancel\" to cancel creation*",
            author: interaction.user
        });

        // Reply and get reply object
        await interaction.reply({ embeds: [replyEmbed] });
        let replyMessage = await interaction.fetchReply();

        // Await input
        await this.getInput({
            waitTime: 60 * 5,
            interaction,
            replyEmbed,
            replyMessage,
            specific: "getChannelID"
        });
    },

    async getInput({waitTime=60, interaction, replyEmbed, replyMessage, specific=null}) {
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
            let invalidInput = false;
            let outputString = "";
            message.delete();
            
            replyEmbed.fields = [];

            // If they have an embed selected
            if (this.messageToEdit) {
                replyEmbed.setTitle(`Editing embed in channel ${this.messageToEdit}`);
            }

            // If they're cancelling after being asked a specific thing
            if (specific && message.content.toLowerCase() === "cancel") {
                // If the specific thing was the embed ID, just ignore it
                if (specific === "getChannelID" || specific === "getMessageID") {
                    pass
                }
                // Otherwise, return to the default state
                else {
                    replyEmbed.setDescription("What would you like to edit?");
                }
            }

            // If they were asked for an embed ID (to edit)
            if (specific === "getChannelID") {
                // Check if they gave a valid number
                if (Number(message.content) === NaN) {
                    invalidInput = true;
                }

                if (!invalidInput) {
                    interaction.guild.channels.fetch(message.content).then((channel) => {
                        this.channelToEdit = channel;
                    }).catch(console.error);

                    console.log(message.content);
                    console.log(this.channelToEdit);
                }

                // If the input was invalid, say so
                if (invalidInput) {
                    replyEmbed.setTitle("Whoops!");
                    replyEmbed.setDescription("You must send a valid ID!\n\n*Say \"cancel\" to cancel creation*");

                    replyMessage.edit({ embeds: [replyEmbed] });

                    return await this.getInput({
                        waitTime: 60*5,
                        interaction,
                        replyEmbed,
                        replyMessage,
                        specific: "getEmbedID"
                    });
                }
            }


            // if (this.channel !== null) {
            //     replyEmbed.setTitle(`Creating embed for channel ${this.channel.name}`);
            // }

            // // If they try to finish the embed
            // if (message.content.toLowerCase() === "done") {
            //     // If theyve given a channel
            //     if (this.channel) {
            //         // Edit the message
            //         replyEmbed.setTitle("Success!");
            //         replyEmbed.setDescription("Embed sent!");
            //         replyMessage.edit({ embeds: [replyEmbed] });

            //         // Send the embed
            //         return this.channel.send({ embeds: [outputEmbed] });
            //     }
                
            //     // Otherwise, they havent given a channel
            //     // Tell them they have to
            //     replyEmbed.setDescription("You must specify the channel you want me to send the embed in!\n\n*Say \"cancel\" to cancel creation*");
            //     replyMessage.edit({ embeds: [outputEmbed, replyEmbed] });

            //     // Get input
            //     return await this.getInput(60*5, interaction, outputEmbed, replyEmbed, replyMessage);
            // }

            // // If they cancel after being asked for something specific
            // if (specific && message.content.toLowerCase() === "cancel") {
            //     // Return to default state
            //     replyEmbed.setDescription("What would you like to change?\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*");
            //     replyEmbed.addField("Valid Fields", Object.keys(this.validOptions).join("\n"));
            //     replyMessage.edit({ embeds: [outputEmbed, replyEmbed] });

            //     // Get input
            //     return await this.getInput(60*5, interaction, outputEmbed, replyEmbed, replyMessage);
            // }

            // // If they cancel without being asked something specific
            // if (message.content.toLowerCase() === "cancel") {
            //     // Edit the embed, stop listening
            //     replyEmbed.setTitle("Alright!");
            //     replyEmbed.setDescription("Embed creation cancelled!");
            //     return replyMessage.edit({ embeds: [replyEmbed] });
            // }

            // // If they were prompted for a channel
            // if (specific === "channel") {
            //     // If their message isnt a channel tag
            //     if (!/<#(\d+)>/.test(message.content)) {
            //         // Edit embeds to say so
            //         replyEmbed.setDescription("Please enter a valid channel!\n\n*Say \"cancel\" to go back*");
            //         replyMessage.edit({ embeds: [outputEmbed, replyEmbed] });

            //         // Get input
            //         return await this.getInput(60*5, interaction, outputEmbed, replyEmbed, replyMessage, "channel");
            //     }

            //     return interaction.guild.channels.fetch(message.content.substring(2, message.content.length - 1)).then(async (channel) => {
            //         this.channel = channel;
            //         replyEmbed.setTitle(`Creating embed for channel ${this.channel.name}`);
    
            //         // Edit embeds to say so
            //         replyEmbed.setDescription("Channel set successfully!\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*");
            //         replyEmbed.addField("Valid Fields", Object.keys(this.validOptions).join("\n"));
            //         replyMessage.edit({ embeds: [outputEmbed, replyEmbed] });
    
            //         // Get input
            //         return await this.getInput(60*5, interaction, outputEmbed, replyEmbed, replyMessage);
            //     });
            // }

            // // If they were prompted for a title
            // if (specific === "title") {
            //     outputEmbed.setTitle(message.content);
            //     replyEmbed.setDescription("Title changed!\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*");
            //     replyEmbed.addField("Valid Fields", Object.keys(this.validOptions).join("\n"));
            // }

            // if (specific === "description") {
            //     outputEmbed.setDescription(message.content);
            //     replyEmbed.setDescription("Description changed!\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*");
            //     replyEmbed.addField("Valid Fields", Object.keys(this.validOptions).join("\n"));
            // }

            // if (specific === "color") {
            //     let color = message.content.split(" ")[0];

            //     if (color.startsWith("#")) {
            //         color = color.substring(1);
            //     }

            //     if (!color.startsWith("0x")) {
            //         color = `0x${color}`;
            //     }

            //     if (isNaN(Number(color))) {
            //         replyEmbed.setDescription("Please enter a valid color!\n\n*Say \"cancel\" to go back*");
            //         replyMessage.edit({ embeds: [outputEmbed, replyEmbed] });

            //         return await this.getInput(60*5, interaction, outputEmbed, replyEmbed, replyMessage, "color");
            //     }

            //     outputEmbed.setColor(Number(color));
            //     replyEmbed.setDescription(`Color changed to ${color}!\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*`);
            //     replyEmbed.addField("Valid Fields", Object.keys(this.validOptions).join("\n"));
            // }

            // if (specific === "user") {
            //     if (message.content.toLowerCase() === "none") {
            //         outputEmbed.author = null;
            //         replyEmbed.setDescription("User successfully removed!\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*");
            //         replyEmbed.addField("Valid Fields", Object.keys(this.validOptions).join("\n"));
            //         replyMessage.edit({ embeds: [outputEmbed, replyEmbed] });
    
            //         // Get input
            //         return await this.getInput(60*5, interaction, outputEmbed, replyEmbed, replyMessage);
            //     }

            //     // If their message isnt a user ping
            //     if (!/<@!(\d+)>/.test(message.content)) {
            //         // Edit embeds to say so
            //         replyEmbed.setDescription("Please enter a valid user!\n\n*Say \"cancel\" to go back*");
            //         replyMessage.edit({ embeds: [outputEmbed, replyEmbed] });

            //         // Get input
            //         return await this.getInput(60*5, interaction, outputEmbed, replyEmbed, replyMessage, "user");
            //     }

            //     let member = interaction.guild.members.cache.get(message.content.substring(3, message.content.length - 1));
            //     outputEmbed.setAuthor(member.user.username, member.user.avatarURL());

            //     replyEmbed.setDescription("User set successfully!\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*");
            //     replyEmbed.addField("Valid Fields", Object.keys(this.validOptions).join("\n"));
            // }

            // if (specific === "footer text") {
            //     if (message.content.toLowerCase() === "none") {
            //         outputEmbed.setFooter(null);
            //         replyEmbed.setDescription("Footer successfully removed!\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*");
            //         replyEmbed.addField("Valid Fields", Object.keys(this.validOptions).join("\n"));
            //         replyMessage.edit({ embeds: [outputEmbed, replyEmbed] });
    
            //         // Get input
            //         return await this.getInput(60*5, interaction, outputEmbed, replyEmbed, replyMessage);
            //     }

            //     outputEmbed.setFooter(message.content, outputEmbed.footer ? outputEmbed.footer.iconURL : null);
            //     replyEmbed.setDescription("Footer text set successfully!\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*");
            //     replyEmbed.addField("Valid Fields", Object.keys(this.validOptions).join("\n"));
            // }

            // if (specific === "footer image") {
            //     if (outputEmbed.footer === null) {
            //         replyEmbed.setDescription("You must set footer text before you can set a footer image!\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*");
            //         replyEmbed.addField("Valid Fields", Object.keys(this.validOptions).join("\n"));
            //         replyMessage.edit({ embeds: [outputEmbed, replyEmbed] });

            //         // Get input
            //         return await this.getInput(60*5, interaction, outputEmbed, replyEmbed, replyMessage);
            //     }

            //     if (message.content.toLowerCase() === "none") {
            //         outputEmbed.setFooter(outputEmbed.footer.text, null);
            //         replyEmbed.setDescription("Footer image successfully removed!\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*");
            //         replyEmbed.addField("Valid Fields", Object.keys(this.validOptions).join("\n"));
            //         replyMessage.edit({ embeds: [outputEmbed, replyEmbed] });
    
            //         // Get input
            //         return await this.getInput(60*5, interaction, outputEmbed, replyEmbed, replyMessage);
            //     }

            //     try {
            //         let messageToURL = new URL(message.content);
            //     } catch (error) {
            //         replyEmbed.setDescription("Please enter a valid image URL!\n\n*Say \"cancel\" to go back*");
            //         replyMessage.edit({ embeds: [outputEmbed, replyEmbed] });

            //         // Get input
            //         return await this.getInput(60*5, interaction, outputEmbed, replyEmbed, replyMessage, "footer image");
            //     }

            //     outputEmbed.setFooter(outputEmbed.footer.text, message.content);
            //     replyEmbed.setDescription("Footer image set successfully!\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*");
            //     replyEmbed.addField("Valid Fields", Object.keys(this.validOptions).join("\n"));
            // }

            // if (specific !== null) {
            //     replyMessage.edit({ embeds: [outputEmbed, replyEmbed] });
            //     return await this.getInput(60*5, interaction, outputEmbed, replyEmbed, replyMessage);
            // }

            // // If the message content isnt a valid option
            // if (!Object.keys(this.validOptions).includes(message.content.toLowerCase())) {
            //     // Edit embeds to say so
            //     replyEmbed.setDescription("Please enter a valid field to edit!\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*");
            //     replyEmbed.addField("Valid Fields", Object.keys(this.validOptions).join("\n"));
            //     replyMessage.edit({ embeds: [outputEmbed, replyEmbed] });

            //     // Get input
            //     return await this.getInput(60*5, interaction, outputEmbed, replyEmbed, replyMessage);
            // }

            // switch (message.content.toLowerCase()) {
            //     case "channel": outputString = "Send the channel you would like to send this embed in!"; break;
            //     case "title": outputString = "Send the title you want the embed to have!"; break;
            //     case "description": outputString = "Send the description you want the embed to have!"; break;
            //     case "color": outputString = "Send the color you would like the embed to have, formatted as a hex code!"; break;
            //     case "user": outputString = "Ping the user you would like the embed to have as its author, or say \"none\" to remove the author!"; break;
            //     case "footer text": outputString = "Send the text you would like the footer to have, or say \"none\" to remove the footer!"; break;
            //     case "footer image": outputString = "Send a link to the image you would like the footer to have, or say \"none\" to remove the image!"; break;
            //     case "timestamp":
            //         let timestampEnabled;
            //         if (outputEmbed.timestamp !== null) {
            //             outputEmbed.setTimestamp(null);
            //             timestampEnabled = false;
            //         }
            //         else {
            //             outputEmbed.setTimestamp();
            //             timestampEnabled = true;
            //         }

            //         replyEmbed.setDescription(`Timestamp toggled ${timestampEnabled ? "on" : "off"}!\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*`);
            //         replyEmbed.addField("Valid Fields", Object.keys(this.validOptions).join("\n"));
            //         replyMessage.edit({ embeds: [outputEmbed, replyEmbed] });
            //         return await this.getInput(60*5, interaction, outputEmbed, replyEmbed, replyMessage);
            //     default: outputString = "what"; break;
            // }
            
            // replyEmbed.setDescription(`${outputString}\n\n*Say \"cancel\" to go back*`);
            // replyMessage.edit({ embeds: [outputEmbed, replyEmbed] });
            
            // // Get input
            // return await this.getInput(60*5, interaction, outputEmbed, replyEmbed, replyMessage, message.content.toLowerCase());
        }).catch((error) => {
            console.error(error);
            return interaction.followUp("Five minutes have passed with no response!\n(That, or I somehow got an error!)\nEmbed creation cancelled.");
        });
    }
}