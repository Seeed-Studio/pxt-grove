/**
 * Grove Temperature & Humidity Sensor (DHT11) support by @nullptr, 2025.5.19
 */

#include "pxt.h"
#include "MicroBitConfig.h"
#include "MicroBit.h"

#if MICROBIT_CODAL
#include "nrf.h"
#include "nrf_soc.h"
#include "nrf_systick.h"

#define _DHT11_D_CLOCK_IMPL_VER 2

#else
#if defined(__arm)
#define _DHT11_D_CLOCK_IMPL_VER 3
#else
#define _DHT11_D_CLOCK_IMPL_VER 0
#endif

#endif

#define _DHT11_LIKELY(x) __builtin_expect(!!(x), 1)
#define _DHT11_UNLIKELY(x) __builtin_expect(!!(x), 0)

#define _DHT11_D_IMPL_VER 0

#define _DHT11_F_PIN_DIGITAL_WRITE_LOW pin->setDigitalValue(0)
#define _DHT11_F_PIN_DIGITAL_READ pin->getDigitalValue()
#define _DHT11_T_TIME_MICROS uint32_t

#if _DHT11_D_CLOCK_IMPL_VER == 0
#define _DHT11_C_TIME_MICROS_MASK 0x3fffffff

static uint32_t _dht11_system_timer_snapshot = 0;

inline __attribute__((always_inline)) void _dht11_system_timer_sync()
{
    _dht11_system_timer_snapshot = system_timer_current_time_us() & _DHT11_C_TIME_MICROS_MASK;
}

inline __attribute__((always_inline)) uint32_t _dht11_system_timer_as_micros()
{
    const uint32_t val = system_timer_current_time_us() & _DHT11_C_TIME_MICROS_MASK;
    const uint64_t period = val < _dht11_system_timer_snapshot ? static_cast<uint64_t>(_DHT11_C_TIME_MICROS_MASK) - _dht11_system_timer_snapshot + val : static_cast<uint64_t>(val) - _dht11_system_timer_snapshot;
    return static_cast<uint32_t>(period);
}

#define _DHT11_F_TIME_MICROS_SYNC _dht11_system_timer_sync()
#define _DHT11_F_TIME_MICROS (_dht11_system_timer_as_micros() & _DHT11_C_TIME_MICROS_MASK)

#elif _DHT11_D_CLOCK_IMPL_VER == 1
#include "mbed.h"

#define _DHT11_C_TIME_MICROS_MASK 0x3fffffff

static uint32_t _dht11_system_timer_snapshot = 0;

inline __attribute__((always_inline)) void _dht11_system_timer_sync()
{
    _dht11_system_timer_snapshot = us_ticker_read() & _DHT11_C_TIME_MICROS_MASK;
}

inline __attribute__((always_inline)) uint32_t _dht11_system_timer_as_micros()
{
    const uint32_t val = us_ticker_read() & _DHT11_C_TIME_MICROS_MASK;
    const uint64_t period = val < _dht11_system_timer_snapshot ? static_cast<uint64_t>(_DHT11_C_TIME_MICROS_MASK) - _dht11_system_timer_snapshot + val : static_cast<uint64_t>(val) - _dht11_system_timer_snapshot;
    return static_cast<uint32_t>(period);
}

#define _DHT11_F_TIME_MICROS_SYNC _dht11_system_timer_sync()
#define _DHT11_F_TIME_MICROS (_dht11_system_timer_as_micros() & _DHT11_C_TIME_MICROS_MASK)

#elif _DHT11_D_CLOCK_IMPL_VER == 2
#define _DHT11_C_SYSTICK_WRAP_MIN_MS 30
#define _DHT11_C_TIME_MICROS_MASK 0x3fffffff

