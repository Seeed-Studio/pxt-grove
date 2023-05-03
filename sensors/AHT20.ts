namespace grove
{
    export namespace sensors
    {

        export class AHT20
        {
            public constructor(address: number = 0x38)
            {
                this._Address = address;
            }

            public Initialization(): AHT20
            {
                const buf = pins.createBuffer(3);
                buf[0] = 0xbe;
                buf[1] = 0x08;
                buf[2] = 0x00;
                pins.i2cWriteBuffer(this._Address, buf, false);
                basic.pause(10);

                return this;
            }

            public TriggerMeasurement(): AHT20
            {
                const buf = pins.createBuffer(3);
                buf[0] = 0xac;
                buf[1] = 0x33;
                buf[2] = 0x00;
                pins.i2cWriteBuffer(this._Address, buf, false);
                basic.pause(80);

                return this;
            }

            public GetState(): { Busy: boolean, Calibrated: boolean }
            {
                const buf = pins.i2cReadBuffer(this._Address, 1, false);
                const busy = buf[0] & 0x80 ? true : false;
                const calibrated = buf[0] & 0x08 ? true : false;

                return { Busy: busy, Calibrated: calibrated };
            }

            public Read(): { Humidity: number, Temperature: number }
            {
                const buf = pins.i2cReadBuffer(this._Address, 7, false);

                const crc8 = AHT20.CalcCRC8(buf, 0, 6);
                if (buf[6] != crc8) return null;

                const humidity = ((buf[1] << 12) + (buf[2] << 4) + (buf[3] >> 4)) * 100 / 1048576;
                const temperature = (((buf[3] & 0x0f) << 16) + (buf[4] << 8) + buf[5]) * 200 / 1048576 - 50;

                return { Humidity: humidity, Temperature: temperature };
            }

            private _Address: number;

            private static CalcCRC8(buf: Buffer, offset: number, size: number): number
            {
                let crc8 = 0xff;
                for (let i = 0; i < size; ++i)
                {
                    crc8 ^= buf[offset + i];
                    for (let j = 0; j < 8; ++j)
                    {
                        if (crc8 & 0x80)
                        {
                            crc8 <<= 1;
                            crc8 ^= 0x31;
                        }
                        else
                        {
                            crc8 <<= 1;
                        }
                        crc8 &= 0xff;
                    }
                }

                return crc8;
            }

        }
    }
}
