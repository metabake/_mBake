#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commandLineArgs = require("command-line-args");
const IDB_1 = require("./lib/IDB");
const FileOpsExtra_1 = require("mbake/lib/FileOpsExtra");
const IntuApp_1 = require("./IntuApp");
const AppLogic_1 = require("./lib/AppLogic");
const AppLogic_2 = require("./lib/AppLogic");
const logger = require('tracer').console();
const optionDefinitions = [
    { name: 'intu', defaultOption: true },
    { name: 'help', alias: 'h', type: Boolean },
    { name: 'version', alias: 'v', type: Boolean },
    { name: 'CRUD', alias: 'c', type: Boolean },
    { name: 'CMS', alias: 's', type: Boolean },
];
const yaml = require("js-yaml");
const fs = require("fs");
const argsParsed = commandLineArgs(optionDefinitions);
logger.trace(argsParsed);
const cwd = process.cwd();
function unzipCMS() {
    new FileOpsExtra_1.Download('CMS', cwd).autoUZ();
    console.info('Extracted an example CMS');
}
function unzipC() {
    new FileOpsExtra_1.Download('CRUD', cwd).autoUZ();
    console.info('Extracted an example CRUD app');
}
async function runISrv() {
    const ip = require('ip');
    const ipAddres = ip.address();
    const hostIP = 'http://' + ipAddres + ':';
    logger.trace("TCL: hostIP", hostIP);
    const idb = new IDB_1.IDB(process.cwd(), '/IDB.sqlite');
    const path_config = process.cwd() + '/intu-config.yaml';
    let configIntu;
    try {
        if (!fs.existsSync(path_config)) {
            logger.trace('not exists');
            let conf = {
                port: 9081,
                secret: '123456',
                appPath: process.cwd() + '/ROOT'
            };
            await fs.writeFileSync(path_config, yaml.safeDump(conf), 'utf8', (err) => {
                if (err) {
                    logger.trace(err);
                }
            });
            logger.trace('not exists');
            configIntu = await yaml.safeLoad(fs.readFileSync(path_config, 'utf8'));
        }
        else {
            logger.trace('exists');
            configIntu = await yaml.safeLoad(fs.readFileSync(path_config, 'utf8'));
        }
    }
    catch (err) {
        logger.trace('cant read the config file', err);
    }
    const port = await configIntu.port;
    const appPath = await configIntu.appPath;
    const mainEApp = new IntuApp_1.IntuApp(idb, ['*'], configIntu);
    let intuPath = AppLogic_2.Util.appPath + '/INTU';
    logger.trace(intuPath);
    const setupDone = await idb.setupIfNeeded();
    logger.trace(setupDone);
    logger.trace("TCL: runISrv -> setupDone", setupDone);
    logger.trace('normal');
    await mainEApp.start(intuPath);
    logger.trace("TCL: runISrv -> appPath", appPath);
    mainEApp.serveStatic(appPath, null, null);
    mainEApp.listen(port);
}
function help() {
    console.info();
    console.info('intu version: ' + AppLogic_1.AppLogic.veri());
    console.info();
    console.info('Usage:');
    console.info(' To run:                                                intu');
    console.info(' and then open a browser on the specified port. There is small app in ROOT');
    console.info();
    console.info('  For starter CRUD app:                                  intu -c');
    console.info('  For an example of an e-commerce (shop and ship) app:   intu -s');
}
if (argsParsed.CRUD)
    unzipC();
else if (argsParsed.help)
    help();
else if (argsParsed.version)
    help();
else if (argsParsed.CMS)
    unzipCMS();
else
    runISrv();
