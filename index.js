const { Telegraf } = require("telegraf");
const { Extra, Markup } = Telegraf;
const Keyboard = require("telegraf-keyboard");
const Composer = require("telegraf/composer");
const session = require("telegraf/session");
const Stage = require("telegraf/stage");
const Scene = require("telegraf/scenes/base");
const WizardScene = require("telegraf/scenes/wizard");
const mysql = require("mysql");
const { leave } = Stage;

const TOKEN = "1394592988:AAEGt-VkIR1nMPXbZwTGqi22MpF8b3zipdo";

const connection = mysql.createConnection({
  host: "eu-cdbr-west-03.cleardb.net",
  user: "bbc710b34d0fae",
  password: "ad75e2aa",
  database: "heroku_960339d4edbba66",
});

const keyboard = new Keyboard();
keyboard.add("Документы").add("Контакты", "FAQ").add("Записаться на защиту");

const keyboardLeave = new Keyboard();
keyboardLeave.add("Назад");

/////////////////////////////////////////
const docs = [
  "files/Titul.docx",
  "files/Zadanie.docx",
  "files/Proektny_praktikum_Metod_ukazania_k_kursovoy_rabote.doc",
  "files/Oformlenie_otcheta_s_poyasneniami.docx",
  "files/Primer_polnogo_otcheta.pdf",
  "files/Rezenzia.docx",
];
let contactsList = [
  "Шадрин Денис Борисович - 89043673287",
  "Лисов Андрей Витальевич - 89402049343",
  "Шадрин Денис Борисович - 89043673287",
];

/////////////////////////////////////////
const documents = new Scene("documents");
documents.enter((ctx) => {
  ctx.replyWithHTML(`<b>Все нужные документы: </b>`, keyboardLeave.draw());
  docs.forEach((item) => {
    ctx.replyWithDocument({ source: `${item}` });
  });
});
documents.leave((ctx) => ctx.reply("Выбери, что нужно: ", keyboard.draw()));
documents.hears("Назад", leave());

const contacts = new Scene("contacts");
contacts.enter((ctx) => {
  const contactSingle = contactsList
    .map((value, index) => {
      return `\n${index + 1}. ${value}`;
    })
    .join("\n");

  ctx.replyWithHTML(
    `Все нужные контакты:\n<b>${contactSingle}</b>`,
    keyboardLeave.draw()
  );
});
contacts.leave((ctx) => ctx.reply("Выбери, что нужно: ", keyboard.draw()));
contacts.hears("Назад", leave());

const faq = new Scene("faq");
faq.enter((ctx) => {
  ctx.reply("Раздел готовится 😼", keyboardLeave.draw());
});
faq.leave((ctx) => ctx.reply("Выбери, что нужно: ", keyboard.draw()));
faq.hears("Назад", leave());

const stepHandler = new Composer();

notes = [
  {
    time: "1:24",
    message: "Нужно сделать того самое",
  },
];

stepHandler.use(async (ctx, next) => {
  setInterval(() => {
    const curDate = new Date().getHours() + ":" + new Date().getMinutes();
    if (notes[0].time == curDate) {
      ctx.reply(`${notes[0].message}`);
    }
  }, 1000);
  await next();
});

const post = new WizardScene(
  "post",
  (ctx) => {
    ctx.reply(
      "1. Выберите направление: ",
      Markup.inlineKeyboard([
        [Markup.callbackButton("application", "application")],
        [Markup.callbackButton("web", "web")],
        [Markup.callbackButton("ai/ml", "aiml")],
        [Markup.callbackButton("smm", "smm")],
      ]).extra()
    );
    ctx.wizard.next();
  },
  stepHandler.on("callback_query", (ctx) => {
    ctx.wizard.state.data = ctx.update.callback_query.data;
    ctx.wizard.next();
  }),
  (ctx) => {
    ctx.reply("2. Напишите название команды: ");
    ctx.wizard.next();
    ctx.wizard.state.flag = true;
  },
  (ctx) => {
    ctx.reply("3. Напишите желаемое время защиты (Формат - 00:00)");
    ctx.wizard.next();
    if (ctx.wizard.state.flag) {
      ctx.wizard.state.team = ctx.message.text;
    }
  },
  (ctx) => {
    ctx.wizard.state.time = ctx.message.text.replace(" ", "");

    const regexp = /\d{2}:\d{2}/;

    if (!regexp.test(ctx.wizard.state.time)) {
      ctx.reply(
        "Ошибка в формате времени 😾,\nвведите любой символ для продолжения"
      );
      ctx.wizard.back();
      ctx.wizard.state.flag = false;
    }
    // dataTime = [];
    // connection.query(
    //   "SELECT time FROM schedule WHERE data = 'aiml'",
    //   (err, res) => {
    //     if (err) throw err;

    //     res.forEach((item) => {
    //       dataTime.push(item.time.replace(":00", ""));
    //     });

    //     console.log(dataTime);
    //   }
    // );
    else {
      ctx.reply("Ответ записан!");

      connection.connect(() => {
        connection.query(
          `INSERT INTO schedule (id, team, data, time) VALUES (NULL, '${ctx.wizard.state.team}', '${ctx.wizard.state.data}', '${ctx.wizard.state.time}')`
        );
        connection.query("SET SESSION wait_timeout = 604800");
      });
      ctx.scene.leave();
      console.log(ctx.wizard.state);
    }
  }
);

/////////////////////////////////////////

const stage = new Stage();
stage.register(documents);
stage.register(contacts);
stage.register(faq);
stage.register(post);

/////////////////////////////////////////
const bot = new Telegraf(TOKEN);

bot.use(session());
bot.use(stage.middleware());
//https://53c7e39275ba.ngrok.io
require("http")
  .createServer(bot.webhookCallback("https://telegram-bot-sharaga.herokuapp.com/"))
  .listen(3000);

bot.start((ctx) =>
  ctx.reply("Привет! Я бот-помощник\nВыбери,что тебе нужно", keyboard.draw())
);
bot.hears("Документы", (ctx) => {
  ctx.scene.enter("documents");
});
bot.hears("Контакты", (ctx) => {
  ctx.scene.enter("contacts");
});
bot.hears("FAQ", (ctx) => {
  ctx.scene.enter("faq");
});
bot.hears("Записаться на защиту", (ctx) => {
  ctx.scene.enter("post");
});
bot.on("callback_query", (msg) => {
  console.log(msg);
});
bot.launch();
