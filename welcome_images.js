const fs = require("fs");
const Canvas = require("canvas");
const { MessageAttachment } = require("discord.js");

module.exports = {
    async sendWelcomeImage(context, isTest=false) {
        // Check if the context is even the right server
        const GUILD_ID = process.env.GUILD_ID;
        if (context.guild.id != GUILD_ID) return;

        // Gte all welcome images
        let welcomeImages = fs.readdirSync("./data/images/welcome_images").filter(file => file.endsWith(".png"));
        
        // Create a new canvas and load a random welcome image
        const canvas = Canvas.createCanvas(700, 250);
        const imageContext = canvas.getContext("2d");
        const welcomeImage = await Canvas.loadImage("./data/images/welcome_images/" + welcomeImages[Math.floor(Math.random() * welcomeImages.length)]);

        // Define function for applying text
        const applyText = ({canvas, text, x, y, color="#ffffff", defaultSize=70}) => {
            const context = canvas.getContext("2d");

            do {
                context.font = `${defaultSize -= 10}px sans-serif`;
            }
            while (context.measureText(text).width > canvas.width - (x + 20));

            context.fillStyle = color;
            context.fillText(text, x, y);
        }

        // Draw the welcome image
        let width = welcomeImage.width;
        let height = welcomeImage.height;
        while (width - 10 > canvas.width) {
            width -= 10;
            height -= (45 / 8);
        }

        imageContext.drawImage(welcomeImage, 0, 0, width, height);

        // Draw a transparent black rectangle
        imageContext.fillStyle = "rgba(0, 0, 0, 0.5)";
        imageContext.fillRect(10, 10, canvas.width - 20, canvas.height - 20);

        applyText({
            canvas: canvas,
            text: "Welcome, " + (isTest ? context.author.username : context.username) + "!",
            x: 240,
            y: canvas.height / 2.1
        });

        let pfp;

        // Get the users profile picture
        if (isTest) {
            pfp = await Canvas.loadImage(await context.author.avatarURL({ format: "png", size: 256 }));
        }
        else {
            pfp = await Canvas.loadImage(await context.avatarURL({ format: "png", size: 256 }));
        }

        // Draw a clipping mask for the pfp
        imageContext.beginPath();
        imageContext.arc(125, 125, 100, 0, Math.PI * 2);
        imageContext.closePath();
        imageContext.clip();

        // Draw the pfp
        imageContext.drawImage(pfp, 25, 25, 200, 200);

        // Turn the canvas into an attachment
        const attachment = new MessageAttachment(canvas.toBuffer(), "welcome-image.png");

        // Send the attachment
        if (!isTest) {
            context.guild.systemChannel.send({ files: [attachment] });
        }
        else {
            context.reply({ files: [attachment] });
        }
    }
}