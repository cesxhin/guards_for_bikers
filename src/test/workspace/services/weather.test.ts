import axios from "axios";
import { expect, it, vi, describe } from "vitest";

import { IForecast } from "../../../domains/interfaces/api/IForecast.ts";
import { WeatherService } from "../../../applications/services/weatherService.ts";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

describe("location-serivce", () => {
    const weatherService = new WeatherService();

    describe("method: exist", () => {
        it("find weather ", async () => {
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    hourly: {
                        precipitation_probability: [],
                        rain: [],
                        temperature_2m: [],
                        time: []
                    }
                } satisfies IForecast
            });

            await expect(weatherService.get({latitude: 0, longitude: 0, start_time_guardian: "00:00", end_time_guardian: "23:59", timezone: "", id: 1})).resolves.toBeDefined();
        });

        it("not found weather", async () => {
            mockedAxios.get.mockRejectedValue({
                response: {
                    status: 404
                }
            });

            await expect(weatherService.get({latitude: 0, longitude: 0, start_time_guardian: "00:00", end_time_guardian: "23:59", timezone: "", id: 1})).rejects.toThrow();
        });
    });
});