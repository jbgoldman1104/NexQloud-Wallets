require('dotenv').config({path: '.env'});
const { getVaultToken, generateWallet, sendCoins, sendNXQs } = require('./utils');
const fs = require('fs');
const { Web3, HttpProvider } = require("web3");
const { isAddress } = require("web3-validator")

const web3 = new Web3(new HttpProvider(process.env.RPC_URL));

require('dotenv').config({path: '.env'});

const generateWallets = async ( count ) => {
  const TOKEN = await getVaultToken();
  
  if ( TOKEN ) {
    for ( let i = 0; i < count; i++ ) {
      const address = await generateWallet(TOKEN);
      console.log(`${i+1} --> ${address}`);
    }
  }
  
}

const readWallets = () => {
  const wallets = fs.readFileSync(`./${process.env.WALLET_FILE}`).toString();
  
  return wallets.split('\n');
}

const disperseBNB = async (from, wallets, eachAmount, TOKEN) => {
  try {
    
    console.log('Amount >> ', eachAmount);

    for ( let i = 0 ; i < wallets.length; i++ ) {
      console.log('Wallet ', i);
      await sendCoins(from, wallets[i], eachAmount, TOKEN);
    }
  } catch ( error ) {
    console.log(error);
  }
}

const disperseNXQ = async (from, wallets, eachAmount, TOKEN) => {
  try {
    
    console.log('Amount >> ', eachAmount);

    for ( let i = 0 ; i < wallets.length; i++ ) {
      console.log('Wallet ', i, wallets[i]);
      const amount = getRandomInteger( 1, eachAmount)
      const result = await sendNXQs(from, wallets[i], amount * 10**15, TOKEN);
      if ( result == false ) {
        await sleep(300);
        continue;
      }
      await sleep(getRandomInteger(3600, 7200));
    }
  } catch ( error ) {
    console.log(error);
  }
}

function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


const bnbBallance = 120 * 10 ** 16;
const eachbnbAmount = Math.floor(Number(bnbBallance) / 400);

const eachNxqAmount = 10;

const run_random_disperse = async() => {
  const wallets = readWallets();
  const TOKEN = await getVaultToken();
  const idxs = new Array(400).fill(0);
  // await disperseBNB(process.env.MAINTENANCE_WALLET, wallets.slice(10, 400), eachbnbAmount, TOKEN)
  // await disperseNXQ(process.env.MAINTENANCE_WALLET, wallets.slice(1, 400), eachNxqAmount, TOKEN)

  while ( true ) {
    let selectedId = -1;
    for ( let tries = 5; tries > 0 ; tries-- ) {
      const id = getRandomInteger(0, 399);
      if ( idxs[id] < 9 ) {
        selectedId = id;
        break;
      }
    }

    if ( selectedId == -1 ) {
      for ( selectedId = 0; selectedId < 400; selectedId++ ) {
        if (idxs[selectedId] < 9) {
          break;
        }
      }
    }

    if ( selectedId == 400 ) {
      break;
    }

    const targetId = 400 + selectedId * 9 + idxs[selectedId];
    console.log(`SelectedId ${selectedId}, Target = ${targetId}, wallet = ${wallets[targetId]}`);

    idxs[selectedId]++;

    await disperseNXQ(wallets[selectedId], wallets.slice(targetId, targetId + 1), eachNxqAmount, TOKEN)
    await sleep(getRandomInteger(3600, 7200));
  }
}

const run_random_transfer = async() => {
  const wallets = readWallets();
  const TOKEN = await getVaultToken();
  const eachNxqAmount = 10;
  for (let tries = 0; tries < 8000; tries ++) {
    let f_id = getRandomInteger(0, 399);
    let t_id = getRandomInteger(400, 3999);

    console.log(`Transfer from ${f_id}:${wallets[f_id]}, to = ${t_id}:${wallets[t_id]}`);

    await disperseNXQ(wallets[f_id], wallets.slice(t_id, t_id + 1), eachNxqAmount, TOKEN)
    await sleep(getRandomInteger(3600, 7200));
  }
}

const run_simple_disperse = async() => {
  const wallets = readWallets();
  const TOKEN = await getVaultToken();
  const eachNxqAmount = 500;
  await disperseNXQ(process.env.MAINTENANCE_WALLET, wallets.slice(8, 400), eachNxqAmount, TOKEN)
}



run_random_transfer().then(()=>{}).catch(error=>{});


// generateWallets(3990).then(()=>{

// }).catch(error => {

// })



