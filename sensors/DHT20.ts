namespace grove {
    export namespace sensors {

        export class DHT20 {
            private i2cAddr: number;
            private loggingToSerial: boolean;
            private lastSyncTime: number;

            private _humidity: number;
            private _temperature: number;


            public constructor(address: number = 0x38, loggingToSerial: boolean = false) {
                this.i2cAddr = address;
                this.loggingToSerial = loggingToSerial;
                this.lastSyncTime = 0;

                this._humidity = NaN;
                this._temperature = NaN;
            }

            private LOG(msg: string): void {
                if (this.loggingToSerial) {
                    serial.writeLine(msg);
                }
            }

            public isConnected(): boolean {
                let buf = pins.createBuffer(1);
                buf.setNumber(NumberFormat.UInt8LE, 0, 0);
                return pins.i2cWriteBuffer(this.i2cAddr, buf, false) == 0;
            }

            public connect(): boolean {
                if (!this.isConnected()) {
                    this.LOG("DHT20: Not connected");
                    return false;
                }

                this.LOG("DHT20: Connected");
                return true;
            }

            private status(): number {
                return pins.i2cReadNumber(this.i2cAddr, NumberFormat.UInt8LE, false);
            }

            private reset(): boolean {
                const reset_register = (reg: number): boolean => {
                    let buf = pins.createBuffer(3);
                    buf.setNumber(NumberFormat.UInt8LE, 0, reg);
                    buf.setNumber(NumberFormat.UInt8LE, 1, 0x00);
                    buf.setNumber(NumberFormat.UInt8LE, 2, 0x00);
                    let res = pins.i2cWriteBuffer(this.i2cAddr, buf, false);
                    if (res != 0) {
                        this.LOG("DHT20: reset register " + reg.toString() + " write failed");
                        return false;
                    }
                    control.waitMicros(5000);

                    buf = pins.i2cReadBuffer(this.i2cAddr, 3, false);
                    if (!buf || buf.length != 3) {
                        this.LOG("DHT20: reset register " + reg.toString() + " read failed");
                        return false;
                    }
                    let reply = pins.createBuffer(3);
                    reply.setNumber(NumberFormat.UInt8LE, 0, 0xB0 | reg);
                    reply.setNumber(NumberFormat.UInt8LE, 1, buf.getNumber(NumberFormat.UInt8LE, 1));
                    reply.setNumber(NumberFormat.UInt8LE, 2, buf.getNumber(NumberFormat.UInt8LE, 2));

                    control.waitMicros(10000);
                    res = pins.i2cWriteBuffer(this.i2cAddr, reply, false);
                    if (res != 0) {
                        this.LOG("DHT20: reset register write failed");
                        return false;
                    }
                    control.waitMicros(5000);

                    return true;
                };

                if ((this.status() & 0x18) != 0x18) {
                    if (!reset_register(0x1B) || !reset_register(0x1C) || !reset_register(0x1E)) {
                        this.LOG("DHT20: Reset failed");
                    } else {
                        control.waitMicros(10000);
                    }
                } else {
                    this.LOG("DHT20: Already reset");
                }
                return true;
            }

            private request(): boolean {
                if (!this.reset()) {
                    return false;
                }

                let buf = pins.createBuffer(3);
                buf.setNumber(NumberFormat.UInt8LE, 0, 0xAC);
                buf.setNumber(NumberFormat.UInt8LE, 1, 0x33);
                buf.setNumber(NumberFormat.UInt8LE, 2, 0x00);
                let res = pins.i2cWriteBuffer(this.i2cAddr, buf, false);
                if (res != 0) {
                    this.LOG("DHT20: Request write failed");
                    return false;
                }

                return true;
            }

            private read(): boolean {
                if (!this.request()) {
                    return false;
                }

                const start = control.millis();
                while ((this.status() & 0x80) == 0x80) {
                    if (control.millis() - start > 1000) {
                        this.LOG("DHT20: read timeout");
                        return false;
                    }
                    control.waitMicros(10000);
                }

                let buf = pins.i2cReadBuffer(this.i2cAddr, 7, false);
                if (!buf || buf.length != 7) {
                    this.LOG("DHT20: read failed, buffer length: " + buf.length.toString());
                    return false;
                }

                const crc8 = (data: Buffer, length: number): number => {
                    let crc = 0xFF;
                    for (let i = 0; i < length; ++i) {
                        crc ^= data.getNumber(NumberFormat.UInt8LE, i);
                        for (let j = 0; j < 8; ++j) {
                            if (crc & 0x80) {
                                crc = (crc << 1) ^ 0x31;
                            } else {
                                crc <<= 1;
                            }
                        }
                    }
                    return crc & 0xFF;
                }

                const sta = buf.getNumber(NumberFormat.UInt8LE, 0);
                this.LOG("DHT20: Status: " + sta.toString());

                const crc = buf.getNumber(NumberFormat.UInt8LE, 6);
                const crcCheck = crc8(buf, 6);
                if (crc != crcCheck) {
                    this.LOG("DHT20: CRC check failed, expected: " + crcCheck.toString() + ", got: " + crc.toString());
                    return false;
                }

                let raw = buf.getNumber(NumberFormat.UInt8LE, 1) << 8;
                raw |= buf.getNumber(NumberFormat.UInt8LE, 2);
                raw <<= 4;
                raw |= (buf.getNumber(NumberFormat.UInt8LE, 3) & 0xF0);

                this._humidity = (raw * 100) / Math.pow(2, 20);
                this.LOG("DHT20: Humidity: " + this._humidity.toString());

                raw = (buf.getNumber(NumberFormat.UInt8LE, 3) & 0x0F) << 8;
                raw |= buf.getNumber(NumberFormat.UInt8LE, 4);
                raw <<= 8;
                raw |= buf.getNumber(NumberFormat.UInt8LE, 5);
                this._temperature = ((raw * 200) / Math.pow(2, 20)) - 50;
                this.LOG("DHT20: Temperature: " + this._temperature.toString());

                return true;
            }

            public readSensorData(forceRead: boolean = false, retryTimes: number = 3, retryDelayMs: number = 2000): boolean {
                if (!forceRead) {
                    const currentTime = input.runningTime();
                    const isInit = isNaN(this._humidity) || isNaN(this._temperature);
                    const timeToWait = (isInit ? 2000 : 1000) - (currentTime - this.lastSyncTime);
                    if (timeToWait > 0) {
                        if (!isInit) {
                            this.LOG("Use cached DHT20 data, request new after " + timeToWait + "ms");
                            return true;
                        }
                        this.LOG(`Waiting for ${timeToWait}ms before reading sensor data.`);
                        basic.pause(timeToWait);
                    }
                    this.lastSyncTime = currentTime;
                }

                let retryCount = 0;
                while (true) {
                    if (retryCount > retryTimes) {
                        this.LOG("DHT20 read failed after " + retryCount.toString() + " tries, max " + retryTimes.toString());
                        break;
                    }
                    ++retryCount;

                    if (this.read()) {
                        return true;
                    } else {
                        this.LOG("DHT20 read failed, retrying...");
                        basic.pause(retryDelayMs);
                    }
                }

                return false;
            }

            public get humidity(): number {
                return this._humidity;
            }

            public get temperature(): number {
                return this._temperature;
            }
        };
    }
}
