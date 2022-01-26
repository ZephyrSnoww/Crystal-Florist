const { SlashCommandBuilder } = require("@discordjs/builders");
const timestring = require("timestring");
const helpers = require("../helpers");
const { execute } = require("./choose");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timestamp")
    .setDescription("Generate a timestamp for a given time!")
    .addStringOption((option) =>
      option
        .setName("time")
        .setDescription("A relative time (ie: 3h22m).  Defaults to 0s")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("format")
        .setDescription("The format of the timestamp to generate")
        .setRequired(false)
    ),

  async execute(interaction) {
    const time =
      Math.floor(Date.now() / 1000) +
      timestring(interaction.options.getString("time") ?? "0s");
    const format = interaction.options.getString("format");

    // TODO: fix this
    if (interaction.options.getString("format") !== null) {
      return interaction.reply({
        embeds: [
          helpers.createEmbed({
            title: "Whoops!",
            description: "The `format` argument is not yet implemented.",
            author: interaction.user,
          }),
        ],
      });
    }

    interaction.reply({
      embeds: [
        helpers.createEmbed({
          title: "Here you go!",
          description: `\`<t:${time}>\` -> <t:${time}>`,
          author: interaction.user,
        }),
      ],
    });
  },
};
