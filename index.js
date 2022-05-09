const Discord = require("discord.js")
const fetch = require("node-fetch")
const keepAlive = require("./server")
const Database = require("@replit/database")
const GoogleSpreadsheet = require('google-spreadsheet')
const { promisify } = require('util')

const client_secret = process.env['client_secret.json']

const creds = client_secret
const url = process.env['url']

async function accessSpreadsheet() {
  const doc = new GoogleSpreadsheet(url)
  await promisify(doc.useServiceAccountAuth)(creds)
  const info = await promisify(doc.getInfo)()
  const sheet = info.worksheets[0]
  console.log(`Title: ${sheet.title}, Rows: ${sheet.rowCount }`)
}
accessSpreadsheet()

const erc20 = /0x+[A-F,a-f,0-9]{40}/
const client = new Discord.Client()

const db = new Database()
const sadWords = ["sad", "depressed", "unhappy", "angry"]

const starterEncouragements = [
  "Cheer up!",
  "Hang in there.",
  "You are a great person / bot!"
]

db.get("encouragements").then(encouragements => {
  if (!encouragements || encouragements.length < 1) {
    db.set("encouragements", starterEncouragements)
  }
})

db.get("responding").then(value => {
  if (value == null) {
    db.set("responding", true)
  }
})

function updateEncouragements(encouragingMessage) {
  db.get("encouragements").then(encouragements => {
    encouragements.push([encouragingMessage])
    db.set("encouragements", encouragements)
  })
}

function deleteEncouragements(index) {
  db.get("encouragements").then(encouragements => {
    if (encouragements.length > index) {
      encouragements.splice(index, 1)
      db.set("encouragements", encouragements)
    }
  })
}

function getQuote() {
  return fetch("https://zenquotes.io/api/random")
    .then(res => {
      return res.json()
    })
    .then(data => {
      return data[0]["q"] + " -" + data[0]["a"]
    })
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on("message", msg => {
  if (msg.author.bot) return
  if (msg.content === "$inspire") {
    getQuote().then(quote => msg.channel.send(quote))
  }
  if (msg.content === "ping") {
    msg.reply("pong")
  }
  db.get("responding").then(responding => {
    if (responding && sadWords.some(word => msg.content.includes(word))) {
      db.get("encouragements").then(encouragements => {
        const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)]
        msg.reply(encouragement)
      })
    }
  })
  
  if (msg.content.startsWith("$new")) {
    encouragingMessage = msg.content.split("$new ")[1]
    updateEncouragements(encouragingMessage)
    msg.channel.send("New encouraging message added.")
  }
  if (msg.content.startsWith("$del")) {
    index = parseInt(msg.content.split("$del ")[1])
    deleteEncouragements(index)
    msg.channel.send("Encouraging message deleted.")
  }
  if (msg.content.startsWith("$list")) {
    db.get("encouragements").then(encouragements => {
      msg.channel.send(encouragements)
    })
  }
  if (msg.content.startsWith("$responding")) {
    value = msg.content.split("$responding ")[1]
    if (value.toLowerCase() == "true") {
      db.set("responding", true)
      msg.channel.send("Responding is on.")
    } else {
      db.set("responding", false)
      msg.channel.send("Responding is off.")
    }
  }

  if (msg.content.startsWith("$addrole")) {
    let role = msg.mentions.roles.first()
    if(!role) return msg.reply('please mention a role!');
    //console.log(role)
    let member = msg.mentions.members.first()
    if(!member) return msg.reply('plese mention a user!')
    //console.log(member)
    member.roles.add(role).catch(console.error)
    return msg.channel.send(
      new Discord.MessageEmbed()
        .setColor('RANDOM')
        .setDescription(`Added the role ${role} to ${member.user.username}`)
    )
  }

  
  if (msg.content.search(erc20) == -1) {
    //console.log(`Not found.`,msg.content)
  } else {
    console.log(`Found:`,msg.content)
    try {
      msg.delete()
      msg.channel.send("Please don't send wallet address.")
    } catch {
       console.log(`Probably permissionp problem.`)
    }
  }
})

//keepAlive()
const mySecret = process.env['TOKEN']
client.login(mySecret)