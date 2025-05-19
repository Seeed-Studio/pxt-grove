/**
 * Grove Temperature & Humidity Sensor (DHT11) support by @nullptr, 2025.5.19
 */

namespace grove {

    export namespace sensors {

        export class DHT11 {
            private lastSampleTime: number = 0;

            private signalPin: DigitalPin;
            private serialLogging: boolean = false;

            private _humidity: number = -999;
            private _temperature: number = -999;

            private static INIT_WAIT_TIME_MS: number = 1000;
            private static RESAMPLE_WAIT_TIME_MS: number = 2000;

            private static DATA_BITS: number = 40;

            private static START_SIGNAL_LOW_TIME: number = 18000;

            private static RESPONSE_START_TIMEOUT: number = 500;
            private static RESPONSE_DATA_START_TIMEOUT: number = 1000;
            private static RESPONSE_DATA_TIMEOUT: number = 200;

            private static BIT_0_TIME: number = 28;
            private static BIT_1_TIME: number = 70;


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
                    const timeToWait = ((this._humidity == -999 && this._temperature == -999) ? DHT11.INIT_WAIT_TIME_MS : DHT11.RESAMPLE_WAIT_TIME_MS) - (currentTime - this.lastSampleTime);
                    if (timeToWait > 0) {
                        this.LOG(`Waiting for ${timeToWait}ms before reading sensor data.`);
                        basic.pause(timeToWait);
                    }
                    this.lastSampleTime = currentTime;
                }

                this.LOG("Starting DHT11 read bits sequence");

                let highPulseDurations: number[] = [];
                for (let i = 0; i < DHT11.DATA_BITS; ++i) {
                    highPulseDurations.push(0);
                }


                let inTime: number = 0xFF;
                let startTime: number = 0;
                let endTime: number = 0;

                this.LOG("Send data read request to DHT11");
                pins.digitalWritePin(this.signalPin, 0);
                control.waitMicros(DHT11.START_SIGNAL_LOW_TIME);

                pins.setPull(this.signalPin, PinPullMode.PullUp);
                pins.digitalReadPin(this.signalPin);
                endTime = control.micros() + DHT11.RESPONSE_START_TIMEOUT;
                while (pins.digitalReadPin(this.signalPin) ^ 0) {
                    if (control.micros() > endTime) {
                        inTime = 0x0F00;
                        break;
                    }
                }

                endTime = control.micros() + DHT11.RESPONSE_START_TIMEOUT;
                while (pins.digitalReadPin(this.signalPin) ^ 1) {
                    if (control.micros() > endTime) {
                        inTime = 0xF000;
                        break;
                    }
                }
                endTime = control.micros() + DHT11.RESPONSE_START_TIMEOUT;
                while (pins.digitalReadPin(this.signalPin) ^ 0) {
                    if (control.micros() > endTime) {
                        inTime = 0xF000;
                        break;
                    }
                }

                for (let i = 0; i < (DHT11.DATA_BITS & inTime); ++i) {
                    endTime = control.micros() + DHT11.RESPONSE_DATA_START_TIMEOUT;
                    while (pins.digitalReadPin(this.signalPin) ^ 0) {
                        if (control.micros() > endTime) {
                            inTime = 0xFF00;
                            break;
                        }
                    }
                    endTime = control.micros() + DHT11.RESPONSE_DATA_START_TIMEOUT;
                    while (pins.digitalReadPin(this.signalPin) ^ 1) {
                        if (control.micros() > endTime) {
                            inTime = 0xFF00;
                            break;
                        }
                    }
                    startTime = control.micros();
                    endTime = startTime + DHT11.RESPONSE_DATA_TIMEOUT;
                    while (pins.digitalReadPin(this.signalPin) ^ 0) {
                        if (control.micros() > endTime) {
                            inTime = 0x0F0000;
                            break;
                        }
                    }
                    highPulseDurations[i] = control.micros() - startTime;
                }

                switch (inTime) {
                    case 0x0F00:
                        this.LOG("No response from DHT11");
                        return false;
                    case 0xF000:
                        this.LOG("Timeout waiting for DHT11 response start signal");
                        return false;
                    case 0xFF00:
                        this.LOG("Timeout waiting for DHT11 response data start signal");
                        return false;
                    case 0x0F0000:
                        this.LOG("Timeout waiting for DHT11 response data bits signal");
                        return false;
                }

                if (this.serialLogging) {
                    const durations = highPulseDurations.map((duration) => duration.toString());
                    this.LOG("DHT11 response durations: " + durations.join(", "));
                }

                let dataBits: boolean[] = [];
                for (let i = 0; i < DHT11.DATA_BITS; ++i) {
                    const lowDistance = Math.abs(highPulseDurations[i] - DHT11.BIT_0_TIME);
                    const highDistance = Math.abs(highPulseDurations[i] - DHT11.BIT_1_TIME);
                    dataBits.push(lowDistance > highDistance);
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

                const checksum = dataBytes[0] + dataBytes[1] + dataBytes[2] + dataBytes[3];
                if (checksum !== dataBytes[4]) {
                    this.LOG("DHT11 checksum error: " + checksum.toString() + " != " + dataBytes[4].toString());
                    return false;
                }

                this._humidity = dataBytes[0] + dataBytes[1] / 100.0;
                this._temperature = dataBytes[2] + dataBytes[3] / 100.0;

                this.LOG("DHT11 humidity: " + this._humidity.toString());
                this.LOG("DHT11 temperature: " + this._temperature.toString());

                return true;
            }

        };

    }

}
