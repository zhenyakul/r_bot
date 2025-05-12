import { Bot, Context, session, SessionFlavor, InputFile } from "grammy";
import {
  conversations,
  createConversation,
  ConversationFlavor,
  Conversation,
} from "@grammyjs/conversations";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Check if BOT_TOKEN exists
if (!process.env.BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not set in environment variables");
}

// Define the session data structure
interface SessionData {
  name?: string;
  amount?: string;
  time?: string;
}

// Define the bot context type
type BotContext = Context & SessionFlavor<SessionData> & ConversationFlavor;

// Create bot instance
const bot = new Bot<BotContext>(process.env.BOT_TOKEN);

// Add session middleware
bot.use(session({ initial: () => ({}) }));

// Add conversations middleware
bot.use(conversations());

// Function to run Python script
async function runPythonScript(
  name: string,
  amount: string,
  time: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [
      path.join(__dirname, "..", "Script", "receipt.py"),
      name,
      amount,
      time,
    ]);

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        resolve(
          path.join(__dirname, "..", "Script", "check_with_name_shifted_v4.png")
        );
      } else {
        reject(new Error(`Python script exited with code ${code}`));
      }
    });
  });
}

// Create conversation for collecting data
const receiptConversation = async (
  conversation: Conversation<BotContext>,
  ctx: BotContext
) => {
  // Ask for name
  await ctx.reply("Please enter the name:");
  const nameCtx = await conversation.wait();
  const name = nameCtx.message?.text || "";

  // Ask for amount
  await ctx.reply("Please enter the amount (e.g., '238 000 ₽'):");
  const amountCtx = await conversation.wait();
  const amount = amountCtx.message?.text || "";

  // Ask for time
  await ctx.reply("Please enter the time (e.g., '20:10'):");
  const timeCtx = await conversation.wait();
  const time = timeCtx.message?.text || "";

  // Process the data
  try {
    await ctx.reply("Generating receipt...");
    const imagePath = await runPythonScript(name, amount, time);

    // Send the generated image
    await ctx.replyWithPhoto(new InputFile(fs.createReadStream(imagePath)));
    await ctx.reply("Receipt generated successfully!");
  } catch (error) {
    await ctx.reply("Error generating receipt. Please try again.");
    console.error(error);
  }
};

// Register the conversation
bot.use(createConversation(receiptConversation));

// Command to start the conversation
bot.command("start", async (ctx) => {
  await ctx.conversation.enter("receipt");
});

// Add error handler
bot.catch((err) => {
  console.error("Bot error:", err);
});

// Start the bot
bot.start();
