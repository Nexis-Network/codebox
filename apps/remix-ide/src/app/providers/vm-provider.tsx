import React from 'react' // eslint-disable-line
import * as packageJson from '../../../../../package.json'
import { JsonDataRequest, RejectRequest, SuccessRequest } from '../providers/abstract-provider'
import { Plugin } from '@remixproject/engine'
import { IProvider } from './abstract-provider'

export class BasicVMProvider extends Plugin implements IProvider {
  blockchain
  fork: string
  options: {[id: string]: any} = {}
  constructor(profile, blockchain) {
    super(profile)
    this.blockchain = blockchain
    this.fork = ''
  }

  async init(): Promise<{[id: string]: any}> {
    return {}
  }

  body(): JSX.Element {
    return <div></div>
  }

  sendAsync(data: JsonDataRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sendAsyncInternal(data, resolve, reject)
    })
  }

  private async sendAsyncInternal(data: JsonDataRequest, resolve: SuccessRequest, reject: RejectRequest): Promise<void> {
    try {
      await this.blockchain.providers.vm.provider.sendAsync(data, (error, result) => {
        if (error) return reject(error)
        else {
          resolve({ jsonrpc: '2.0', result, id: data.id })
        }
      })
    } catch (error) {
      reject(error)
    }
  }
}

export class MergeVMProvider extends BasicVMProvider {
  constructor(blockchain) {
    super(
      {
        name: 'vm-paris',
        displayName: 'CodeBox VM (Paris)',
        kind: 'provider',
        description: 'CodeBox VM (Paris)',
        methods: ['sendAsync', 'init'],
        version: packageJson.version
      },
      blockchain
    )
    this.blockchain = blockchain
    this.fork = 'paris'
  }
}

export class LondonVMProvider extends BasicVMProvider {
  constructor(blockchain) {
    super(
      {
        name: 'vm-london',
        displayName: 'CodeBox VM (London)',
        kind: 'provider',
        description: 'CodeBox VM (London)',
        methods: ['sendAsync', 'init'],
        version: packageJson.version
      },
      blockchain
    )
    this.blockchain = blockchain
    this.fork = 'london'
  }
}

export class BerlinVMProvider extends BasicVMProvider {
  constructor(blockchain) {
    super(
      {
        name: 'vm-berlin',
        displayName: 'CodeBox VM (Berlin)',
        kind: 'provider',
        description: 'CodeBox VM (Berlin)',
        methods: ['sendAsync', 'init'],
        version: packageJson.version
      },
      blockchain
    )
    this.blockchain = blockchain
    this.fork = 'berlin'
  }
}

export class ShanghaiVMProvider extends BasicVMProvider {
  constructor(blockchain) {
    super(
      {
        name: 'vm-shanghai',
        displayName: 'CodeBox VM (Shanghai)',
        kind: 'provider',
        description: 'CodeBox VM (Shanghai)',
        methods: ['sendAsync', 'init'],
        version: packageJson.version
      },
      blockchain
    )
    this.blockchain = blockchain
    this.fork = 'shanghai'
  }
}

export class CancunVMProvider extends BasicVMProvider {
  constructor(blockchain) {
    super(
      {
        name: 'vm-cancun',
        displayName: 'CodeBox VM (Cancun)',
        kind: 'provider',
        description: 'CodeBox VM (Cancun)',
        methods: ['sendAsync', 'init'],
        version: packageJson.version
      },
      blockchain
    )
    this.blockchain = blockchain
    this.fork = 'cancun'
  }
}
