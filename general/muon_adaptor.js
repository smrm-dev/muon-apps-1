const { Web3 } = MuonAppUtils

const CHAINS = {
    mainnet: 1,
    fantom: 250,
    polygon: 137,
    bsc: 56,
    avax: 43114,
}

const networksWeb3 = {
    [CHAINS.mainnet]: new Web3("https://rpc.ankr.com/eth"),
    [CHAINS.fantom]: new Web3("https://rpc.ankr.com/fantom"),
    [CHAINS.polygon]: new Web3("https://rpc.ankr.com/polygon"),
    [CHAINS.bsc]: new Web3("https://rpc.ankr.com/bsc"),
    [CHAINS.avax]: new Web3("https://rpc.ankr.com/avalanche"),
}

const MuonAdaptorApp = {
    APP_NAME: 'muon_adaptor',

    makeEthGetBlockRequest: function (id, blockNumber) {
        return {
            jsonrpc: '2.0',
            id,
            method: 'eth_getBlockByNumber',
            params: ['0x' + blockNumber.toString(16), false]
        }

    },

    makeBatchRequest: async function (w3, requests) {
        let batch = new w3.BatchRequest();

        requests.forEach((request) => batch.add(request.req))
        const responses = await batch.execute()

        let results = new Array(requests.length)
        for (let res of responses) {
            results[res.id] = requests[res.id].decoder(res.result)
        }

        return results
    },

    getBlocksHashes: async function (chainId, blockNumbers) {
        let requests = []
        blockNumbers.forEach(
            (index, blockNumber) => {
                requests.push({
                    req: this.makeEthGetBlockRequest(blockNumber, index),
                    decoder: (res => res.hash),
                })
            },
        )
        const w3 = networksWeb3[chainId]
        const hashes = await this.makeBatchRequest(w3, requests)
        return hashes
    },

    onRequest: async function (request) {
        let { method, data: { params } } = request;
        switch (method) {
            case 'blocks-hashes':
                let {
                    chainId,
                    blockNumbers,
                } = params

                blockNumbers = JSON.parse(blockNumbers)

                const hashes = await this.getBlocksHashes(chainId, blockNumbers)

                return {
                    chainId,
                    blockNumbers,
                    hashes,
                }
            default:
                throw { message: `invalid method ${method}` }
        }
    },

    signParams: function (request, result) {
        switch (request.method) {
            case 'blocks-hashes': {

                let {
                    chainId,
                    blockNumbers,
                    hashes,
                } = result

                return [
                    { type: 'uint256', value: chainId },
                    { type: 'uint256[]', value: blockNumbers },
                    { type: 'bytes32[]', value: hashes },
                    { type: 'uint256', value: request.data.timestamp },
                ]
            }

            default:
                throw { message: `Unknown method: ${request.method}` }
        }
    }
}

module.exports = MuonAdaptorApp
