const { default: axios } = require("axios");
const fs = require('fs');

const { Web3, HttpProvider } = require("web3");
const web3 = new Web3(new HttpProvider(process.env.RPC_URL));
const NXQToken_ABI = require('../abi/NXQToken.json');
const nxqContract = new web3.eth.Contract(NXQToken_ABI, process.env.NXQ_CONTRACT_ADDRESS);

exports.getVaultToken = async () => {
    try {
        const response = await axios.post(`http://127.0.0.1:8200/v1/auth/userpass/login/${process.env.VAULT_USER}`, 
            {
                password: process.env.VAULT_PASSWORD
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        ); 

        if (response?.data?.auth?.client_token) {
            // console.log(response.data);
            return response?.data?.auth?.client_token;
        } else {
            return null;
        }
    } catch (error) {
        console.log(error);
        return null;
    }
}

exports.signTransaction = async (tx, TOKEN) => {
    try {
        
        const {from, to, data, gas, gasPrice, nonce, value} = tx;

        console.log(tx, TOKEN, process.env.CHAIN_ID);
        const response = await axios.post(`http://localhost:8200/v1/ethereum/accounts/${from.toLowerCase()}/sign`, 
            {
                chainId: process.env.CHAIN_ID,
                data : data ? data : "0x00",
                gas,
                gasPrice,
                nonce: "0x" + nonce.toString(16),
                to: to.toLowerCase(),
                value
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer  ${TOKEN}`,
                }
            }
        ); 

        if (response?.data?.data?.signed_transaction) {
            console.log("Transaction >>>", response?.data?.data);
            return response?.data?.data;
        } else {
            return null;
        }
    } catch (error) {
        // console.log(error);
        return null;
    }
}

exports.generateWallet = async (TOKEN) => {
    try {
        const response = await axios.post(`http://localhost:8200/v1/ethereum/accounts`, { }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer  ${TOKEN}`,
                }
            }
        ); 
        // console.log('response >>> ', response)
        if (response?.data?.data?.address) {
            // console.log("Transaction >>>", response?.data?.data);
            // return response?.data?.data?.address;
            const address = response?.data?.data?.address;
            fs.appendFileSync(`./${process.env.WALLET_FILE}`, address + "\n");
            return address;
        } else {
            return null;
        }
    } catch (error) {
        // console.log(error);
        return null;
    }
}

exports.sendCoins = async(account, to, amount, TOKEN) => {
    try {
      const nonce = await web3.eth.getTransactionCount(account, 'latest');
      const gasAmount = await web3.eth.estimateGas({
        from: account,
        to: to,
        value: amount,
        data: "0x00"
      });
  
      console.log('sendCoins gasAmount >>> ', gasAmount);
  
      const signedTx = await this.signTransaction({
        from: account,
        to: to,
        value: amount,
        gas: Number(gasAmount),
        gasPrice: 1000000000,
        data: "0x00",
        nonce: nonce
      }, TOKEN);
  
      if (!signedTx) {
        console.log('Sign Transaction: Failed');
        return false;
      }
  
      const tx = await web3.eth.sendSignedTransaction(signedTx.signed_transaction);

      console.log('Send Coins Tx Hash: ', tx.transactionHash);
  
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  }

exports.sendNXQs = async(account, to, amount, TOKEN) => {
    try {

    //   const balance = Number(await nxqContract.methods.balanceOf(to).call());  
    //   if ( balance > 0 ) {
    //     console.log('SKIP >> ', to, balance);        
    //     return false;
    //   }
      const nonce = await web3.eth.getTransactionCount(account, 'latest');
      const gasAmount = await nxqContract.methods.transfer(to, amount).estimateGas({ from: account });
      
      console.log('sendNXQs gasAmount >>> ', gasAmount);

      let data = await nxqContract.methods.transfer(to, amount).encodeABI();
  
      const signedTx = await this.signTransaction({
        from: account,
        to: process.env.NXQ_CONTRACT_ADDRESS,
        gas: Number(gasAmount),
        gasPrice: 1000000000,
        data,
        nonce: nonce
      }, TOKEN);
  
      if (!signedTx) {
        return false;
      }
  
      let tx = await web3.eth.sendSignedTransaction(signedTx.signed_transaction);

      console.log('Send NXQs Tx Hash: ', tx.transactionHash);
  
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
}

