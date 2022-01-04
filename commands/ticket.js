const { SlashCommandBuilder } = require("@discordjs/builders");
const helpers = require("../helpers");
const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Create a ticket!")
        .addStringOption(option => option
            .setName("topic")
            .setDescription("The topic of the ticket")
            .setRequired(true)),

    async execute(interaction) {
        const data = JSON.parse(fs.readFileSync("./data/data.json"));

        const topic = interaction.options.getString("topic");

        if (data.tickets == undefined) {
            data.tickets = [];
        }

        for (let ticket of data.tickets) {
            if (ticket.author === interaction.user.id && ticket.active) {
                return interaction.reply({
                    embeds: [
                        helpers.createEmbed({
                            title: "Whoops!",
                            description: "You already have an active ticket!\nFinish that one before creating a new one!",
                            author: interaction.user
                        })
                    ],
                    ephemeral: true
                });
            }
        }

        let herbologists;
        let arborists;
        let botanists;

        interaction.guild.roles.fetch("917956423692996638").then(async (role0) => {
            herbologists = role0;

            interaction.guild.roles.fetch("917608366367461406").then(async (role1) => {
                arborists = role1;

                interaction.guild.roles.fetch("917608325808521287").then(async (role2) => {
                    botanists = role2;

                    interaction.guild.channels.create(`${interaction.user.username}-ticket`, {
                        topic,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.roles.everyone,
                                deny: [
                                    "VIEW_CHANNEL"
                                ]
                            },
                            {
                                id: interaction.user,
                                allow: [
                                    "VIEW_CHANNEL",
                                    "SEND_MESSAGES"
                                ]
                            },
                            {
                                id: herbologists,
                                allow: [
                                    "VIEW_CHANNEL",
                                    "SEND_MESSAGES"
                                ]
                            },
                            {
                                id: arborists,
                                allow: [
                                    "VIEW_CHANNEL",
                                    "SEND_MESSAGES"
                                ]
                            },
                            {
                                id: botanists,
                                allow: [
                                    "VIEW_CHANNEL",
                                    "SEND_MESSAGES"
                                ]
                            }
                        ],
                        position: 0
                    }).then(async (channel) => {
                        interaction.reply({
                            embeds: [
                                helpers.createEmbed({
                                    title: "Alright!",
                                    description: "A ticket has been created!",
                                    author: interaction.user
                                })
                            ],
                            ephemeral: true
                        });
            
                        await channel.send({
                            embeds: [
                                helpers.createEmbed({
                                    title: `Ticket created by ${interaction.user.username}`,
                                    description: `**Topic:** ${topic}`
                                })
                            ]
                        });
            
                        data.tickets.push({
                            active: true,
                            date: new Date().toLocaleString(),
                            author: interaction.user.id,
                            channel: channel.id,
                            log: []
                        });
            
                        fs.writeFileSync("./data/data.json", JSON.stringify(data, null, 4));
                    });
                });
            });
        });
    }
}