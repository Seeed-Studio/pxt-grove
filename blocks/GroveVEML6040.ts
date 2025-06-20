/**
 * Grove Color Sensor (VEML6040) support
 */
//% groups='["VEML6040"]'
namespace grove {

    export enum Color {
        //% block="Red"
        Red,
        //% block="Green"
        Green,
        //% block="Blue"
        Blue,
        //% block="White"
        White,
        //% block="Yellow"
        Yellow,
        //% block="Cyan"
        Cyan,
        //% block="Magenta"
        Magenta,
        //% block="Black"
        Black,
        //% block="Luminosity"
        Luminosity,
        //% block="Darkness"
        Darkness
    }


    let _veml6040: grove.sensors.VEML6040 = null;
    let _veml6040_r: number = 0;
    let _veml6040_g: number = 0;
    let _veml6040_b: number = 0;
    let _veml6040_w: number = 0;
    let _veml6040_decoupled = {
        red: 0,
        green: 0,
        blue: 0,
        yellow: 0,
        cyan: 0,
        magenta: 0,
        white: 0
    };
    let _veml6040_last_read_time: number = 0;


    /**
     * Read the color value from the Grove Color Sensor (VEML6040), the sensor only natively supports
     * Red, Green, Blue, and White, the others are derived from these values with mixing, range is 0-255.
     * @param color The color to read (Red, Green, Blue, White, etc.)
     * @return The color value as a number, or NaN if the sensor is not connected
     */
    //% block="read %Color color"
    //% group="VEML6040"
    //% weight=99
    export function readColorFromVEML6040(color: Color): number {
        if (!_veml6040) {
            _veml6040 = new grove.sensors.VEML6040(0x10, false);
            while (!_veml6040.connect());
        }
        if (!_veml6040.isConnected()) {
            _veml6040 = null;
            return NaN;
        }

        const gamma_correction = (value: number) => {
            if (value <= 0.0031308) {
                return value * 12.92;
            } else {
                return (1.055 * Math.pow(value, 1.0 / 2.4)) - 0.055;
            }
        };

        const get_ref_luminance = (r: number, g: number, b: number) => {
            return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
        };

        const srgb_decouple = (r: number, g: number, b: number) => {
            const v_w = [r, g, b].reduce((a, b) => Math.min(a, b), 1.0);

            const r_prime = r - v_w;
            const g_prime = g - v_w;
            const b_prime = b - v_w;

            const v_yellow = Math.min(r_prime, g_prime);
            const v_cyan = Math.min(g_prime, b_prime);
            const v_magenta = Math.min(b_prime, r_prime);

            const v_red = r_prime - v_yellow - v_magenta;
            const v_green = g_prime - v_yellow - v_cyan;
            const v_blue = b_prime - v_cyan - v_magenta;

            return {
                red: v_red,
                green: v_green,
                blue: v_blue,
                yellow: v_yellow,
                cyan: v_cyan,
                magenta: v_magenta,
                white: v_w
            };
        };

        let current_time = control.millis();
        while ((current_time - _veml6040_last_read_time) > _veml6040.getIntegrationTimeMs()
            || _veml6040_last_read_time == 0
        ) {
            let r_raw = _veml6040.readRed();
            let g_raw = _veml6040.readGreen();
            let b_raw = _veml6040.readBlue();
            let w_raw = _veml6040.readWhite();
            if (isNaN(r_raw) || isNaN(g_raw) || isNaN(b_raw) || isNaN(w_raw)) {
                current_time = control.millis();
                continue;
            }
            _veml6040_last_read_time = current_time;

            const g_sensitivity = _veml6040.getGSensitivity();
            r_raw *= g_sensitivity;
            g_raw *= g_sensitivity;
            b_raw *= g_sensitivity;
            w_raw *= g_sensitivity;

            const lux_range = _veml6040.getLuxRange();
            r_raw /= lux_range;
            g_raw /= lux_range;
            b_raw /= lux_range;
            w_raw /= lux_range;

            const x_cie = (0.048403 * r_raw) + (0.183633 * g_raw) - (0.253589 * b_raw);
            const y_cie = (0.022916 * r_raw) + (0.176388 * g_raw) - (0.183205 * b_raw);
            const z_cie = (-0.077436 * r_raw) + (0.124541 * g_raw) + (0.032081 * b_raw)

            let r_linear = (3.2404542 * x_cie) - (1.5371385 * y_cie) - (0.4985314 * z_cie);
            let g_linear = (-0.9692660 * x_cie) + (1.8760108 * y_cie) + (0.0415560 * z_cie);
            let b_linear = (0.0556434 * x_cie) - (0.2040259 * y_cie) + (1.0572252 * z_cie);

            r_linear = Math.max(0.0, Math.min(1.0, r_linear));
            g_linear = Math.max(0.0, Math.min(1.0, g_linear));
            b_linear = Math.max(0.0, Math.min(1.0, b_linear));

            _veml6040_r = r_linear;
            _veml6040_g = g_linear;
            _veml6040_b = b_linear;
            _veml6040_w = w_raw;

            const luminance = w_raw;
            const ref_luminance = get_ref_luminance(r_linear, g_linear, b_linear);
            const factor = luminance / ref_luminance;
            let decoupled = srgb_decouple(r_linear, g_linear, b_linear);
            const r_l = Math.round(gamma_correction(Math.max(0.0, Math.min(decoupled.red * factor, 1.0))) * 255.0);
            const g_l = Math.round(gamma_correction(Math.max(0.0, Math.min(decoupled.green * factor, 1.0))) * 255.0);
            const b_l = Math.round(gamma_correction(Math.max(0.0, Math.min(decoupled.blue * factor, 1.0))) * 255.0);
            const y_l = Math.round(gamma_correction(Math.max(0.0, Math.min(decoupled.yellow * factor, 1.0))) * 255.0);
            const c_l = Math.round(gamma_correction(Math.max(0.0, Math.min(decoupled.cyan * factor, 1.0))) * 255.0);
            const m_l = Math.round(gamma_correction(Math.max(0.0, Math.min(decoupled.magenta * factor, 1.0))) * 255.0);
            const w_l = Math.round(gamma_correction(Math.max(0.0, Math.min(decoupled.white * factor, 1.0))) * 255.0);

            _veml6040_decoupled.red = r_l;
            _veml6040_decoupled.green = g_l;
            _veml6040_decoupled.blue = b_l;
            _veml6040_decoupled.yellow = y_l;
            _veml6040_decoupled.cyan = c_l;
            _veml6040_decoupled.magenta = m_l;
            _veml6040_decoupled.white = w_l;

            break;
        }

        switch (color) {
            case Color.Red:
                return _veml6040_decoupled.red;
            case Color.Green:
                return _veml6040_decoupled.green;
            case Color.Blue:
                return _veml6040_decoupled.blue;
            case Color.White:
                return _veml6040_decoupled.white;
            case Color.Yellow:
                return _veml6040_decoupled.yellow;
            case Color.Cyan:
                return _veml6040_decoupled.cyan;
            case Color.Magenta:
                return _veml6040_decoupled.magenta;
            case Color.Black:
                return 255 - [
                    _veml6040_decoupled.red,
                    _veml6040_decoupled.green,
                    _veml6040_decoupled.blue,
                    _veml6040_decoupled.yellow,
                    _veml6040_decoupled.cyan,
                    _veml6040_decoupled.magenta,
                    _veml6040_decoupled.white
                ].reduce((a, b) => Math.max(a, b), 0);
            case Color.Luminosity:
                return Math.round(_veml6040_w * 255.0);
            case Color.Darkness:
                return 255 - Math.round(_veml6040_w * 255.0);
            default:
                return NaN;
        }

    }

}
