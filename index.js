const fs = require("fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { Client, Intents, Collection, Permissions } = require("discord.js");
const { sendWelcomeImage } = require("./welcome_images");

// Register .env file
require("dotenv").config();

// Grab environment variables
const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;

// Make an array of all command file names
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

// Create a new client instance
const client = new Client({
    intents: Object.values(Intents.FLAGS)
});

// Make a new commands collection
const commands = [];
client.commands = new Collection();

// Iterate through command filenames
// Require them, add them to the collection
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

// When the client is first ready
client.once("ready", () => {
    // Say so
	console.log("Ready!");
	const CLIENT_ID = client.user.id;
	const rest = new REST({ version: "9" }).setToken(TOKEN);
    // Register commands
	(async () => {
		try {
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
                    body: commands
                },
            );
            console.log("Successfully registered application commands!");
		} catch (error) {
			if (error) console.error(error);
		}
	})();
});

// When the client recieves an interaction
client.on("interactionCreate", async (interaction) => {
    // Only listen for commands
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	if (command.modOnly) {
		if (!interaction.memberPermissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
			return await interaction.reply({
				content: "You don't have permission to do that command!",
				ephemeral: true
			});
		}
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		if (error) { console.error(error); }
		await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
	}
});

client.on("messageCreate", async (message) => {
	let tickets = JSON.parse(fs.readFileSync("./data/tickets.json"));

	for (let i = 0; i < tickets.length; i++) {
		if (message.channel.id === tickets[i].channel) {
			tickets[i].log.push(`${message.author.username}: ${message.content}`);
			if (message.content === "finish ticket") {
				tickets[i].active = false;

				message.guild.channels.fetch(tickets[i].channel).then(async (channel) => {
					await channel.delete(`Ticket completed by ${message.author.username}`);
					tickets[i].channel = null;
				});
			}
		}
	}

	fs.writeFileSync("./data/tickets.json", JSON.stringify(tickets, null, 4));
});

// When someone joins the server
client.on("guildMemberAdd", async (member) => {
	console.log(`${member.user.username} joined!`);
	await sendWelcomeImage(member);
});

// Login using the given token
client.login(TOKEN);