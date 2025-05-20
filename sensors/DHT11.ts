/**
 * Grove Temperature & Humidity Sensor (DHT11) support by @nullptr, 2025.5.19
 */

namespace grove {

    export namespace sensors {

        export class DHT11 {
            private lastSampleTime: number = 0;
            private ticksPerMicro: number = 1;

            private signalPin: DigitalPin;
            private serialLogging: boolean = false;

            private _humidity: number = NaN;
            private _temperature: number = NaN;

            private static INIT_WAIT_TIME_MS: number = 1000;
            private static RESAMPLE_WAIT_TIME_MS: number = 2000;

            private static TICKS_PROBE_TIMES: number = 50;

            private static DATA_BITS: number = 40;

            private static PULL_DELAY_TIME: number = 1000;
            private static START_SIGNAL_LOW_TIME: number = 20000;

            private static RESPONSE_START_TIMEOUT: number = 160;
            private static RESPONSE_DATA_START_TIMEOUT: number = 100;
            private static RESPONSE_DATA_TIMEOUT: number = 140;

            private static TEMP_MIN: number = 0;
            private static TEMP_MAX: number = 50;

            constructor(signalPin: DigitalPin, serialLogging: boolean = false) {
                this.signalPin = signalPin;
                this.serialLogging = serialLogging;

                this.lastSampleTime = input.runningTime();
                this.measureTicksPerMicro();
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

            private waitPulseIn(xorLevel: number, maxTicks: number): number {
                let ticks: number = 0;
                while (pins.digitalReadPin(this.signalPin) ^ xorLevel) {
                    if (++ticks > maxTicks) {
                        return NaN;
                    }
                }
                return ticks;
            }

            private microsToTicks(micros: number): number {
                return micros * this.ticksPerMicro;
            }

            private measureTicksPerMicro(): boolean {
                pins.setPull(this.signalPin, PinPullMode.PullUp);
                const startTime: number = control.micros();
                this.waitPulseIn(2, this.microsToTicks(DHT11.TICKS_PROBE_TIMES));
                const endTime: number = control.micros();
                const ticksPerMicro = DHT11.TICKS_PROBE_TIMES / (endTime - startTime);
                if (ticksPerMicro > 0) {
                    this.LOG("Measured ticks per microsecond: " + ticksPerMicro.toString());
                    this.ticksPerMicro = ticksPerMicro;
                    return true;
                } else {
                    this.LOG("Failed to measure ticks per microsecond, using default value: " + this.ticksPerMicro.toString());
                    return false;
                }
            }

            public readSensorData(forceRead: boolean = false): boolean {
                if (!forceRead) {
                    const currentTime = input.runningTime();
                    const isInit = isNaN(this._humidity) || isNaN(this._temperature);
                    const timeToWait = (isInit ? DHT11.INIT_WAIT_TIME_MS : DHT11.RESAMPLE_WAIT_TIME_MS) - (currentTime - this.lastSampleTime);
                    if (timeToWait > 0) {
                        if (!isInit) {
                            this.LOG("Use cached DHT11 data, request new after " + timeToWait + "ms");
                            return true;
                        }
                        this.LOG(`Waiting for ${timeToWait}ms before reading sensor data.`);
                        basic.pause(timeToWait);
                    }
                    this.lastSampleTime = currentTime;
                }

                this.LOG("Starting DHT11 read bits sequence");

                this.measureTicksPerMicro();

                let lowPulseTicks: number[] = [];
                for (let i = 0; i < DHT11.DATA_BITS; ++i) {
                    lowPulseTicks.push(0);
                }
                let highPulseTicks: number[] = [];
                for (let i = 0; i < DHT11.DATA_BITS; ++i) {
                    highPulseTicks.push(0);
                }

                this.LOG("Send data read request to DHT11");

                {
                    const responseStartTimeout: number = this.microsToTicks(DHT11.RESPONSE_START_TIMEOUT);
                    const responseDataStartTimeout: number = this.microsToTicks(DHT11.RESPONSE_DATA_START_TIMEOUT);
                    const responseDataTimeout: number = this.microsToTicks(DHT11.RESPONSE_DATA_TIMEOUT);

                    pins.setPull(this.signalPin, PinPullMode.PullUp);
                    control.waitMicros(DHT11.PULL_DELAY_TIME);

                    pins.digitalWritePin(this.signalPin, 0);
                    control.waitMicros(DHT11.START_SIGNAL_LOW_TIME);

                    pins.setPull(this.signalPin, PinPullMode.PullUp);
                    if (isNaN(this.waitPulseIn(0, responseStartTimeout))) {
                        this.LOG("No response from DHT11");
                        return false;
                    }
                    if (isNaN(this.waitPulseIn(1, responseStartTimeout))) {
                        this.LOG("Timeout waiting for DHT11 response start signal");
                        return false;
                    }
                    if (isNaN(this.waitPulseIn(0, responseStartTimeout))) {
                        this.LOG("Timeout waiting for DHT11 response start signal");
                        return false;
                    }

                    for (let i = 0; i < DHT11.DATA_BITS; ++i) {
                        lowPulseTicks[i] = this.waitPulseIn(1, responseDataStartTimeout);
                        highPulseTicks[i] = this.waitPulseIn(0, responseDataTimeout);
                    }
                }

                if (this.serialLogging) {
                    const lowTicks = lowPulseTicks.map((duration) => duration.toString());
                    this.LOG("DHT11 response low ticks: " + lowTicks.join(", "));
                    const highTicks = highPulseTicks.map((duration) => duration.toString());
                    this.LOG("DHT11 response high ticks: " + highTicks.join(", "));
                }

                let dataBits: boolean[] = [];
                for (let i = 0; i < DHT11.DATA_BITS; ++i) {
                    const low: number = lowPulseTicks[i];
                    const high: number = highPulseTicks[i];
                    if (isNaN(low)) {
                        this.LOG("Timeout waiting for DHT11 response bits low signal");
                    }
                    if (isNaN(high)) {
                        this.LOG("Timeout waiting for DHT11 response bits high signal");
                    }

                    if (low <= high) {
                        dataBits.push(true);
                    } else {
                        dataBits.push(false);
                    }
                }

                if (this.serialLogging) {
                    const bits = dataBits.map((bit) => (bit ? "1" : "0"));
                    this.LOG("DHT11 data bits: " + bits.join(", "));
                }

                const nBytes = Math.floor(DHT11.DATA_BITS / 8);
                let dataBytes: number[] = [];
                for (let i = 0; i < nBytes; ++i) {
                    let byte = 0;
                    for (let j = 0; j < 8; ++j) {
                        byte <<= 1;
                        byte |= dataBits[i * 8 + j] ? 1 : 0;
                    }
                    dataBytes.push(byte);
                }

                if (this.serialLogging) {
                    const bytes = dataBytes.map((byte) => byte.toString());
                    this.LOG("DHT11 data bytes: " + bytes.join(", "));
                }

                if (dataBytes.length < 5) {
                    this.LOG("DHT11 data bytes length is less than 5");
                    return false;
                }

                const checksum = (dataBytes[0] + dataBytes[1] + dataBytes[2] + dataBytes[3]) & 0xFF;
                if (checksum != dataBytes[4]) {
                    this.LOG("DHT11 checksum error: " + checksum.toString() + " != " + dataBytes[4].toString());
                    return false;
                }

                this._humidity = dataBytes[0] + dataBytes[1] * 0.01;
                this._temperature = dataBytes[2] + dataBytes[3] * 0.01;
                this._temperature = Math.max(DHT11.TEMP_MIN, Math.min(DHT11.TEMP_MAX, this._temperature));

                this.LOG("DHT11 humidity: " + this._humidity.toString());
                this.LOG("DHT11 temperature: " + this._temperature.toString());

                return true;
            }

        };

    }

}
