import { MAX_RETRY_COUNT } from "../../env.ts";

import _ from "lodash";
import { DateTime } from "luxon";

import Logger from "../../lib/logger.ts";
import graphUtils from "../../utils/graphUtils.ts";
import { IGroup } from "../../domains/interfaces/IGroup.ts";
import { IForecast } from "../../domains/interfaces/api/IForecast.ts";
import { WeatherRepository } from "../repository/weatherRepository.ts";

const logger = Logger("weather-service");

export class WeatherService {
    private weatherRepository = new WeatherRepository();

    async get(group: Pick<IGroup, "start_time_guardian" | "end_time_guardian" | "timezone" | "latitude" | "longitude" | "id">): Promise<{ weather: IForecast, image: Buffer }> {
        let weather: IForecast | null = null;

        let retry = 0;
        let error = false;
        do {
            if (retry >= MAX_RETRY_COUNT){
                break;
            }

            if (error){
                retry++;
                logger.warn(`I'll try again for the ${MAX_RETRY_COUNT - (retry - 1)} time for group id: ${group.id}, waiting ${retry * 5} seconds...`);
                await new Promise((resolve) => setTimeout(resolve, 5000 * retry));
            }
            
            try {
                weather = await this.weatherRepository.get(group.latitude, group.longitude);
            } catch(err){
                logger.error(`Error get weather for group id: ${group.id}, details:`, err);
                error = true;
                continue;
            }

            error = false;
        } while ( error );

        if (_.isNil(weather)){
            throw new Error("Impossible get information weather, it's aborted operation for group id: " + group.id);
        }

        //create message
        let onlyTime: string;
        const dataTypeWeather: string[] = [];
        const listTimeBlacklist: number[] = [];

        let time: string | undefined, prec: number | undefined, rain: number | undefined;
        for (let i = 0; i < weather.hourly.time.length; i++) {

            time = weather.hourly.time[i];
            rain = weather.hourly.rain[i];
            prec = weather.hourly.precipitation_probability[i];

            if (_.isNil(time) || _.isNil(rain) || _.isNil(prec)) {
                continue;
            }

            onlyTime = DateTime.fromISO(time).toFormat("HH:mm");

            if (onlyTime >= group.start_time_guardian && onlyTime <= group.end_time_guardian) {
                if (rain > 0) {
                    dataTypeWeather.push("2");
                } else if (prec > 0) {
                    dataTypeWeather.push(`1 - ${weather.hourly.precipitation_probability[i]}`);
                } else {
                    dataTypeWeather.push("0");
                }
            } else {
                listTimeBlacklist.push(i);
            }
        }

        //if user has set range custom for check weather
        _.remove(weather.hourly.time, (_, index) => listTimeBlacklist.includes(index));
        _.remove(weather.hourly.precipitation_probability, (_, index) => listTimeBlacklist.includes(index));
        _.remove(weather.hourly.rain, (_, index) => listTimeBlacklist.includes(index));
        _.remove(weather.hourly.temperature_2m, (_, index) => listTimeBlacklist.includes(index));

        const image = await graphUtils.render(600 * 4, 250 * 4, weather.hourly.time.map((time) => DateTime.fromFormat(time, "yyyy-MM-dd'T'HH:mm").setLocale(group.timezone).toISO()).filter((date) => !_.isNil(date)), weather.hourly.temperature_2m, dataTypeWeather);

        return {
            weather,
            image
        };
    }
}