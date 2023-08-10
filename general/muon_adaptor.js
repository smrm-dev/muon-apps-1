// const { soliditySha3 } = MuonAppUtils

const MuonAdaptorApp = {
    APP_NAME: 'muon_adaptor',

    getBlocksHashes: async function (chainId, blockNumbers) { },

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
