import fs from "fs";
import ping from "ping";

import inquirer from "inquirer";
const prompt = inquirer.createPromptModule();

const question = {
  type: "list",
  message: "Do you need new warp account ?",
  name: "needWarpAccount",
  choices: [
    {
      name: "NO",
      value: false,
    },
    {
      name: "YES",
      value: true,
    },
  ],
};

async function createWarpAccounts(count) {
  const accounts = [];
  for (let i = 0; i < count; i++) {
    const req = await fetch("https://api.zeroteam.top/warp?format=sing-box");
    const warpAccount = await req.json();
    accounts.push(warpAccount);
  }
  fs.writeFileSync("./assets/warpAccounts.json", JSON.stringify(accounts));
}

async function readWarpAccounts() {
  const accounts = await fs.readFileSync("./assets/warpAccounts.json", "utf8");
  return JSON.parse(accounts);
}

function generateIPList() {
  const maxCount = 50;
  const temp = new Set();
  const ranges = [
    "162.159.192.",
    "162.159.193.",
    "162.159.195.",
    "162.159.204.",
    "188.114.96.",
    "188.114.97.",
    "188.114.98.",
    "188.114.99.",
  ];

  while (temp.size < maxCount) {
    ranges.forEach((range) => {
      if (temp.size < maxCount) {
        temp.add(`${range}${Math.floor(Math.random() * 256)}`);
      }
    });
  }

  const uniqueIPList = Array.from(temp);
  return uniqueIPList;
}

async function checkIpPerformance(ipList) {
  const ipStats = [];
  const ports = [903, 7103, 5279, 4198, 939, 928, 7156, 942, 859]; // :?

  for (let ip of ipList) {
    let res = await ping.promise.probe(ip);
    ipStats.push({
      ip: res.host,
      ping: res.avg,
      port: ports[Math.floor(Math.random() * ports.length)],
    });
  }

  ipStats.sort((a, b) => Number(a.ping) - Number(b.ping));

  return ipStats;
}

async function readConfigStructure() {
  const configStructure = await fs.readFileSync(
    "./assets/structure.json",
    "utf8"
  );
  return JSON.parse(configStructure);
}

async function createConfigFile(config) {
  await fs.writeFileSync("./assets/config.json", JSON.stringify(config));
}

async function autoG() {
  const { needWarpAccount } = await prompt(question);
  needWarpAccount && (await createWarpAccounts(2));

  let accounts;
  try {
    accounts = await readWarpAccounts();
  } catch {
    await createWarpAccounts(2);
    accounts = await readWarpAccounts();
  }

  const ipList = generateIPList();
  const ipStats = await checkIpPerformance(ipList);

  if (Number(ipStats[0].ping)) {
    const config = await readConfigStructure();

    config.outbounds[0].server = ipStats[0].ip;
    config.outbounds[0].server_port = ipStats[0].port;
    config.outbounds[1].server = ipStats[0].ip;
    config.outbounds[1].server_port = ipStats[0].port;

    config.outbounds[0].local_address = accounts[0].local_address;
    config.outbounds[1].local_address = accounts[1].local_address;

    config.outbounds[0].private_key = accounts[0].private_key;
    config.outbounds[1].private_key = accounts[1].private_key;

    config.outbounds[0].reserved = accounts[0].reserved;
    config.outbounds[1].reserved = accounts[1].reserved;

    createConfigFile(config);
  } else {
    throw new Error("Error: your internet is not stable");
  }
}
autoG();
