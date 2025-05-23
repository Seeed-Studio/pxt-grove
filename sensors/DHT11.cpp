#include "pxt.h"
#include "MicroBit.h"

#if MICROBIT_CODAL
#include "nrf.h"
#include "nrf_soc.h"
#include "nrf_delay.h"
#endif

using namespace pxt;

namespace grove {

namespace sensors {

#define _DHT11_D_IMPL_VER 1
#define _DHT11_F_PIN_DIGITAL_WRITE_LOW pin->setDigitalValue(0)
#define _DHT11_F_PIN_DIGITAL_READ pin->getDigitalValue()
#define _DHT11_F_TIME_MICROS system_timer_current_time_us()
#define _DHT11_C_PULLDOWN_TIME 20000
#define _DHT11_C_ACK_1_TIMEOUT 300
#define _DHT11_C_ACK_2_TIMEOUT 40
#define _DHT11_C_DATA_BITS_WAIT_DELAY 90
#define _DHT11_C_DATA_BITS_LOW_TIMEOUT 70
#define _DHT11_C_DATA_BITS_HIGH_DELAY 30
#define _DHT11_C_DATA_BITS_HIGH_TIMEOUT 90

#define _DHT11_LIKELY(x) __builtin_expect(!!(x), 1)
#define _DHT11_UNLIKELY(x) __builtin_expect(!!(x), 0)

#if _DHT11_D_IMPL_VER == 2
// __attribute__((noinline, long_call, section(".ramfuncs"), optimize("s")))
int64_t
__dht11_read_impl_v2(const int pin_num) {
    MicroBitPin *pin = getPin(pin_num);
    if (_DHT11_UNLIKELY(!pin))
        return 1ll << 40;

    register int64_t result = 0;

    uint32_t end_time = 0;
    uint32_t start_time = 0;

    _DHT11_F_PIN_DIGITAL_WRITE_LOW;
    start_time = _DHT11_F_TIME_MICROS;
    end_time = start_time + _DHT11_C_PULLDOWN_TIME;
    while (_DHT11_F_TIME_MICROS < end_time)
        ;
    __disable_irq();
    start_time = _DHT11_F_TIME_MICROS;

#if MICROBIT_CODAL
    pin->setPull(codal::PullMode::Up);
#else
    pin->setPull(PinMode::PullUp);
#endif

    end_time = start_time + _DHT11_C_ACK_1_TIMEOUT;
    while (_DHT11_F_PIN_DIGITAL_READ ^ 0) {
        if (_DHT11_UNLIKELY(_DHT11_F_TIME_MICROS > end_time)) {
            __enable_irq();
            return 1ll << 41;
        }
    }

    while (_DHT11_F_PIN_DIGITAL_READ ^ 1) {
        if (_DHT11_UNLIKELY(_DHT11_F_TIME_MICROS > end_time)) {
            __enable_irq();
            return 1ll << 42;
        }
    }
    start_time = _DHT11_F_TIME_MICROS;

    end_time = start_time + _DHT11_C_ACK_2_TIMEOUT;
    while (_DHT11_F_TIME_MICROS < end_time)
        ;

    if (_DHT11_UNLIKELY(_DHT11_F_PIN_DIGITAL_READ ^ 1)) {
        __enable_irq();
        return 1ll << 43;
    }

    end_time = start_time + _DHT11_C_DATA_BITS_WAIT_DELAY;
    while (_DHT11_F_TIME_MICROS < end_time)
        ;

    for (int i = 39; i >= 0; --i) {
        start_time = _DHT11_F_TIME_MICROS;
        end_time = start_time + _DHT11_C_DATA_BITS_LOW_TIMEOUT;
        while (_DHT11_F_PIN_DIGITAL_READ ^ 1) {
            if (_DHT11_UNLIKELY(_DHT11_F_TIME_MICROS > end_time)) {
                __enable_irq();
                return 1ll << 44;
            }
        }
        start_time = _DHT11_F_TIME_MICROS;
        end_time = start_time + _DHT11_C_DATA_BITS_HIGH_DELAY;
        while (_DHT11_F_TIME_MICROS < end_time)
            ;

        result |= static_cast<int64_t>(_DHT11_F_PIN_DIGITAL_READ) << i;

        end_time = start_time + _DHT11_C_DATA_BITS_HIGH_TIMEOUT;
        while (_DHT11_F_PIN_DIGITAL_READ ^ 0) {
            if (_DHT11_UNLIKELY(_DHT11_F_TIME_MICROS > end_time)) {
                __enable_irq();
                return 1ll << 45;
            }
        }
    }
    __enable_irq();

    if (((result >> 32) + ((result >> 24) & 0xff) + ((result >> 16) & 0xff) +
         ((result >> 8) & 0xff)) ^
        (result & 0xff))
        return result | (1ll << 46);

    return result >> 8;
}
#endif

#if _DHT11_D_IMPL_VER == 1
// __attribute__((noinline, long_call, section(".ramfuncs")))
int64_t
__dht11_read_impl_v1(const int pin_num) {
    MicroBitPin *pin = getPin((int)pin_num);
    if (!pin)
        return 1ll << 40;

    bool data_bits[40];

    {

        uint32_t start_time = 0;
        uint32_t end_time = 0;

        _DHT11_F_PIN_DIGITAL_WRITE_LOW;
        start_time = _DHT11_F_TIME_MICROS;
        end_time = start_time + _DHT11_C_PULLDOWN_TIME;
        while (_DHT11_F_TIME_MICROS < end_time)
            ;
        __disable_irq();
        start_time = _DHT11_F_TIME_MICROS;

#if MICROBIT_CODAL
        pin->setPull(codal::PullMode::Up);
#else
        pin->setPull(PinMode::PullUp);
#endif

        end_time = start_time + _DHT11_C_ACK_1_TIMEOUT;
        while (_DHT11_F_PIN_DIGITAL_READ ^ 0) {
            if (_DHT11_F_TIME_MICROS > end_time) {
                __enable_irq();
                return 1ll << 41;
            }
        }

        while (_DHT11_F_PIN_DIGITAL_READ ^ 1) {
            if (_DHT11_F_TIME_MICROS > end_time) {
                __enable_irq();
                return 1ll << 42;
            }
        }
        start_time = _DHT11_F_TIME_MICROS;

        end_time = start_time + _DHT11_C_ACK_2_TIMEOUT;
        while (_DHT11_F_TIME_MICROS < end_time)
            ;

        if (_DHT11_F_PIN_DIGITAL_READ ^ 1) {
            __enable_irq();
            return 1ll << 43;
        }

        end_time = start_time + _DHT11_C_DATA_BITS_WAIT_DELAY;
        while (_DHT11_F_TIME_MICROS < end_time)
            ;

        for (int i = 0; i < 40; ++i) {
            start_time = _DHT11_F_TIME_MICROS;
            end_time = start_time + _DHT11_C_DATA_BITS_LOW_TIMEOUT;
            while (_DHT11_F_PIN_DIGITAL_READ ^ 1) {
                if (_DHT11_F_TIME_MICROS > end_time) {
                    __enable_irq();
                    return 1ll << 44;
                }
            }
            start_time = _DHT11_F_TIME_MICROS;
            end_time = start_time + _DHT11_C_DATA_BITS_HIGH_DELAY;
            while (_DHT11_F_TIME_MICROS < end_time)
                ;

            data_bits[i] = _DHT11_F_PIN_DIGITAL_READ;

            end_time = start_time + _DHT11_C_DATA_BITS_HIGH_TIMEOUT;
            while (_DHT11_F_PIN_DIGITAL_READ ^ 0) {
                if (_DHT11_F_TIME_MICROS > end_time) {
                    __enable_irq();
                    return 1ll << 45;
                }
            }
        }
    }
    __enable_irq();

    uint8_t data_bytes[5] = {0};
    for (int i = 0; i < 5; ++i) {
        for (int j = 0; j < 8; ++j) {
            data_bytes[i] <<= 1;
            data_bytes[i] |= data_bits[i * 8 + j];
        }
    }

    if (((data_bytes[0] + data_bytes[1] + data_bytes[2] + data_bytes[3]) & 0xff) != data_bytes[4])
        return (static_cast<int64_t>(data_bytes[0]) << 32) |
               (static_cast<int64_t>(data_bytes[1]) << 24) |
               (static_cast<int64_t>(data_bytes[2]) << 16) |
               (static_cast<int64_t>(data_bytes[3]) << 8) | static_cast<int64_t>(data_bytes[4]) |
               (1ll << 46);

    return (static_cast<int64_t>(data_bytes[0]) << 24) |
           (static_cast<int64_t>(data_bytes[1]) << 16) |
           (static_cast<int64_t>(data_bytes[2]) << 8) | static_cast<int64_t>(data_bytes[3]);
}
#endif

} // namespace sensors


//% advanced=true
//%
Buffer DHT11InternalRead(int signalPin) {
    int64_t result = 1ll << 40;

#if _DHT11_D_IMPL_VER == 1
    result = grove::sensors::__dht11_read_impl_v1(signalPin);
#elif _DHT11_D_IMPL_VER == 2
    result = sensors::__dht11_read_impl_v2(signalPin);
#endif

    return mkBuffer(reinterpret_cast<uint8_t *>(&result), sizeof(result));
}


}


namespace sensors
{

    //% advanced=true
    //%
    Buffer DHT11InternalRead(int signalPin) {
        return grove::DHT11InternalRead(signalPin);
    }

} // namespace sensors
