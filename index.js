const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const request = require("request-promise");

const port = 7001;

app.use(bodyParser.urlencoded({
  extended: true,
}));

app.use(bodyParser.json());

let members = {}

function makeIPv4(ip) {
  const splittedAddress = ip.split(":");
  const ipAddress = splittedAddress[splittedAddress.length - 1];
  return ipAddress;
}
function getUserIdFromIP(ipAddress) {
  const filtered = Object.keys(obj).filter(function(userId) {
    return members[userId] === ipAddress;
  });
  if (filtered.length === 0) {
    return false;
  }
  return filtered[0];
}

async function sendRequest(url, obj) {
  return await request.post({
    url: url,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(obj)
  });
}

async function joinNetwork(host, userId) {
  return await sendRequest("http://" + host + ":" + port + "/join/" + userId, {});
}

async function sendMessage(host, to, message) {
  return await sendRequest("http://" + host + ":" + port + "/send/" + to, {
    message,
  });
}
app.post("/join/:userId", (req, res) => {
  const ipAddress = makeIPv4(req.ip);
  const userId = req.params.userId;
  members[userId] = ipAddress;
});

app.post("/send/:to", (req, res) => {
  const userId = req.params.to;
  const message = req.body.message;
  const from = getUserIdFromIP(makeIPv4(req.ip));
  const to = members[userId];

  const url = "http://" + to + ":" + port + "/send";
  
  sendRequest(url, { from: from, message: message })
    .then(res => {
      res.status(200).send({ message: "OK" });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send({ message: "Failed" });
    });
});

app.post("/send", (req, res) => {
  const from = req.body.from;
  const message = req.body.message;
  console.log(from + ": " + message);
  res.status(200).send({ message: "OK" });
});

const host = process.argv[2];
const userId = process.argv[3];

const reader = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

reader.on('line', function (line) {
  const splitted = line.split(":");
  const to = splitted[0];
  const message = splitted[1];
  sendMessage(host, to, message).catch(err => {
    console.error(err);
  });
});

reader.on('close', function () {
  process.exit(0);
});

if (host) {
  (async() => {
    await joinNetwork(host, userId);
  })();
}
app.listen(parseInt(process.argv[4]));
