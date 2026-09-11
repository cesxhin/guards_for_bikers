import _ from "lodash";
import path from "path";
import { readFileSync } from "fs";
import "chartjs-adapter-luxon"; //after chartjs
import { loadImage, createCanvas } from "canvas";
import { Chart, Filler, LinearScale, LineController, LineElement, Plugin, PointElement, TimeScale } from "chart.js";

import Logger from "../lib/logger.ts";

Chart.register(TimeScale, LinearScale, LineController, PointElement, LineElement, Filler);
      
const SIZE_EMOJI = 72;
const SIZE_FONT = 50;

const emojiSun = await loadImage(readFileSync(path.join(path.resolve(), "assets/sunny.png")));
const emojiDroplet = await loadImage(readFileSync(path.join(path.resolve(), "assets/droplet.png")));
const emojiRain = await loadImage(readFileSync(path.join(path.resolve(), "assets/rain_cloud.png")));

Chart.defaults.animation = false;
Chart.defaults.responsive = false;

const logger = Logger("graph-utils");

const emojiPlugin: Plugin = {
    id: "emoji",
    afterDraw(chart, _args, options) {
        const ctx = chart.ctx;
        const xAxis = chart.scales["xEmoji"];

        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.font = "30px";

        if (_.isNil(xAxis)){
            return;
        }

        for (const index in xAxis.ticks) {
            const x = xAxis.getPixelForTick(Number(index));
        
            const actualWeather = options.dataWeather[index];

            if (!_.isNil(actualWeather)){
                ctx.drawImage((actualWeather.startsWith("0")? emojiSun : actualWeather.startsWith("1")? emojiDroplet : emojiRain) as any, x - (SIZE_EMOJI / 2), xAxis.top - 120, SIZE_EMOJI, SIZE_EMOJI);

                if (actualWeather.startsWith("1")){

                    const percentage = actualWeather.split("1 - ")[1];
                    ctx.fillText(`${percentage}%`, x + 2.5, xAxis.top - 10);
                }
            } else {
                logger.error("Cannot draw on chart");
            }
        }

        ctx.restore();
    }
};

const backgroundPlugin: Plugin = {
    id: "background",
    beforeDraw: (chart) => {
        const ctx = chart.canvas.getContext("2d");

        if (!_.isNil(ctx)){
            ctx.save();
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
        }
    }
};

const detectRainPlugin: Plugin = {
    id:  "detectRain",
    beforeDraw: (chart, _args, options) => {
        const ctx = chart.ctx;
        const xAxis = chart.scales["xEmoji"];
        const { top, bottom } = chart.chartArea;

        const WIDTH_ICON = 80;
        const ANGLE = 60;

        if (_.isNil(xAxis)){
            return;
        }

        for (const index in xAxis.ticks) {
            const x = xAxis.getPixelForTick(Number(index));
        
            const actualWeather = options.dataWeather[index];

            if (!_.isNil(actualWeather) && !actualWeather.startsWith("0")){

                ctx.save();
                
                ctx.strokeStyle ="rgba(0, 162, 255, 0.7)";
                ctx.lineWidth = 4;

                ctx.beginPath();
                ctx.rect(
                    x - (WIDTH_ICON / 2),
                    top,
                    WIDTH_ICON,
                    bottom - top
                );
                ctx.clip();

                for (let y = top - WIDTH_ICON; y < bottom; y += actualWeather.startsWith("1")? 40 : 20) {
                    console.log(y, bottom);
                    
                    ctx.beginPath();
                    
                    ctx.moveTo(
                        x - (WIDTH_ICON / 2),
                        y
                    );

                    ctx.lineTo(
                        x + (WIDTH_ICON / 2),
                        y + ANGLE
                    );

                    ctx.stroke();
                }

                ctx.restore();
            }

        }
    }
};

async function render(width: number, height: number, headers: (number | string)[], data: number[], dataWeather: (number | string)[]): Promise<Buffer> {
    const canvas = createCanvas(width, height);
    
    const ctx = canvas.getContext("2d");
    
    ctx.fillStyle = "red";
    ctx.imageSmoothingEnabled = true;
    ctx.quality = "best";
    ctx.font = "60px";
    
    ctx.fillRect(0, 0, 200, 200);

    //set color from temperature
    const gradient = ctx.createLinearGradient(0, height, 0, 0);

    const ranges = [
        { test: (v: number) => v <= 5, color: "rgba(0, 150, 255, 0.45)" },
        { test: (v: number) => v <= 10, color: "rgba(0, 210, 220, 0.45)" },
        { test: (v: number) => v <= 20, color: "rgba(255, 220, 80, 0.45)" },
        { test: (v: number) => v <= 30, color: "rgba(255, 140, 40, 0.45)" },
        { test: () => true, color: "rgba(240, 50, 50, 0.45)" }
    ];

    let pos = 0;

    for (const range of ranges) {
        const count = data.filter(range.test).length;

        if (count > 0) {
            pos += count / data.length;
            gradient.addColorStop(pos, range.color);
        }
    }
    
    const chart = new Chart(
        canvas as any,
        {
            type: "line",
            data: {
                datasets: [
                    {
                        data: data.map((_, index) => { return {x: headers[index], y: data[index]}; }),
                        borderColor: gradient,
                        backgroundColor: gradient,
                        borderWidth: 10,
                        fill: true
                    }, {
                        data: data.map((_, index) => { return {x: headers[index], y: data[index]}; }),
                        xAxisID: "xEmoji"
                    }
                ]
            },
            options: {
                elements: {
                    point: {
                        radius: 0,
                        hoverRadius: 0
                    },
                    line: {
                        tension: 0.4
                        
                    }
                },
                layout: {
                    padding: {
                        top: 130,
                        left: 60
                    }
                },
                plugins: {
                    //@ts-ignore
                    emoji: {
                        dataWeather
                    },
                    detectRain: {
                        dataWeather
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        type: "time",
                        grid: {
                            display: false
                        },
                        time: {
                            unit: "hour",
                            displayFormats: {
                                hour: "HH"
                            }
                        },
                        ticks: {
                            font: {
                                size: SIZE_FONT
                            }
                        }
                    },
                    xEmoji: {
                        type: "time",
                        position: "top",
                        display: false,
                        grid: {
                            drawOnChartArea: false,
                            display: false
                        },
                        time: {
                            unit: "hour",
                            displayFormats: {
                                hour: "HH"
                            }
                        },
                        ticks: {
                            font: {
                                size: SIZE_FONT
                            }
                        }
                    },
                    y: {
                        ticks: {
                            padding: 30,
                            font: {
                                size: SIZE_FONT
                            },
                            callback: (val) => (val as number).toFixed(2).padStart(5, "0") + " °C"
                        },
                        grid: {
                            display: false
                        },
                        position: "right"
                    }
                }
            },
            plugins: [emojiPlugin, backgroundPlugin, detectRainPlugin]
        }
    );

    const bufferImage = canvas.toBuffer("image/png");

    chart.destroy();

    return bufferImage;
}

export default {
    render
};