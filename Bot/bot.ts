import {
  Bot,
  Context,
  session,
  SessionFlavor,
  InputFile,
  Keyboard,
  InlineKeyboard,
} from "grammy";
import {
  conversations,
  createConversation,
  ConversationFlavor,
  Conversation,
} from "@grammyjs/conversations";
import * as fs from "fs";
import * as dotenv from "dotenv";
import { SberbankReceipt } from "./services/sberbankReceipt";
import { SberbankBillReceipt } from "./services/sberbankBillReceipt";

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

// Initialize receipt generators
const sberbankReceipt = new SberbankReceipt();
const sberbankBillReceipt = new SberbankBillReceipt();

// Add session middleware
bot.use(session({ initial: () => ({}) }));

// Add conversations middleware
bot.use(conversations());

// Create main menu keyboard
function createMainMenu() {
  return new Keyboard()
    .text("Сбербанк")
    .text("Тинькофф")
    .row()
    .text("Мой баланс")
    .resized();
}

// Create Sberbank balance options inline keyboard
function createSberbankMenu() {
  return new InlineKeyboard()
    .text("Баланс(Главная)", "sber_main")
    .text("Баланс(Карта)", "sber_card")
    .row()
    .text("Баланс(Платежный счет)", "sber_payment")
    .text("Перевод выполнен", "sber_receipt_1");
}

// Create Tinkoff balance options inline keyboard
function createTinkoffMenu() {
  return new InlineKeyboard()
    .text("Баланс(Главная)", "tinkoff_main")
    .text("Баланс(Карта)", "tinkoff_card")
    .row()
    .text("Баланс(Платежный счет)", "tinkoff_payment")
    .text("Перевод выполнен", "tinkoff_receipt_1");
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
    const imagePaths = await sberbankReceipt.generateReceipt({
      name,
      amount,
      time,
    });

    // Send both light and dark versions
    for (const imagePath of imagePaths) {
      await ctx.replyWithPhoto(new InputFile(fs.createReadStream(imagePath)));
    }

    await ctx.reply("Receipt generated successfully!", {
      reply_markup: createMainMenu(),
    });
  } catch (error) {
    await ctx.reply("Error generating receipt. Please try again.");
    console.error(error);
  }
};

// Register the conversation
bot.use(createConversation(receiptConversation));

// Create conversation for collecting bill data
const billReceiptConversation = async (
  conversation: Conversation<BotContext>,
  ctx: BotContext
) => {
  // Ask for amount
  await ctx.reply("Введите сумму (например, '75 000 ₽'):");
  const amountCtx = await conversation.wait();
  const amount = amountCtx.message?.text || "";

  // Ask for time
  await ctx.reply("Введите время (например, '15:30'):");
  const timeCtx = await conversation.wait();
  const time = timeCtx.message?.text || "";

  // Ask for amount_decimal
  await ctx.reply("Введите копейки (например, '50'):");
  const amount_decimalCtx = await conversation.wait();
  const amount_decimal = amount_decimalCtx.message?.text || "";

  // Ask for value_420
  await ctx.reply("Введите значение 420 (например, '420,52'):");
  const value_420Ctx = await conversation.wait();
  const value_420 = value_420Ctx.message?.text || "";

  // Ask for value_1234
  await ctx.reply("Введите значение 1234 (например, '5678'):");
  const value_1234Ctx = await conversation.wait();
  const value_1234 = value_1234Ctx.message?.text || "";

  // Ask for value_9876
  await ctx.reply("Введите значение 9876 (например, '4321'):");
  const value_9876Ctx = await conversation.wait();
  const value_9876 = value_9876Ctx.message?.text || "";

  // Ask for value_10000
  await ctx.reply("Введите значение 10000 (например, '15 000'):");
  const value_10000Ctx = await conversation.wait();
  const value_10000 = value_10000Ctx.message?.text || "";

  // Process the data
  try {
    await ctx.reply("Генерация чеков...");
    const imagePaths = await sberbankBillReceipt.generateBillReceipt({
      amount,
      time,
      amount_decimal,
      value_420,
      value_1234,
      value_9876,
      value_10000,
    });

    // Send both light and dark versions
    for (const imagePath of imagePaths) {
      await ctx.replyWithPhoto(new InputFile(fs.createReadStream(imagePath)));
    }
    await ctx.reply("Чеки успешно сгенерированы!", {
      reply_markup: createSberbankMenu(),
    });
  } catch (error) {
    console.error("Ошибка при генерации чеков:", error);
    await ctx.reply(
      "Ошибка при генерации чеков. Пожалуйста, попробуйте снова.",
      {
        reply_markup: createSberbankMenu(),
      }
    );
  }
};

// Register the conversation
bot.use(createConversation(billReceiptConversation));

// Command to start the bot and show main menu
bot.command("start", async (ctx) => {
  await ctx.reply("Welcome! Please select an option:", {
    reply_markup: createMainMenu(),
  });
});

// Handle main menu clicks
bot.hears("Сбербанк", async (ctx) => {
  await ctx.reply("Выберите тип изображения:", {
    reply_markup: createSberbankMenu(),
  });
});

bot.hears("Тинькофф", async (ctx) => {
  await ctx.reply("Выберите тип изображения:", {
    reply_markup: createTinkoffMenu(),
  });
});

// Handle Sberbank balance options
bot.callbackQuery("sber_main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter("billReceiptConversation");
});

bot.callbackQuery("sber_card", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    "Сбербанк (Карта):\nБаланс: 15,000 ₽\nНомер карты: **** 5678",
    {
      reply_markup: createSberbankMenu(),
    }
  );
});

bot.callbackQuery("sber_receipt_1", async (ctx) => {
  await ctx.conversation.enter("receiptConversation");
});

// Handle Tinkoff balance options
bot.callbackQuery("tinkoff_main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    "Тинькофф (Главная):\nБаланс: 45,000 ₽\nНомер счета: **** 2345",
    {
      reply_markup: createTinkoffMenu(),
    }
  );
});

bot.callbackQuery("tinkoff_card", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    "Тинькофф (Карта):\nБаланс: 5,000 ₽\nНомер карты: **** 6789",
    {
      reply_markup: createTinkoffMenu(),
    }
  );
});

bot.callbackQuery("tinkoff_payment", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    "Тинькофф (Платежный счет):\nБаланс: 8,000 ₽\nНомер счета: **** 3456",
    {
      reply_markup: createTinkoffMenu(),
    }
  );
});

// Add error handler
bot.catch((err) => {
  console.error("Bot error:", err);
});

// Start the bot
bot.start();
