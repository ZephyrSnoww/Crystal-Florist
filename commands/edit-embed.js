const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageCollector } = require('discord.js');
const helpers = require('../helpers');

module.exports = {
  modOnly: true,

  channelToEdit: null,
  messageToEdit: null,
  embedToEdit: null,
  validOptions: {
    title: 'string',
    description: 'string',
    color: 'int',
    user: 'user',
    'footer text': 'string',
    'footer image': 'url',
    timestamp: 'boolean'
  },

  data: new SlashCommandBuilder()
    .setName('edit-embed')
    .setDescription('Edit an embed using messages!'),

  async execute (interaction) {
    // Create reply embed
    const replyEmbed = helpers.createEmbed({
      title: 'Alright!',
      description: 'Send the ID of the channel that contains the embed you want to edit!\n\n*Say "cancel" to cancel creation*',
      author: interaction.user
    });

    // Reply and get reply object
    await interaction.reply({ embeds: [replyEmbed] });
    const replyMessage = await interaction.fetchReply();

    // Await input
    await this.getInput({
      waitTime: 60 * 5,
      interaction,
      replyEmbed,
      replyMessage,
      specific: 'getChannelID'
    });
  },

  async sendError ({ waitTime = 60, interaction, replyEmbed, replyMessage, specific = null, errorMessage }) {
    replyEmbed.setTitle('Whoops!');
    replyEmbed.setDescription(errorMessage);

    replyMessage.edit({ embeds: this.embedToEdit ? [this.embedToEdit, replyEmbed] : [replyEmbed] });

    return await this.getInput({
      waitTime,
      interaction,
      replyEmbed,
      replyMessage,
      specific
    });
  },

  async getInput ({ waitTime = 60, interaction, replyEmbed, replyMessage, specific = null }) {
    // Define a filter for message collection
    const filter = (message) => message.author.id == interaction.user.id;

    // Wait for 1 message with a specific timeout
    await interaction.channel.awaitMessages({
      filter,
      max: 1
    }).then(async (messages) => {
      // Get the collected message
      const message = messages.first();
      let invalidInput = false;
      let outputString = '';
      message.delete();

      replyEmbed.fields = [];

      // If they have an embed selected
      if (this.channelToEdit) {
        replyEmbed.setTitle(`Editing embed in channel ${this.channelToEdit.name}`);
      }

      // If they're finishing the embed
      if (message.content.toLowerCase() === 'done') {
        if (this.embedToEdit) {
          replyEmbed.setTitle('Success!');
          replyEmbed.setDescription('Embed edited!');
          replyMessage.edit({ embeds: [replyEmbed] });

          return this.messageToEdit.edit({ embeds: [this.embedToEdit] });
        }

        replyEmbed.setTitle('Whoops!');
        replyEmbed.setDescription('You must specify an embed to edit!\nEmbed creation has been cancelled.');
        return replyMessage.edit({ embeds: [replyEmbed] });
      }

      // If they're cancelling after being asked a specific thing
      if (specific && message.content.toLowerCase() === 'cancel') {
        // If the specific thing wasnt the embed ID, return to normal state
        if (!(specific === 'getChannelID' || specific === 'getMessageID' || specific === 'fieldToEdit')) {
          replyEmbed.setDescription('What field would you like to edit?');
          replyEmbed.addField('Valid Fields', Object.keys(this.validOptions).join('\n'));
          replyMessage.edit({ embeds: this.embedToEdit ? [this.embedToEdit, replyEmbed] : [replyEmbed] });

          return await this.getInput({
            waitTime: 60 * 5,
            interaction,
            replyEmbed,
            replyMessage,
            specific: 'fieldToEdit'
          });
        } else {
          replyEmbed.setTitle('Alright!');
          replyEmbed.setDescription('Embed editing cancelled.');
          return replyMessage.edit({ embeds: [replyEmbed] });
        }
      }

      // If they were asked for a channel ID
      if (specific === 'getChannelID') {
        // Check if they gave a valid number
        if (Number(message.content) == NaN) {
          invalidInput = true;
        }

        if (!invalidInput) {
          interaction.guild.channels.fetch(message.content).then(async (channel) => {
            this.channelToEdit = channel;

            replyEmbed.setTitle('Alright!');
            replyEmbed.setDescription('Send the ID of the channel that contains the embed you want to edit!\n\n*Say "cancel" to cancel creation*');
            replyMessage.edit({ embeds: this.embedToEdit ? [this.embedToEdit, replyEmbed] : [replyEmbed] });

            return await this.getInput({
              waitTime: 60 * 5,
              interaction,
              replyEmbed,
              replyMessage,
              specific: 'getMessageID'
            });
          }).catch((e) => {
            invalidInput = true;
          });
        }

        // If the input was invalid, say so
        if (invalidInput) {
          return await this.sendError({
            waitTime: 60 * 5,
            interaction,
            replyEmbed,
            replyMessage,
            specific: 'getChannelID',
            errorMessage: 'You must send a valid ID!\n\n*Say "cancel" to cancel creation*'
          });
        }
      }

      // If they were asked for a message ID
      if (specific === 'getMessageID') {
        // Check if they gave a valid number
        if (Number(message.content) == NaN) {
          invalidInput = true;
        }

        if (!invalidInput) {
          this.channelToEdit.messages.fetch(message.content).then(async (message) => {
            this.messageToEdit = message;
            this.embedToEdit = message.embeds[0];

            replyEmbed.setDescription('What field would you like to edit?');
            replyEmbed.addField('Valid Fields', Object.keys(this.validOptions).join('\n'));
            replyMessage.edit({ embeds: this.embedToEdit ? [this.embedToEdit, replyEmbed] : [replyEmbed] });

            return await this.getInput({
              waitTime: 60 * 5,
              interaction,
              replyEmbed,
              replyMessage,
              specific: 'fieldToEdit'
            });
          }).catch((e) => {
            invalidInput = true;
          });
        }

        if (invalidInput) {
          return await this.sendError({
            waitTime: 60 * 5,
            interaction,
            replyEmbed,
            replyMessage,
            specific: 'getMessageID',
            errorMessage: 'You must send a valid ID!\n\n*Say "cancel" to cancel creation*'
          });
        }
      }

      // If they were prompted for a title
      if (specific === 'title') {
        this.embedToEdit.setTitle(message.content);
        replyEmbed.setDescription('Title changed!\n\n*Say "cancel" to cancel creation, or "done" to finish*');
        replyEmbed.addField('Valid Fields', Object.keys(this.validOptions).join('\n'));
      }

      if (specific === 'description') {
        this.embedToEdit.setDescription(message.content);
        replyEmbed.setDescription('Description changed!\n\n*Say "cancel" to cancel creation, or "done" to finish*');
        replyEmbed.addField('Valid Fields', Object.keys(this.validOptions).join('\n'));
      }

      if (specific === 'color') {
        let color = message.content.split(' ')[0];

        if (color.startsWith('#')) {
          color = color.substring(1);
        }

        if (!color.startsWith('0x')) {
          color = `0x${color}`;
        }

        if (isNaN(Number(color))) {
          replyEmbed.setDescription('Please enter a valid color!\n\n*Say "cancel" to go back*');
          replyMessage.edit({ embeds: [this.embedToEdit, replyEmbed] });

          return await this.getInput({
            waitTime: 60 * 5,
            interaction,
            replyEmbed,
            replyMessage,
            specific
          });
        }

        this.embedToEdit.setColor(Number(color));
        replyEmbed.setDescription(`Color changed to ${color}!\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*`);
        replyEmbed.addField('Valid Fields', Object.keys(this.validOptions).join('\n'));
      }

      if (specific === 'user') {
        if (message.content.toLowerCase() === 'none') {
          this.embedToEdit.author = null;
          replyEmbed.setDescription('User successfully removed!\n\n*Say "cancel" to cancel creation, or "done" to finish*');
          replyEmbed.addField('Valid Fields', Object.keys(this.validOptions).join('\n'));
          replyMessage.edit({ embeds: [this.embedToEdit, replyEmbed] });

          // Get input
          return await this.getInput({
            waitTime: 60 * 5,
            interaction,
            replyEmbed,
            replyMessage,
            specific: 'fieldToEdit'
          });
        }

        // If their message isnt a user ping
        if (!/<@!(\d+)>/.test(message.content)) {
          // Edit embeds to say so
          replyEmbed.setDescription('Please enter a valid user!\n\n*Say "cancel" to go back*');
          replyMessage.edit({ embeds: [this.embedToEdit, replyEmbed] });

          // Get input
          return await this.getInput({
            waitTime: 60 * 5,
            interaction,
            replyEmbed,
            replyMessage,
            specific
          });
        }

        const member = interaction.guild.members.cache.get(message.content.substring(3, message.content.length - 1));
        this.embedToEdit.setAuthor(member.user.username, member.user.avatarURL());

        replyEmbed.setDescription('User set successfully!\n\n*Say "cancel" to cancel creation, or "done" to finish*');
        replyEmbed.addField('Valid Fields', Object.keys(this.validOptions).join('\n'));
      }

      if (specific === 'footer text') {
        if (message.content.toLowerCase() === 'none') {
          this.embedToEdit.setFooter(null);
          replyEmbed.setDescription('Footer successfully removed!\n\n*Say "cancel" to cancel creation, or "done" to finish*');
          replyEmbed.addField('Valid Fields', Object.keys(this.validOptions).join('\n'));
          replyMessage.edit({ embeds: [this.embedToEdit, replyEmbed] });

          // Get input
          return await this.getInput({
            waitTime: 60 * 5,
            interaction,
            replyEmbed,
            replyMessage,
            specific: 'fieldToEdit'
          });
        }

        this.embedToEdit.setFooter(message.content, this.embedToEdit.footer ? this.embedToEdit.footer.iconURL : null);
        replyEmbed.setDescription('Footer text set successfully!\n\n*Say "cancel" to cancel creation, or "done" to finish*');
        replyEmbed.addField('Valid Fields', Object.keys(this.validOptions).join('\n'));
      }

      if (specific === 'footer image') {
        if (this.embedToEdit.footer === null) {
          replyEmbed.setDescription('You must set footer text before you can set a footer image!\n\n*Say "cancel" to cancel creation, or "done" to finish*');
          replyEmbed.addField('Valid Fields', Object.keys(this.validOptions).join('\n'));
          replyMessage.edit({ embeds: [this.embedToEdit, replyEmbed] });

          // Get input
          return await this.getInput({
            waitTime: 60 * 5,
            interaction,
            replyEmbed,
            replyMessage,
            specific: 'fieldToEdit'
          });
        }

        if (message.content.toLowerCase() === 'none') {
          this.embedToEdit.setFooter(this.embedToEdit.footer.text, null);
          replyEmbed.setDescription('Footer image successfully removed!\n\n*Say "cancel" to cancel creation, or "done" to finish*');
          replyEmbed.addField('Valid Fields', Object.keys(this.validOptions).join('\n'));
          replyMessage.edit({ embeds: [this.embedToEdit, replyEmbed] });

          // Get input
          return await this.getInput({
            waitTime: 60 * 5,
            interaction,
            replyEmbed,
            replyMessage,
            specific: 'fieldToEdit'
          });
        }

        try {
          const messageToURL = new URL(message.content);
        } catch (error) {
          replyEmbed.setDescription('Please enter a valid image URL!\n\n*Say "cancel" to go back*');
          replyMessage.edit({ embeds: [this.embedToEdit, replyEmbed] });

          // Get input
          return await this.getInput({
            waitTime: 60 * 5,
            interaction,
            replyEmbed,
            replyMessage,
            specific
          });
        }

        this.embedToEdit.setFooter(this.embedToEdit.footer.text, message.content);
        replyEmbed.setDescription('Footer image set successfully!\n\n*Say "cancel" to cancel creation, or "done" to finish*');
        replyEmbed.addField('Valid Fields', Object.keys(this.validOptions).join('\n'));
      }

      if (Object.keys(this.validOptions).includes(specific)) {
        replyMessage.edit({ embeds: [this.embedToEdit, replyEmbed] });
        return await this.getInput({
          waitTime: 60 * 5,
          interaction,
          replyEmbed,
          replyMessage,
          specific: 'fieldToEdit'
        });
      }

      // If they were asked for a field to edit
      if (specific === 'fieldToEdit') {
        // If the message content isnt a valid option
        if (!Object.keys(this.validOptions).includes(message.content.toLowerCase())) {
          // Edit embeds to say so
          replyEmbed.setDescription('Please enter a valid field to edit!\n\n*Say "cancel" to cancel creation, or "done" to finish*');
          replyEmbed.addField('Valid Fields', Object.keys(this.validOptions).join('\n'));
          replyMessage.edit({ embeds: [this.embedToEdit, replyEmbed] });

          // Get input
          return await this.getInput({
            waitTime: 60 * 5,
            interaction,
            replyEmbed,
            replyMessage,
            specific
          });
        }

        let waitTime_ = 60 * 5;

        switch (message.content.toLowerCase()) {
          case 'title': outputString = 'Send the title you want the embed to have!'; break;
          case 'description': outputString = 'Send the description you want the embed to have!'; waitTime_ = 60 * 10; break;
          case 'color': outputString = 'Send the color you would like the embed to have, formatted as a hex code!'; break;
          case 'user': outputString = 'Ping the user you would like the embed to have as its author, or say "none" to remove the author!'; break;
          case 'footer text': outputString = 'Send the text you would like the footer to have, or say "none" to remove the footer!'; break;
          case 'footer image': outputString = 'Send a link to the image you would like the footer to have, or say "none" to remove the image!'; break;
          case 'timestamp':
            let timestampEnabled;
            if (this.embedToEdit.timestamp !== null) {
              this.embedToEdit.setTimestamp(null);
              timestampEnabled = false;
            } else {
              this.embedToEdit.setTimestamp();
              timestampEnabled = true;
            }

            replyEmbed.setDescription(`Timestamp toggled ${timestampEnabled ? 'on' : 'off'}!\n\n*Say \"cancel\" to cancel creation, or \"done\" to finish*`);
            replyEmbed.addField('Valid Fields', Object.keys(this.validOptions).join('\n'));
            replyMessage.edit({ embeds: [this.embedToEdit, replyEmbed] });
            return await this.getInput({
              waitTime: 60 * 5,
              interaction,
              replyEmbed,
              replyMessage,
              specific
            });
          default: outputString = 'what'; break;
        }

        replyEmbed.setDescription(`${outputString}\n\n*Say \"cancel\" to go back*`);
        replyMessage.edit({ embeds: [this.embedToEdit, replyEmbed] });

        // Get input
        return await this.getInput({
          waitTime: waitTime_,
          interaction,
          replyEmbed,
          replyMessage,
          specific: message.content.toLowerCase()
        });
      }
    }).catch((error) => {
      console.error(error);
      return interaction.followUp('Five minutes have passed with no response!\n(That, or I somehow got an error!)\nEmbed creation cancelled.');
    });
  }
};
