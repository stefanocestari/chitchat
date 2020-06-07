import { writeFile } from 'fs';

require('dotenv').config();

const environment = process.env.ENVIRONMENT;
let apiURL;

if (environment === 'production') {
  apiURL = process.env.PRODUCTION_API_ENDPOINT;
} else if (environment === 'test') {
 apiURL = process.env.TEST_API_ENDPOINT;
}
const targetPath = `./src/environments/environment.prod.ts`;
const envConfigFile = `
    export const environment = { 
        production: true, 
        apiUrl: '${apiURL}'};
`

writeFile(targetPath, envConfigFile, function (err) {
  if (err) { 
       console.log(err);
    };
})