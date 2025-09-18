import {join} from 'path';
import {importFiles} from './utils/dynamicImport';

// Import Models
console.log('|||||||||||| Import Models ||||||||||||');
const mainModelsPath = join(__dirname, 'models');
importFiles(mainModelsPath);

// Import Main Modules
console.log('|||||||||||| Import Modules ||||||||||||');
const mainModulesPath = join(__dirname, 'modules');
importFiles(mainModulesPath);

// console.log('|||||||||||| Import LiveQuery Handlers ||||||||||||');
// const liveQueryPath = join(__dirname, 'modules/LiveQuery');
// importFiles(liveQueryPath);
console.log('---main.js File Initialized---');
