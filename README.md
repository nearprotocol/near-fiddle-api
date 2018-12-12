# near-fiddle-api

Micro-service to save/load fiddles for [NEAR Studio](https://github.com/NEARProtocol/NEARStudio).

## Requirements 

1) Install latest Node.js LTS release.
2) Install postgres 

```
brew install postgres
```


## Run database 

```
brew services start postgresql
createuser fiddle -W  # It'll ask for password, enter "fiddle"
createdb -O fiddle fiddle_development
createdb -O fiddle fiddle_test
```

## Run the service 

```
node app.js
```