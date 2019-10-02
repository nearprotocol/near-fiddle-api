# near-fiddle-api

 ![Build Status](https://gitlab.com/near-protocol/near-fiddle-api/badges/staging/pipeline.svg)

Micro-service to save/load fiddles for [NEAR Studio](https://github.com/NEARProtocol/NEARStudio).

## Environment Variables
This micro-service depends on the following environment variables:
* `APP_URL` -- default `https://app.near.ai`;
* `CONTRACT_HELPER_URL` -- default `https://studio.nearprotocol.com/contract-api`;
* `NODE_URL` -- default `https://studio.nearprotocol.com/devnet`;
* `WALLET_URL` -- default `https://wallet.nearprotocol.com`;

The above variables define the URLs used by the web apps from withing the browser so they should always correspond to
public IP or DNS name.

* `NODE_ENV` -- default `production`;
* `PORT` -- default `3000`;

## Local Development
### Requirements 

1) Install latest Node.js LTS release.
2) Install postgres 

```
brew install postgres
```

### Run database 

```
brew services start postgresql
createuser fiddle -W  # It'll ask for password, enter "fiddle"
createdb -O fiddle fiddle
createdb -O fiddle fiddle_test
```

### Build and run the service 

```
npm install
node app.js
```