extern "C"
{

    extern uint32_t SystemCoreClock;

    static uint32_t _dht11_systick_snapshot = 0;

    inline __attribute__((always_inline)) void _dht11_systick_sync()
    {
        _dht11_systick_snapshot = nrf_systick_val_get() & NRF_SYSTICK_VAL_MASK;
    }

    inline __attribute__((always_inline)) int _dht11_systick_init()
    {
        if (_DHT11_UNLIKELY(!SystemCoreClock))
        {
            return 0b0011;
        }

        const uint32_t ctrl = nrf_systick_csr_get();
        if (_DHT11_UNLIKELY((ctrl & NRF_SYSTICK_CSR_ENABLE_MASK) == NRF_SYSTICK_CSR_DISABLE))
        {
            nrf_systick_load_set(NRF_SYSTICK_VAL_MASK);
            nrf_systick_csr_set(
                NRF_SYSTICK_CSR_CLKSOURCE_CPU |
                NRF_SYSTICK_CSR_TICKINT_DISABLE |
                NRF_SYSTICK_CSR_ENABLE);
        }

        const uint32_t load = nrf_systick_load_get() & NRF_SYSTICK_VAL_MASK;
        const uint32_t wrap_period_ms = (static_cast<uint64_t>(load) * 1e3) / SystemCoreClock;
        if (_DHT11_UNLIKELY(wrap_period_ms < _DHT11_C_SYSTICK_WRAP_MIN_MS))
        {
            return 0b0111;
        }

        _dht11_systick_sync();

        return 0;
    }

    inline __attribute__((always_inline))
    uint32_t
    _dht11_systick_as_micros()
    {
        const uint32_t val = nrf_systick_val_get() & NRF_SYSTICK_VAL_MASK;
        const uint64_t period = val < _dht11_systick_snapshot ? static_cast<uint64_t>(_dht11_systick_snapshot - val) : static_cast<uint64_t>(NRF_SYSTICK_VAL_MASK) + _dht11_systick_snapshot - val;
        return static_cast<uint32_t>((static_cast<uint64_t>(period) * 1e6) / SystemCoreClock);
    }

} // extern "C"

#define _DHT11_F_TIME_MICROS_INIT _dht11_systick_init()
#define _DHT11_F_TIME_MICROS_SYNC _dht11_systick_sync()
#define _DHT11_F_TIME_MICROS (_dht11_systick_as_micros() & _DHT11_C_TIME_MICROS_MASK)

#elif _DHT11_D_CLOCK_IMPL_VER == 3
#define _DHT11_C_SYSTICK_WRAP_MIN_MS 30
#define _DHT11_C_TIME_MICROS_MASK 0x3fffffff

extern "C"
{

    extern uint32_t SystemCoreClock;

    static uint32_t _dht11_systick_snapshot = 0;

    inline __attribute__((always_inline)) void _dht11_systick_sync()
    {
        _dht11_systick_snapshot = SysTick->VAL & SysTick_VAL_CURRENT_Msk;
    }

    inline __attribute__((always_inline)) int _dht11_systick_init()
    {
        if (_DHT11_UNLIKELY(!SystemCoreClock))
        {
            return 0b0011;
        }

        const uint32_t ctrl = SysTick->CTRL;
        if (_DHT11_UNLIKELY((ctrl & SysTick_CTRL_ENABLE_Msk) == (1U << SysTick_CTRL_ENABLE_Pos)))
        {
            SysTick->LOAD = SysTick_VAL_CURRENT_Msk;
            SysTick->CTRL = ((1U << SysTick_CTRL_CLKSOURCE_Pos) |
                             (0U << SysTick_CTRL_TICKINT_Pos) |
                             (1U << SysTick_CTRL_ENABLE_Pos));
        }

        const uint32_t load = (SysTick->LOAD) & SysTick_VAL_CURRENT_Msk;
        const uint32_t wrap_period_ms = (static_cast<uint64_t>(load) * 1e3) / SystemCoreClock;
        if (_DHT11_UNLIKELY(wrap_period_ms < _DHT11_C_SYSTICK_WRAP_MIN_MS))
        {
            return 0b0111;
        }

        _dht11_systick_sync();

        return 0;
    }

    inline __attribute__((always_inline))
    uint32_t
    _dht11_systick_as_micros()
    {
        const uint32_t val = SysTick->VAL & SysTick_VAL_CURRENT_Msk;
        const uint64_t period = val < _dht11_systick_snapshot ? static_cast<uint64_t>(_dht11_systick_snapshot - val) : static_cast<uint64_t>(SysTick_VAL_CURRENT_Msk) + _dht11_systick_snapshot - val;
        return static_cast<uint32_t>((static_cast<uint64_t>(period) * 1e6) / SystemCoreClock);
    }

} // extern "C"

