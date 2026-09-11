import fs from "fs";
import _ from "lodash";
import Logger from "./lib/logger.ts";

const logger = Logger("env");

//load env
if (fs.existsSync(".env")){
    try {
        process.loadEnvFile();
    } catch(err){
        logger.error("Failed read .env, details:", err);
    }
}

if (_.isNil(process.env.TOKEN_BOT)){
    logger.error("Missing token bot");
    process.exit(1);
}

if (_.isNil(process.env.USERNAME_BOT)){
    logger.error("Missing username bot");
    process.exit(1);
}

//-- BOT --
export const TOKEN_BOT = process.env.TOKEN_BOT;
export const USERNAME_BOT = process.env.USERNAME_BOT;

//-- MONGO --
export const URL_MONGO = process.env.URL_MONGO || "mongodb://127.0.0.1:27017/guards_for_bikers";

// -- VERSION DB --
export const VERSION_CURRENT_DB = 3;

// -- CRON --
export const CRON_WEATHER = process.env.CRON_WEATHER || "0 * * * *"; //every hour;
export const CRON_EVENT = process.env.CRON_EVENT || "*/5 * * * *"; //Every 5 minutes


// -- CACHE USERS --
export const USERS_EXPIRE_SECONDS = parseInt(process.env.USERS_EXPIRE_SECONDS || "") || 10800; //3 hours;

// -- CACHE POLLS --
export const POLLS_CACHE_EXPIRE = parseInt(process.env.POLLS_CACHE_EXPIRE || "") || 3900; //1 hour and 5 minutes;
export const POLLS_CACHE_CHECK_PERIOD = parseInt(process.env.POLLS_CACHE_CHECK_PERIOD || "") || 300; //5 minutes;

// -- SETTINGS POLLS --
export const EVENT_EXPIRE_QUESTION_SECONDS = parseInt(process.env.EVENT_EXPIRE_QUESTION_SECONDS || "") || 3600 * 2; //2 hour
export const POLL_EXPIRE_ACTION_SECONDS = parseInt(process.env.POLL_EXPIRE_ACTION_SECONDS || "") || 3600 * 2; //2 hour
export const POLLS_EXPIRE_IMPOSTOR_SECONDS = parseInt(process.env.POLLS_EXPIRE_IMPOSTOR_SECONDS || "") || 3600 * 10; //10 hour

// -- API WEATHER --
export const MAX_RETRY_COUNT = parseInt(process.env.MAX_RETRY_COUNT || "") || 10;