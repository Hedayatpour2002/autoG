async function createWarpAccount(count) {
  const accounts = [];
  for (let i = 0; i < count; i++) {
    const req = await fetch("https://api.zeroteam.top/warp?format=sing-box");
    const warpAccount = await req.json();
    accounts.push(warpAccount);
  }
  return accounts;
}
