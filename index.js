const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config();

const client = new Client();
let maxMessages = 10;
let messageCount = 0;
let upgradeKeys = {
  student: {
    price: 10,
    maxMessages: 10000,
    codes: ['STU12345678', '1234STU5678', 'STUqwertyui', 'ASDFGHSTUJKL', 'STU78901234']
  },
  business: {
    price: 20,
    maxMessages: 10000000,
    codes: ['BIZ12345678', '1234BIZ5678', 'BIZqwertyui', 'ASDFGHBIZJKL', 'BIZ78901234']
  },
  family: {
    price: 30,
    maxMessages: 100000000000,
    codes: ['FAM12345678', '1234FAM5678', 'FAMqwertyui', 'ASDFGHFAMJKL', 'FAM78901234']
  }
};
let usedUpgradeKeys = [];

let maxMessageExpiration = null;
let userName = {}; // store user's name

client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.initialize();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

client.on('message', async (message) => {
    console.log(message.body);
    
    // check if the user has sent a message before
    if (!userName[message.from]) {
        const chat = await message.getChat();
        const user = await chat.getContact();
        userName[message.from] = user.name;
        message.reply(`Welcome to  *WandaBot* by *Mr Ngwang* , \n ${user.name}! \n\n please enter *155# or #123# to check menu thanks.`);
        return;
    }
    if(message.body.startsWith("#")) {
        runCompletion(message.body.substring(1)).then(result => message.reply(result));
    }
    // check if the message is an upgrade code
    if (message.body.startsWith('!upgrade')) {
        const code = message.body.split(' ')[1];
        let validUpgrade = false;
        let tire;
        for (let [key, value] of Object.entries(upgradeKeys)) {
          if (value.codes.includes(code) && !usedUpgradeKeys.includes(code)) {
            tire = key;
            validUpgrade = true;
            break;
          }
        }
        if (validUpgrade) {
          const  { price, maxMessages: upgradedMaxMessages } = upgradeKeys[tire];
          message.reply(`Upgrade to ${tire} tire was successful for $${price}. Thanks for using WandaBot`);
          messageCount = 0;
          maxMessages =  upgradedMaxMessages;
          usedUpgradeKeys.push(code);
          if (usedUpgradeKeys.length > 5) {
            usedUpgradeKeys.shift();
          }
          maxMessageExpiration = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
        } else if (usedUpgradeKeys.includes(code)) {
            message.reply('This upgrade key has already been used. Please try again with a new one.');
        } else {
            message.reply('Invalid upgrade code. Please try again. or contact https://wa.link/36rm4p for new subscription');
        }
        return;
    }
    
    // check message count
    if (++messageCount > maxMessages) {
        if (maxMessageExpiration && Date.now() < maxMessageExpiration) {
            message.reply(`You have exceeded the maximum number of messages for the free plan!. Please upgrade to continue. Send !upgrade {upgrade code}`);
        } else {
            message.reply('Upgrade has expired. Please upgrade again to continue. Send \n\n !upgrade {upgrade code}');
        }
        return; 
    }
    //checking is the user want to see menu
    if (message.body.toLowerCase().includes('*155#') || message.body.toLowerCase().includes('#123#')) {
        message.reply('*_Welcome to WandaBot_* \n you can use WandaBot to do the following: \n ✅ Auto reply to messages in chats and groups \n ✅ Generate AI written content(essays,...) \n ✅ Solve maths question \n ✅ Answer MCQ Queestions \n ✅ Help in idea suggestions\n you are most welcome to our srevice!\n ✅ `*123*1#` {check the number of messages left in free plan\n ✅ Input *!list* to display the various plans avialable for upgrade');
        return;
    }
    // check if the message is asking for the bot's name
    if (message.body.toLowerCase().includes('what\'s your name') || message.body.toLowerCase().includes('your name?')) {
        message.reply('My name is *WandaBot* By *Mr Ngwang* . Nice to meet you!');
        return;
    }
    if (message.body.toLowerCase().includes('*123*1#')) {
        message.reply(`You had  max of *${maxMessages}!* messages but Currently you have a max of  *-${++messageCount}* messages \n\n You can upgrade your plan to have more messages! by just using the upgrade code {!upgrade}`);
        return;
    }
    if (message.body.toLowerCase().includes('!list')) {
        message.reply(` *Various plans* \n\n ✅ *_Student_* \n *Price:* *$${upgradeKeys.student.price}* \n *Max Messages:* *${upgradeKeys.student.maxMessages}* \n\n ✅ *_Business_* \n *Price:* *$${upgradeKeys.business.price}* \n *Max Messages:* *${upgradeKeys.business.maxMessages}* \n\n ✅ *_Family_* \n *Price:* *$${upgradeKeys.family.price}* \n *Max Messages:* *${upgradeKeys.family.maxMessages}*  \n\n *Go for a higher plan for more accuracy and more number of messages per month* \n\n *Note:* If your 1 month of activation is over and you still have some messages to be sent, it will be wiped and you need to buy a new plan*`);
        return;
    }
    // check if the message is asking who created the bot
    if (message.body.toLowerCase().includes('who created you') || message.body.toLowerCase().includes('who made you')) {
        message.reply('I was created by  *Mr Ngwang* , a  researcher  in artificial intelligence. You can learn more about him by chatting with him  here: https://wa.link/36rm4p');
        return;
    }
});
    // send message to OpenAI
    async function runCompletion (message) {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                {"role": "system", "content": "Your name is WandaBot, A polite helpful assistant. When asked who designed you, you say that you were designed by https://wa.link/36rm4p"},
                {"role": "user", "content": "Am sorry if i did not answer you, you can try again please"},
                {"role": "assistant", "content": "Am sorry if i did not answer you, you can try again please"},
                {"role": "user", "content": "Am sorry if i did not answer you, you can try again please"},
                {"role": "user", "content": message},
            ],
            max_tokens: 300,
        });
        return completion.data.choices[0].message.content;
}