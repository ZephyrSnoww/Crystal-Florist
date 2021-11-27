const fs = require("fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { Client, Intents, Collection } = require("discord.js");

// Register .env file
require("dotenv").config();

// Grab environment variables
const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;

// Make an array of all command file names
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Create a new client instance
const client = new Client({
    intents: [Intents.FLAGS.GUILDS]
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
client.once('ready', () => {
    // Say so
	console.log('Ready!');
	const CLIENT_ID = client.user.id;
	const rest = new REST({ version: '9' }).setToken(TOKEN);
    // Register commands
	(async () => {
		try {
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
                    body: commands
                },
            );
            console.log('Successfully registered application commands!');
		} catch (error) {
			if (error) console.error(error);
		}
	})();
});

// When the client recieves an interaction
client.on('interactionCreate', async interaction => {
    // Only listen for commands
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		if (error) { console.error(error); }
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

// Login using the given token
client.login(process.env.TOKEN);