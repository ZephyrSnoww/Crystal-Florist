const { MessageEmbed } = require("discord.js")

module.exports = {
    defaultColors: [
        "FF9EAA", // Pink
        "FF5E6C", // Red
        "A667E0", // Purple
        "87E69E", // Green
        "7EE6D3" // Blue
    ],

    // Creating embeds
    createEmbed({
        title,
        description,
        color = null,
        url = null,
        author = null,
        thumbnail = null,
        fields = [],
        image = null,
        footer = null
    }) {
        // If no color is given
        // Choose randomly from the default colors list
        if (!color) {
            color = this.defaultColors[Math.floor(Math.random() * this.defaultColors.length)];
        }

        // Make the embed
        const embed = new MessageEmbed()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setURL(url)
            .setThumbnail(thumbnail)
            .setImage(image)
            .setTimestamp()
        
        // Set author if one is given
        if (author) {
            if (typeof(author) === "object") {
                embed.setAuthor(author.username, author.avatarURL());
            }
            else {
                embed.setAuthor(author[0], author[1]);
            }
        }

        // Set fields if any are given
        if (fields.length !== 0) {
            for (let i = 0; i < fields.length; i++) {
                embed.addField(fields[i].name, fields[i].value, fields[i].inline === undefined ? false : fields[i].inline);
            }
        }

        // Set footer if one is given
        if (footer) {
            embed.setFooter(footer.text, footer.image);
        }

        return embed;
    }
}