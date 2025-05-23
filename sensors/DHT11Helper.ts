/**
 * Grove Temperature & Humidity Sensor (DHT11Helper) support by @nullptr, 2025.5.19
 */

namespace grove {

    export namespace sensors {

        export class DHT11Helper {

            private signalPin: DigitalPin;
            private serialLogging: boolean = false;

            private lastSampleTime: number = 0;

            private _humidity: number = NaN;
            private _temperature: number = NaN;

            private static INIT_WAIT_TIME_MS: number = 1000;
            private static RESAMPLE_WAIT_TIME_MS: number = 2000;

            private static TEMP_MIN: number = 0;
            private static TEMP_MAX: number = 50;

            constructor(signalPin: DigitalPin, serialLogging: boolean = false) {
                this.signalPin = signalPin;
                this.serialLogging = serialLogging;

                this.lastSampleTime = input.runningTime();
            }

            private LOG(message: string) {
                if (this.serialLogging) {
                    serial.writeLine(message);
                }
            }

            get humidity(): number {
                return this._humidity;
            }

            get temperature(): number {
                return this._temperature;
            }

            public readSensorData(forceRead: boolean = false): boolean {
                if (!forceRead) {
                    const currentTime = input.runningTime();
                    const isInit = isNaN(this._humidity) || isNaN(this._temperature);
                    const timeToWait = (isInit ? DHT11Helper.INIT_WAIT_TIME_MS : DHT11Helper.RESAMPLE_WAIT_TIME_MS) - (currentTime - this.lastSampleTime);
                    if (timeToWait > 0) {
                        if (!isInit) {
                            this.LOG("Use cached DHT11Helper data, request new after " + timeToWait + "ms");
                            return true;
                        }
                        this.LOG(`Waiting for ${timeToWait}ms before reading sensor data.`);
                        basic.pause(timeToWait);
                    }
                    this.lastSampleTime = currentTime;
                }

                this.LOG("Calling DHT11Helper internal driver...");

                const resultBuffer: Buffer = grove.sensors.DHT11InternalRead(this.signalPin);

                if (this.serialLogging) {
                    const bufferLength = resultBuffer.length;
                    serial.writeLine("DHT11Helper result buffer length: " + bufferLength.toString());
                    serial.writeString("DHT11Helper result buffer: ");
                    for (let i = 0; i < bufferLength; ++i) {
                        const byte = resultBuffer.getNumber(NumberFormat.Int8LE, i);
                        serial.writeString(byte.toString() + " ");
                    }
                    serial.writeLine("");
                }

                if (resultBuffer.length != 8) {
                    this.LOG("DHT11Helper result buffer length error: " + resultBuffer.length.toString());
                    return false;
                }

                const returnCode = resultBuffer[2];
                if (returnCode != 0) {
                    switch (returnCode) {
                        case 1:
                            this.LOG("DHT11Helper sensor not connected on pin " + this.signalPin.toString());
                            break;
                        case 1 << 1:
                            this.LOG("DHT11Helper wait ack low init timeout");
                            break;
                        case 1 << 2:
                            this.LOG("DHT11Helper wait ack low timeout");
                            break;
                        case 1 << 3:
                            this.LOG("DHT11Helper wait ack high timeout");
                            break;
                        case 1 << 4:
                            this.LOG("DHT11Helper wait data high timeout");
                            break;
                        case 1 << 5:
                            this.LOG("DHT11Helper wait data low timeout");
                            break;
                        case 1 << 6:
                            this.LOG("DHT11Helper checksum error");
                            break;
                        default:
                            this.LOG("DHT11Helper unknown error: " + returnCode.toString());
                            break;
                    }
                    return false;
                }

                const humidityHigh = resultBuffer.getNumber(NumberFormat.Int8LE, 4);
                const humidityLow = resultBuffer.getNumber(NumberFormat.Int8LE, 5);
                const temperatureHigh = resultBuffer.getNumber(NumberFormat.Int8LE, 6);
                const temperatureLow = resultBuffer.getNumber(NumberFormat.Int8LE, 7);

                this._humidity = humidityHigh + (humidityLow * 0.01);
                this._temperature = temperatureHigh + (temperatureLow * 0.01);
                this._temperature = Math.max(DHT11Helper.TEMP_MIN, Math.min(DHT11Helper.TEMP_MAX, this._temperature));

                this.LOG("DHT11Helper humidity: " + this._humidity.toString());
                this.LOG("DHT11Helper temperature: " + this._temperature.toString());

                return true;
            }

        };

    }

}
