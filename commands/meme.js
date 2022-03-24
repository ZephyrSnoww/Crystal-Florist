const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageAttachment } = require('discord.js');
const helpers = require('../helpers');
const sizeOf = require('image-size');
const Canvas = require('canvas');
const fs = require('fs');

const validImageFiles_ = fs.readdirSync('./data/images/memes').filter(file => file.endsWith('.png'));
const validImageNames_ = [];

for (const imageFileName_ of validImageFiles_) {
  validImageNames_.push(imageFileName_.split('.')[0]);
}

const validImages_ = [];

for (const imageName_ of validImageNames_) {
  validImages_.push([imageName_, imageName_.toLowerCase()]);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Create a meme!')
    .addStringOption(option => option
      .setName('template')
      .setDescription('The template to use')
      .setRequired(true)
      .addChoices(validImages_))
    .addStringOption(option => option
      .setName('text')
      .setDescription('The custom text to use')
      .setRequired(true)),

  imageData: {
    and_you_kill_him: {
      x: 210,
      y: 540,
      maxWidth: 500,
      wrapText: false,
      textColor: '#ffffff'
    },
    tony_stark: {
      x: 550,
      y: 215,
      maxWidth: 500,
      wrapText: true,
      textColor: '#000000'
    }
  },

  async execute (interaction) {
    const template = interaction.options.getString('template');
    let text = interaction.options.getString('text');
    const data = this.imageData[template];

    const x = data.x;
    let y = data.y;
    const maxWidth = data.maxWidth;
    const wrapText = data.wrapText;
    const textColor = data.textColor;

    const getLines = ({ canvas, text, maxWidth, defaultSize = 50 }) => {
      const ctx = canvas.getContext('2d');
      const words = text.split(' ');
      const lines = [];
      let currentLine = words[0];

      ctx.font = `${defaultSize}px sans-serif`;

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        if (width < maxWidth) {
          currentLine += ' ' + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    const applyText = ({ canvas, text, x, y, color = '#ffffff', defaultSize = 70, maxWidth = canvas.width }) => {
      const context = canvas.getContext('2d');

      do {
        context.font = `${defaultSize -= 10}px sans-serif`;
      }
      while (context.measureText(text).width > maxWidth);

      context.fillStyle = color;
      context.fillText(text, x, y);
    };

    sizeOf(`./data/images/memes/${template}.png`, async (err, dimensions) => {
      const canvas = Canvas.createCanvas(dimensions.width, dimensions.height);
      const imageContext = canvas.getContext('2d');
      const templateImage = await Canvas.loadImage(`./data/images/memes/${template}.png`);

      const templateWidth = templateImage.width;
      const templateHeight = templateImage.height;

      imageContext.drawImage(templateImage, 0, 0, templateWidth, templateHeight);

      if (wrapText) {
        text = getLines({
          canvas,
          text,
          maxWidth
        }).join('\n');

        console.log(imageContext.measureText(text));
        y -= imageContext.measureText(text).actualBoundingBoxDescent / 2;
      }

      console.log(text);
      console.log(templateWidth);
      console.log(templateHeight);
      console.log(x);
      console.log(y);
      console.log(maxWidth);

      applyText({
        canvas,
        text,
        x,
        y,
        maxWidth,
        color: textColor
      });

      const attachment = new MessageAttachment(canvas.toBuffer(), 'meme.png');

      interaction.reply({
        files: [attachment]
      });
    });

    // const validImageFiles = fs.readdirSync("./data/images/memes").filter(file => file.endsWith(".png"));
    // const validImageNames = validImageFiles.forEach(file => file.split(".")[0]);

    // interaction.reply({
    //     embeds: [
    //         helpers.createEmbed({
    //             title: "Pong!",
    //             description: pingResponses[Math.floor(Math.random() * pingResponses.length)],
    //             author: interaction.user
    //         })
    //     ]
    // });

    // console.log(`${interaction.user.username} pinged the bot!`);
  }
};
