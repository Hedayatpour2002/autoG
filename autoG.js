import fs from "fs/promises";
import fetch from "node-fetch";
import ping from "ping";
import clipboardy from "clipboardy";
import inquirer from "inquirer";

const prompt = inquirer.createPromptModule();

const question = {
  type: "list",
  message: "Do you need new warp account ?",
  name: "needWarpAccount",
  choices: [
    { name: "NO", value: false },
    { name: "YES", value: true },
  ],
};

const warpAccountsFilePath = "./assets/warpAccounts.json";
const configStructureFilePath = "./assets/structure.json";
const configFilePath = "./assets/config.json";

async function createWarpAccounts(count) {
  const accounts = [];
  try {
    for (let i = 0; i < count; i++) {
      try {
        const req = await fetch(
          "https://api.zeroteam.top/warp?format=sing-box"
        );
        if (!req.ok) {
          throw new Error(
            `Failed to fetch Warp account (status ${req.status}).`
          );
        }
        const warpAccount = await req.json();
        accounts.push(warpAccount);
      } catch (error) {
        console.error("Error creating Warp account:", error);
        throw error;
      }
    }

    try {
      await fs.writeFile(
        warpAccountsFilePath,
        JSON.stringify(accounts),
        "utf8"
      );
      console.log("Warp accounts file created at", warpAccountsFilePath);
    } catch (error) {
      console.error("Error writing Warp accounts file:", error);
      throw error;
    }
  } catch (error) {
    console.error("Unexpected error at createWarpAccounts:", error);
    throw error;
  }
}

async function readWarpAccounts() {
  try {
    const accounts = await fs.readFile(warpAccountsFilePath, "utf-8");
    return JSON.parse(accounts);
  } catch (error) {
    console.error("Error reading Warp accounts file");
    throw error;
  }
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
  const ports = [903, 7103, 5279, 4198, 939, 928, 7156, 942, 859];

  try {
    console.log("Checking IP addresses...");
    for (let ip of ipList) {
      try {
        let res = await ping.promise.probe(ip);
        ipStats.push({
          ip: res.host,
          ping: res.avg,
          port: ports[Math.floor(Math.random() * ports.length)],
        });
      } catch (error) {
        console.error(`Error pinging IP ${ip}:`, error);
        throw error;
      }
    }

    ipStats.sort((a, b) => Number(a.ping) - Number(b.ping));
    return ipStats;
  } catch (error) {
    console.error("Unexpected error in checkIpPerformance:", error);
    throw error;
  }
}

async function readConfigStructure() {
  try {
    const configStructure = await fs.readFile(configStructureFilePath, "utf-8");
    return JSON.parse(configStructure);
  } catch (error) {
    console.error("Error reading config structure file:", error);
    throw error;
  }
}

async function createConfigFile(config) {
  try {
    await fs.writeFile(configFilePath, JSON.stringify(config), "utf-8");
    console.log("Config file created at", configFilePath);
  } catch (error) {
    console.error("Error writing config file:", error);
    throw error;
  }
}

async function autoG() {
  try {
    const { needWarpAccount } = await prompt(question);
    if (needWarpAccount) {
      await createWarpAccounts(2);
    }

    let accounts;
    try {
      accounts = await readWarpAccounts();
    } catch (error) {
      console.log("attempting to recreate warp accounts ...");
      await createWarpAccounts(2);
      accounts = await readWarpAccounts();
    }

    const ipList = generateIPList();
    const ipStats = await checkIpPerformance(ipList);

    if (Number(ipStats[0].ping)) {
      console.log(
        `Clean IP found: ${ipStats[0].ip}:${ipStats[0].port} ==> ping: ${ipStats[0].ping}`
      );

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

      await createConfigFile(config);
      await clipboardy.write(JSON.stringify(config));
      console.log("Config copied to clipboard.");
    } else {
      console.error(
        "No clean IP found. Please disable any proxy or VPN and try again."
      );
    }
  } catch (error) {
    console.error("Unexpected error in autoG:", error);
  }
}
autoG();
