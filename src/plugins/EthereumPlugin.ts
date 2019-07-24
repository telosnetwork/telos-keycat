import Web3 from 'web3'
import { BlockchainPlugin } from './Plugin.interface'
import { errors } from 'consts/errors'

interface IEthereumConfig {
  name: string
  provider: string
}

class EthereumPlugin extends BlockchainPlugin {
  private provider: any

  constructor(private config: IEthereumConfig) {
    super()

    const { rpcUrl } = this.config
    const url = new URL(rpcUrl)
    this.provider = new Web3(url)
  }

  public getWallet = password => {
    try {
      return this.provider.eth.accounts.privateKeyToAccount(password)
    } catch (err) {
      throw errors.signin(m => m.InvalidPassword)
    }
  }

  public signin = async ({ account, password }) => {
    this.getWallet(password)
    return {
      address: account,
      blockchain: 'ethereum',
    }
  }

  public register = this.signin

  public transact = async payload => {
    const signedTransaction = await this.signTransaction(payload)
    try {
      const { wait, ...result } = await this.provider.sendTransaction(signedTransaction)
      return result
    } catch (err) {
      throw err
    }
  }

  public signTransaction = async ({ password, params }) => {
    const wallet = this.getWallet(password)
    const { from: _from, gas: _gas, ...transaction } = params[0]
    const sig = await wallet.sign(transaction)

    return sig
  }

  public signArbitraryData = ({ password, params }) => {
    const wallet = this.getWallet(password)
    return wallet.signMessage(params[0])
  }
}

export default EthereumPlugin
