const { getVaultToken, generateWallet } = require('./utils');

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


generateWallets(3990).then(()=>{

}).catch(error => {

})



