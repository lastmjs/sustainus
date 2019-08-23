import { ethers } from 'ethers';

// TODO I would like to explicitly say window...so I would have to extend the window type somehow
const networkName: EthereumNetworkName = process.env.NODE_ENV === 'development' ? 'ropsten' : 'homestead';

export const ethersProvider = ethers.getDefaultProvider(networkName);
