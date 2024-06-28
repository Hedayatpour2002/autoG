import fs from "fs";
import inquirer from "inquirer";
const prompt = inquirer.createPromptModule();

const question = [
  {
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
  },
];

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
  const accounts = await fs.readFileSync("./assets/warpAccounts.json");
  return JSON.parse(accounts);
}

async function autoG() {
  const { needWarpAccount } = await prompt(question);
  needWarpAccount && (await createWarpAccounts(2));

  let accounts;
  try {
    accounts = await readWarpAccounts();
    console.log(accounts);
  } catch {
    await createWarpAccounts(2);
    accounts = await readWarpAccounts();
    console.log(accounts);
  }
}
autoG();
