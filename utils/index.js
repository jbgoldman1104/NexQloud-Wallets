const { default: axios } = require("axios");
const fs = require('fs');

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

exports.signTransaction = async (tx) => {
    try {
        
        const {from, to, data, gas, gasPrice, nonce, value} = tx;
        // console.log({
        //     data,
        //     gas,
        //     gasPrice,
        //     nonce: "0x" + nonce.toString(16),
        //     to: to.toLowerCase(),
        //     value
        // });
        const TOKEN = await this.getVaultToken();
        // console.log("TOKEN >>>", TOKEN);
        const response = await axios.post(`http://localhost:8200/v1/ethereum/accounts/${from.toLowerCase()}/sign`, 
            {
                chainId: 7002,
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


