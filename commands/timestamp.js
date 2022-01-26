const { SlashCommandBuilder } = require("@discordjs/builders");
const helpers = require("../helpers");
const { execute } = require("./choose");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timestamp")
    .setDescription("Generate a timestamp for a given time!")
    .addStringOption((option) =>
      option
        .setName("time")
        .setDescription("The time, absolute or relative")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("format")
        .setDescription("The format of the timestamp to generate")
        .setRequired(false)
    ),

  async execute(interaction) {
    const time = interaction.options.getString("time");
    const format = interaction.options.getString("format");

    // TODO: figure out how to actually do anything with this
    interaction.reply({
      embeds: [
        helpers.createEmbed({
          title: "Whoops!",
          description:
            "That command isn't implemented yet!\n" +
            `\`\`\`js\nargs: { time: ${time}, format: ${format} }\n\`\`\``,
          author: interaction.user,
        }),
      ],
    });
  },
};
