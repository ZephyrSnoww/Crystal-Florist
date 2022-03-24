const { SlashCommandBuilder } = require('@discordjs/builders');
const helpers = require('../helpers');

module.exports = {
  modOnly: true,

  interaction: null,

  outputData: null,
  replyEmbed: null,
  outputEmbed: null,
  replyMessage: null,
  outputMessage: null,
  outputChannel: null,

  reactionRoleIndex: null,
  reactionRoleData: null,

  validOutput: false,
  action: null,

  currentValidActions: [],

  data: new SlashCommandBuilder()
    .setName('react-roles')
    .setDescription('Create or edit reaction roles!'),

  // ==================================================
  // Main function
  // ==================================================
  async execute (interaction) {
    // Read datafile
    this.reactionRoleData = helpers.read('./data/react_roles.json');

    // Store the interaction
    this.interaction = interaction;

    // Create a reply embed
    this.replyEmbed = helpers.createEmbed({
      title: 'Alright!',
      description: 'What would you like to do?\n(create, edit, or delete)\n\n*Say "cancel" to do nothing*',
      author: this.interaction.user
    });

    // Send the reply embed
    await this.interaction.reply({
      embeds: [this.replyEmbed]
    });

    // Store the reply message
    this.replyMessage = await this.interaction.fetchReply();

    // Set valid actions
    this.currentValidActions = [
      'create',
      'edit',
      'delete',
      'cancel'
    ];

    // Get input
    await this.getInput();
  },

  // ==================================================
  // Function for updating the reply message easily
  // ==================================================
  async updateReply ({
    title = null,
    description,
    includeOutput = false,
    validActions = false,
    actionTitle = 'Action',
    includeFields = false,
    fields = []
  }) {
    // If a title was given, set it
    if (title) {
      this.replyEmbed.setTitle(title);
    }

    // Set description and remove fields
    this.replyEmbed.setDescription(description);

    // Add valid actions if set
    if (validActions) {
      this.replyEmbed.addField(`Valid ${actionTitle}s`, this.currentValidActions.join('\n'));
    }

    // Add fields if set
    if (includeFields) {
      fields.forEach((field) => {
        this.replyEmbed.addField(field.title, field.description);
      });
    } else {
      this.replyEmbed.fields = [];
    }

    // Edit reply message, with or without the output embed
    if (includeOutput) {
      return this.replyMessage.edit({ embeds: [this.outputEmbed, this.replyEmbed] });
    } else {
      return this.replyMessage.edit({ embeds: [this.replyEmbed] });
    }
  },

  // ==================================================
  // Function for getting beginning input
  // ==================================================
  async getInput () {
    // Wait for 1 message
    await this.interaction.channel.awaitMessages({
      filter: (message) => message.author.id == this.interaction.user.id,
      max: 1
    }).then(async (messages) => {
      // Retrieve first message
      const message = messages.first();

      // Delete the message the user sent
      message.delete();

      // If the message wasn't a valid option
      if (!this.currentValidActions.includes(message.content.toLowerCase())) {
        // Say so
        await this.updateReply({
          title: 'Whoops!',
          description: 'You must choose either "create", "edit", or "delete"!\n\nYou may also say "cancel" to cancel this action'
        });

        // Await further input
        return await this.getInput();
      }

      // If they want to cancel the action
      if (message.content.toLowerCase() === 'cancel') {
        // Update reply message
        await this.updateReply({
          title: 'Alright!',
          description: 'Command cancelled.'
        });

        // Stop doing anything
        return;
      }

      // Set current action (create/edit/delete)
      this.action = message.content.toLowerCase();

      // If they want to create a reaction role
      if (message.content.toLowerCase() === 'create') {
        // Create a boilerplate output embed
        this.outputEmbed = helpers.createEmbed({
          title: 'title',
          description: 'description'
        });

        // Await input for embeds
        return await this.embedInput();
      }

      // If they want to edit or delete a reaction role
      if (message.content.toLowerCase() === 'edit' || message.content.toLowerCase() === 'delete') {
        const embedStrings = [];
        const validNumbers = [];

        // Iterate through stored reaction roles
        for (const reactionRole of this.reactionRoleData.reactRoles) {
          // Fetch the channel
          const roleChannel = await this.interaction.guild.channels.fetch(reactionRole.channelID);
          const roleEmoji = [];

          // Iterate through roles
          for (const role of reactionRole.roles) {
            // Fetch the emoji of the role
            const emoji = await this.interaction.guild.emojis.fetch(role.emoji);
            roleEmoji.push(`${emoji}`);
          }

          // Add the reaction role to the output string
          embedStrings.push(`${reactionRole.id} : ${roleEmoji.join(' ')} in ${roleChannel}`);
          validNumbers.push(reactionRole.id);
        }

        // Set valid actions
        this.currentValidActions = validNumbers;
        this.currentValidActions.push('cancel');

        // Update the reply with reaction roles
        await this.updateReply({
          title: 'Alright!',
          description: `What reaction role embed would you like to ${message.content.toLowerCase()}?\n(Send the number of the embed you'd like to edit)`,
          includeFields: true,
          fields: [
            {
              title: 'Reaction role embeds',
              description: embedStrings.join('\n')
            }
          ]
        });

        return await this.roleChoiceInput();
      }
    });
  },

  // ==================================================
  // Function for choosing a reaction role
  // ==================================================
  async roleChoiceInput () {
    // Wait for one message from the author
    await this.interaction.channel.awaitMessages({
      filter: (message) => message.author.id == this.interaction.user.id,
      max: 1
    }).then(async (messages) => {
      const message = messages.first();

      // Delete the users message
      message.delete();

      // If they didn't give a valid number
      if (!this.currentValidActions.includes(Number(message.content))) {
        // Say so
        await this.updateReply({
          title: 'Whoops!',
          description: 'You must input a valid number!\n\nYou can also say "cancel" to cancel this action',
          includeFields: true
        });

        // Await further input
        return await this.roleChoiceInput();
      }

      // If they want to cancel the action
      if (message.content.toLowerCase() === 'cancel') {
        // Update reply message
        await this.updateReply({
          title: 'Alright!',
          description: 'Command cancelled.'
        });

        // Stop doing anything
        return;
      }

      // Set the reaction role index that they chose
      this.reactionRoleIndex = Number(message.content);

      // If theyre deleting
      if (this.action === 'delete') {
        // Confirm deletion
        return await this.confirmDeletion();
      }

      // If theyre editing
      if (this.action === 'edit') {
        // Get embed input
        await this.updateReply({
          title: 'Alright!',
          description: 'What would you like to change?'
        });

        return await this.embedInput();
      }
    });
  },

  // ==================================================
  // Function for confirming role deletion
  // ==================================================
  async confirmDeletion () {
    // Fetch reaction role channel
    this.interaction.guild.channels.fetch(this.reactionRoleData[this.reactionRoleIndex].channelID)
      .then((channel) => {
        this.outputChannel = channel;
        return this.outputChannel.messages.fetch(this.reactionRoleData[this.reactionRoleIndex].messageID);
      })
    // Fetch reaction role message
      .then((message) => {
        this.outputMessage = message;

        // Get reaction role embed
        this.outputEmbed = message.embeds[0];
      });

    // Update reply
    await this.updateReply({
      title: 'Please confirm!',
      description: 'Are you sure you want to delete this reaction role?',
      includeOutput: true
    });

    // Set valid actions
    this.currentValidActions = ['yes', 'y', 'no', 'n', 'cancel'];

    // Wait for 1 message
    await this.interaction.channel.awaitMessages({
      filter: (message) => message.author.id == this.interaction.user.id,
      max: 1
    }).then(async (messages) => {
      const message = messages.first();

      // Delete the message
      await message.delete();

      // If they didn't give a valid option
      if (!this.currentValidActions.includes(message.content.toLowerCase())) {
        // Say so
        await this.updateReply({
          title: 'Whoops!',
          description: 'You must give a valid response!\n(yes, no, or cancel)'
        });

        // Await further input
        return await this.confirmDeletion();
      }

      // If they want to cancel
      if (['no', 'n', 'cancel'].includes(message.content.toLowerCase())) {
        // Update reply message
        await this.updateReply({
          title: 'Alright!',
          description: 'Command cancelled.'
        });

        // Stop doing anything
        return;
      }

      // If they do want to delete
      if (['yes', 'y'].includes(message.content.toLowerCase())) {
        // Update reply message
        await this.updateReply({
          title: 'Alright!',
          description: 'Reaction role deleted.'
        });

        // Delete the reaction role data
        // And save the file
        const rrID = this.reactionRoleData[this.reactionRoleIndex].id;
        this.reactionRoleData.splice(this.reactionRoleIndex, 1);
        helpers.write('./data/react_roles.json', this.reactionRoleData);

        console.log(`${this.interaction.user.username} removed reaction role id ${rrID}!`);

        // Stop doing anything
      }
    });
  },

  // ==================================================
  // Function for basic embed creation
  // ==================================================
  async embedInput () {
    // Set valid actions
    this.currentValidActions = [
      'title',
      'description',
      'roles',
      'cancel'
    ];

    if (this.validOutput) {
      this.currentValidActions.push('done');
    }

    // Update reply
    await this.updateReply({
      title: 'Alright!',
      description: 'What would you like to change?',
      includeOutput: true,
      validActions: true,
      actionTitle: 'Field'
    });

    // Ask for title/description
    await this.interaction.channel.awaitMessages({
      filter: (message) => message.author.id == this.interaction.user.id,
      max: 1
    }).then(async (messages) => {
      const message = messages.first();

      message.delete();

      // If they didn't give a valid option
      if (!this.currentValidActions.includes(message.content.toLowerCase())) {
        await this.updateReply({
          title: 'Whoops!',
          description: `You must give a valid field to edit!\n\nYou can also say \"cancel\" to cancel this action${this.validOutput ? ', or "done" to finish' : ''}`,
          includeOutput: true,
          validActions: true,
          actionTitle: 'Field'
        });

        return await this.embedInput();
      }

      // If they want to cancel
      if (message.content.toLowerCase() === 'cancel') {
        await this.updateReply({
          title: 'Alright!',
          description: 'Command cancelled.'
        });

        return;
      }

      // If they want to change the title
      if (message.content.toLowerCase() === 'title') {
        return await this.embedTitleInput();
      }

      // If they want to change the description
      if (message.content.toLowerCase() === 'description') {
        return await this.embedDescriptionInput();
      }

      // If they want to change the roles
      if (message.content.toLowerCase() === 'roles') {
        return await this.embedRoleInput();
      }
    });
  },

  // ==================================================
  // Function for embed title editing
  // ==================================================
  async embedTitleInput () {
    this.currentValidActions = null;

    // Update reply
    await this.updateReply({
      title: 'Alright!',
      description: 'Please send the title you want the embed to have!',
      includeOutput: true
    });

    // Await a reply
    await this.interaction.channel.awaitMessages({
      filter: (message) => message.author.id == this.interaction.user.id,
      max: 1
    }).then(async (messages) => {
      const message = messages.first();

      message.delete();

      this.outputEmbed.title = message.content;

      return await this.embedInput();
    });
  },

  // ==================================================
  // Function for embed description editing
  // ==================================================
  async embedDescriptionInput () {
    this.currentValidActions = null;

    // Update reply
    await this.updateReply({
      title: 'Alright!',
      description: 'Please send the description you want the embed to have!',
      includeOutput: true
    });

    // Await a reply
    await this.interaction.channel.awaitMessages({
      filter: (message) => message.author.id == this.interaction.user.id,
      max: 1
    }).then(async (messages) => {
      const message = messages.first();

      message.delete();

      this.outputEmbed.description = message.content;

      return await this.embedInput();
    });
  },

  // ==================================================
  // Function for embed role editing
  // ==================================================
  async embedRoleInput () {
    if (this.outputData) {

    } else {
      return await this.embedRoleInputPing();
    }
  },

  async embedRoleInputPing (updateReply = true) {
    if (updateReply) {
      await this.updateReply({
        title: 'Alright!',
        description: "Please ping the role you'd like to add!",
        includeOutput: true
      });
    }

    // Await a reply
    await this.interaction.channel.awaitMessages({
      filter: (message) => message.author.id == this.interaction.user.id,
      max: 1
    }).then(async (messages) => {
      const message = messages.first();

      message.delete();

      // If they gave invalid input
      if (!message.content.match(/<@&(\d+)>/) && message.content.toLowerCase() !== 'cancel') {
        await this.updateReply({
          title: 'Whoops!',
          description: 'You must ping a role!\n\nYou can also say "cancel" to cancel this action'
        });

        return await this.embedRoleInputPing(false);
      }

      // If they want to cancel
      if (message.content.toLowerCase() === 'cancel') {
        return await this.embedInput();
      }

      // If they pinged a role
      const roleID = message.content.match(/<@&(\d+)>/)[1];

      // Fetch the role
      this.interaction.guild.roles.fetch(roleID).then(async (role) => {
        if (this.action === 'create') {
          if (!this.outputData) {
            this.outputData = [];
          }

          this.outputData.push({
            id: null,
            channelID: null,
            messageID: null,
            embed: this.outputEmbed
          });

          return await this.embedRoleInputEmoji();
        } else {
          return await this.embedRoleInput();
        }
      }).catch(async (error) => {
        await this.updateReply({
          title: 'Whoops!',
          description: 'You must ping a valid role!\n\nYou can also say "cancel" to cancel this action'
        });

        return await this.embedRoleInputPing(false);
      });
    });
  }
};