#define _DHT11_F_TIME_MICROS_INIT _dht11_systick_init()
#define _DHT11_F_TIME_MICROS_SYNC _dht11_systick_sync()
#define _DHT11_F_TIME_MICROS (_dht11_systick_as_micros() & _DHT11_C_TIME_MICROS_MASK)

#else
#error "Unsupported _DHT11_D_CLOCK_IMPL_VER"

#endif

#define _DHT11_C_PULLDOWN_TIME 20000
#define _DHT11_C_ACK_1_TIMEOUT 300
#define _DHT11_C_ACK_2_TIMEOUT 40
#define _DHT11_C_DATA_BITS_WAIT_DELAY 90
#define _DHT11_C_DATA_BITS_LOW_TIMEOUT 70
#define _DHT11_C_DATA_BITS_HIGH_DELAY 30
#define _DHT11_C_DATA_BITS_HIGH_TIMEOUT 90

using namespace pxt;

namespace grove
{

    namespace sensors
    {

#if _DHT11_D_IMPL_VER == 1
        // __attribute__((noinline, long_call, section(".ramfuncs"), optimize("s")))
        int64_t
        __dht11_read_impl_v1(const int pin_num)
        {
            MicroBitPin *pin = getPin(pin_num);
            if (_DHT11_UNLIKELY(!pin))
                return 1ll << 40;

            register int64_t result = 0;

            _DHT11_T_TIME_MICROS start_time = 0;

            _DHT11_F_PIN_DIGITAL_WRITE_LOW;
            const bool irq_enabled = __get_PRIMASK() ^ 1;
            __disable_irq();

#ifdef _DHT11_F_TIME_MICROS_SYNC
            _DHT11_F_TIME_MICROS_SYNC;
#endif
            start_time = _DHT11_F_TIME_MICROS;
            while (static_cast<_DHT11_T_TIME_MICROS>(_DHT11_F_TIME_MICROS - start_time) < _DHT11_C_PULLDOWN_TIME)
                ;
            start_time = _DHT11_F_TIME_MICROS;

#if MICROBIT_CODAL
            pin->setPull(codal::PullMode::Up);
#else
            pin->setPull(PinMode::PullUp);
#endif

            while (_DHT11_F_PIN_DIGITAL_READ ^ 0)
            {
                if (_DHT11_UNLIKELY(static_cast<_DHT11_T_TIME_MICROS>(_DHT11_F_TIME_MICROS - start_time) > _DHT11_C_ACK_1_TIMEOUT))
                {
                    if (irq_enabled)
                    {
                        __enable_irq();
                    }
                    return 1ll << 41;
                }
            }

            while (_DHT11_F_PIN_DIGITAL_READ ^ 1)
            {
                if (_DHT11_UNLIKELY(static_cast<_DHT11_T_TIME_MICROS>(_DHT11_F_TIME_MICROS - start_time) > _DHT11_C_ACK_1_TIMEOUT))
                {
                    if (irq_enabled)
                    {
                        __enable_irq();
                    }
                    return 1ll << 42;
                }
            }
            start_time = _DHT11_F_TIME_MICROS;

            while (static_cast<_DHT11_T_TIME_MICROS>(_DHT11_F_TIME_MICROS - start_time) < _DHT11_C_ACK_2_TIMEOUT)
                ;

            if (_DHT11_UNLIKELY(_DHT11_F_PIN_DIGITAL_READ ^ 1))
            {
                if (irq_enabled)
                {
                    __enable_irq();
                }
                return 1ll << 43;
            }

            while (static_cast<_DHT11_T_TIME_MICROS>(_DHT11_F_TIME_MICROS - start_time) < _DHT11_C_DATA_BITS_WAIT_DELAY)
                ;

            for (int i = 39; i >= 0; --i)
            {
                start_time = _DHT11_F_TIME_MICROS;
                while (_DHT11_F_PIN_DIGITAL_READ ^ 1)
                {
                    if (_DHT11_UNLIKELY(static_cast<_DHT11_T_TIME_MICROS>(_DHT11_F_TIME_MICROS - start_time) > _DHT11_C_DATA_BITS_LOW_TIMEOUT))
                    {
                        if (irq_enabled)
                        {
                            __enable_irq();
                        }
                        return 1ll << 44;
                    }
                }
                start_time = _DHT11_F_TIME_MICROS;
                while (static_cast<_DHT11_T_TIME_MICROS>(_DHT11_F_TIME_MICROS - start_time) < _DHT11_C_DATA_BITS_HIGH_DELAY)
                    ;

                result |= static_cast<int64_t>(_DHT11_F_PIN_DIGITAL_READ) << i;

                while (_DHT11_F_PIN_DIGITAL_READ ^ 0)
                {
                    if (_DHT11_UNLIKELY(static_cast<_DHT11_T_TIME_MICROS>(_DHT11_F_TIME_MICROS - start_time) > _DHT11_C_DATA_BITS_HIGH_TIMEOUT))
                    {
                        if (irq_enabled)
                        {
                            __enable_irq();
                        }
                        return 1ll << 45;
                    }
                }
            }
            if (irq_enabled)
            {
                __enable_irq();
            }

            if (((result >> 32) + ((result >> 24) & 0xff) + ((result >> 16) & 0xff) +
                 ((result >> 8) & 0xff)) ^
                (result & 0xff))
                return result | (1ll << 46);

            return result >> 8;
        }
#endif

#if _DHT11_D_IMPL_VER == 0
        // __attribute__((noinline, long_call, section(".ramfuncs")))
        int64_t
        __dht11_read_impl_v0(const int pin_num)
        {
            MicroBitPin *pin = getPin((int)pin_num);
            if (!pin)
                return 1ll << 40;

            bool data_bits[40];

            {
                _DHT11_T_TIME_MICROS start_time = 0;

                _DHT11_F_PIN_DIGITAL_WRITE_LOW;
                const bool irq_enabled = __get_PRIMASK() ^ 1;
                __disable_irq();

#ifdef _DHT11_F_TIME_MICROS_SYNC
                _DHT11_F_TIME_MICROS_SYNC;
#endif
                start_time = _DHT11_F_TIME_MICROS;
                while (static_cast<_DHT11_T_TIME_MICROS>(_DHT11_F_TIME_MICROS - start_time) < _DHT11_C_PULLDOWN_TIME)
                    ;
                start_time = _DHT11_F_TIME_MICROS;

#if MICROBIT_CODAL
                pin->setPull(codal::PullMode::Up);
#else
                pin->setPull(PinMode::PullUp);
#endif

                while (_DHT11_F_PIN_DIGITAL_READ ^ 0)
                {
                    if (static_cast<_DHT11_T_TIME_MICROS>(_DHT11_F_TIME_MICROS - start_time) > _DHT11_C_ACK_1_TIMEOUT)
                    {
                        if (irq_enabled)
                        {
                            __enable_irq();
                        }
                        return 1ll << 41;
                    }
                }

                while (_DHT11_F_PIN_DIGITAL_READ ^ 1)
                {
                    if (static_cast<_DHT11_T_TIME_MICROS>(_DHT11_F_TIME_MICROS - start_time) > _DHT11_C_ACK_1_TIMEOUT)
                    {
                        if (irq_enabled)
                        {
                            __enable_irq();
                        }
                        return 1ll << 42;
                    }
                }
                start_time = _DHT11_F_TIME_MICROS;

                while (static_cast<_DHT11_T_TIME_MICROS>(_DHT11_F_TIME_MICROS - start_time) < _DHT11_C_ACK_2_TIMEOUT)
                    ;

                if (_DHT11_F_PIN_DIGITAL_READ ^ 1)
                {
                    if (irq_enabled)
                    {
                        __enable_irq();
                    }
                    return 1ll << 43;
                }

                while (static_cast<_DHT11_T_TIME_MICROS>(_DHT11_F_TIME_MICROS - start_time) < _DHT11_C_DATA_BITS_WAIT_DELAY)
                    ;

                for (int i = 0; i < 40; ++i)
                {
                    start_time = _DHT11_F_TIME_MICROS;
                    while (_DHT11_F_PIN_DIGITAL_READ ^ 1)
                    {
                        if (static_cast<_DHT11_T_TIME_MICROS>(_DHT11_F_TIME_MICROS - start_time) > _DHT11_C_DATA_BITS_LOW_TIMEOUT)
                        {
                            if (irq_enabled)
                            {
                                __enable_irq();
                            }
                            return 1ll << 44;
                        }
                    }
                    start_time = _DHT11_F_TIME_MICROS;
                    while (static_cast<_DHT11_T_TIME_MICROS>(_DHT11_F_TIME_MICROS - start_time) < _DHT11_C_DATA_BITS_HIGH_DELAY)
                        ;

                    data_bits[i] = _DHT11_F_PIN_DIGITAL_READ;

                    while (_DHT11_F_PIN_DIGITAL_READ ^ 0)
                    {
                        if (static_cast<_DHT11_T_TIME_MICROS>(_DHT11_F_TIME_MICROS - start_time) > _DHT11_C_DATA_BITS_HIGH_TIMEOUT)
                        {
                            if (irq_enabled)
                            {
                                __enable_irq();
                            }
                            return 1ll << 45;
                        }
                    }
                }

                if (irq_enabled)
                {
                    __enable_irq();
                }
            }

            uint8_t data_bytes[5] = {0};
            for (int i = 0; i < 5; ++i)
            {
                for (int j = 0; j < 8; ++j)
                {
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
    Buffer DHT11InternalRead(int signalPin)
    {
        int64_t result = 0;

        result |= static_cast<int64_t>(_DHT11_D_CLOCK_IMPL_VER) << 48;
        result |= static_cast<int64_t>(_DHT11_D_IMPL_VER) << 56;

#if defined(_DHT11_F_TIME_MICROS_INIT)
        int ret = _DHT11_F_TIME_MICROS_INIT;
        if (_DHT11_UNLIKELY(ret != 0))
        {
            result |= static_cast<int64_t>(ret & 0xff) << 40;
            return mkBuffer(reinterpret_cast<uint8_t *>(&result), sizeof(result));
        }
#endif

#if _DHT11_D_IMPL_VER == 0
        result |= grove::sensors::__dht11_read_impl_v0(signalPin);
#elif _DHT11_D_IMPL_VER == 1
        result |= grove::sensors::__dht11_read_impl_v1(signalPin);
#else
        result |= 0b0011;
#endif

        return mkBuffer(reinterpret_cast<uint8_t *>(&result), sizeof(result));
    }

} // namespace grove

namespace sensors
{

    //% advanced=true
    //%
    Buffer DHT11InternalRead(int signalPin)
    {
        return grove::DHT11InternalRead(signalPin);
    }

} // namespace sensors
