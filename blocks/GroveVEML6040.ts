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
        Darkness,
        //% block="Ambient Light"
        AmbientLight
    }

    interface CIE {
        x: number;
        y: number;
        z: number;
    };

    interface RGB {
        r: number;
        g: number;
        b: number;
    };

    interface HSV {
        h: number;
        s: number;
        v: number;
    };

    const gamma_correction_linear_2_srgb = (value: number): number => {
        if (value <= 0.0031308) {
            return 12.92 * value;
        } else {
            return (1.055 * Math.pow(value, 1.0 / 2.4)) - 0.055;
        }
    };

    const reference_brightness_normalized = (color: RGB): number => {
        return (0.2126 * color.r) + (0.7152 * color.g) + (0.0722 * color.b);
    };

    const raw_rgb_2_cie = (color: RGB, calibration_matrix: number[][]): CIE => {
        const r = color.r;
        const g = color.g;
        const b = color.b;

        const x = (r * calibration_matrix[0][0]) + (g * calibration_matrix[0][1]) + (b * calibration_matrix[0][2]);
        const y = (r * calibration_matrix[1][0]) + (g * calibration_matrix[1][1]) + (b * calibration_matrix[1][2]);
        const z = (r * calibration_matrix[2][0]) + (g * calibration_matrix[2][1]) + (b * calibration_matrix[2][2]);

        return { x, y, z };
    };

    const cie_2_cie_normalized = (color: CIE): CIE => {
        color.x = Math.max(0, color.x);
        color.y = Math.max(0, color.y);
        color.z = Math.max(0, color.z);

        const sum = color.x + color.y + color.z;
        if (sum == 0) {
            return { x: 0, y: 0, z: 0 };
        }

        return {
            x: color.x / sum,
            y: color.y / sum,
            z: color.z / sum
        };
    };

    const cie_normalized_2_rgb_linear = (color: CIE): RGB => {
        const x = color.x;
        const y = color.y;
        const z = color.z;

        const r = (3.2406 * x) - (1.5372 * y) - (0.4986 * z);
        const g = (-0.9689 * x) + (1.8758 * y) + (0.0415 * z);
        const b = (0.0557 * x) - (0.2040 * y) + (1.0570 * z);

        return {
            r: Math.max(0, Math.min(1, r)),
            g: Math.max(0, Math.min(1, g)),
            b: Math.max(0, Math.min(1, b))
        };
    };

    const rgb_linear_apply_luminance = (color: RGB, luminance: number, eps: number = 0.0001): RGB => {
        const current = reference_brightness_normalized(color);
        if (current < eps) {
            return { r: 0, g: 0, b: 0 };
        }
        const scale = luminance / current;

        return {
            r: Math.min(1, color.r * scale),
            g: Math.min(1, color.g * scale),
            b: Math.min(1, color.b * scale)
        };
    };

    const rgb_linear_2_srgb = (color: RGB): RGB => {
        return {
            r: gamma_correction_linear_2_srgb(color.r),
            g: gamma_correction_linear_2_srgb(color.g),
            b: gamma_correction_linear_2_srgb(color.b)
        };
    };

    const srgb_normalized_2_srgb_quantized = (color: RGB): RGB => {
        return {
            r: Math.round(color.r * 255.0),
            g: Math.round(color.g * 255.0),
            b: Math.round(color.b * 255.0)
        };
    };

    const srgb_normalized_2_hsv_normalized = (color: RGB): HSV => {
        const r = color.r;
        const g = color.g;
        const b = color.b;

        const maxc = Math.max(r, Math.max(g, b));
        const minc = Math.min(r, Math.min(g, b));
        const rangec = maxc - minc;
        const v = maxc;
        if (minc == maxc) {
            return { h: 0, s: 0, v: v };
        }
        const s = rangec / maxc;
        const rc = (maxc - r) / rangec;
        const gc = (maxc - g) / rangec;
        const bc = (maxc - b) / rangec;
        let h: number;
        if (r == maxc) {
            h = bc - gc;
        }
        else if (g == maxc) {
            h = 2.0 + rc - bc;
        }
        else {
            h = 4.0 + gc - rc;
        }
        h = (h / 6.0) % 1.0;
        if (h < 0) {
            h += 1.0;
        }
        return { h: h, s: s, v: v };
    };

    const hsv_normalized_color_strength = (current: HSV, target: HSV, weight: HSV): number => {
        const delta_h = Math.abs(current.h - target.h);
        const delta_s = Math.abs(current.s - target.s);
        const delta_v = Math.abs(current.v - target.v);

        const weighted_h = Math.min(delta_h, 1.0 - delta_h) * weight.h;
        const weighted_s = delta_s * weight.s;
        const weighted_v = delta_v * weight.v;

        const strength = 1.0 - ((weighted_h + weighted_s + weighted_v) / 3.0);
        return Math.max(0.0, Math.min(1.0, strength));
    };

    const hsv_normalized_presets: { [index: number]: HSV } = {
        [Color.Red]: { h: 0, s: 1, v: 1 },
        [Color.Green]: { h: 0.3333, s: 1, v: 1 },
        [Color.Blue]: { h: 0.6667, s: 1, v: 1 },
        [Color.Yellow]: { h: 0.1667, s: 1, v: 1 },
        [Color.Cyan]: { h: 0.5, s: 1, v: 1 },
        [Color.Magenta]: { h: 0.8333, s: 1, v: 1 },
        [Color.White]: { h: 0, s: 0, v: 1 },
        [Color.Black]: { h: 0, s: 0, v: 0 },
    };

    let _veml6040: grove.sensors.VEML6040 = null;
    let _veml6040_decoupled: { [index: number]: number } = {
        [Color.Red]: 0,
        [Color.Green]: 0,
        [Color.Blue]: 0,
        [Color.Yellow]: 0,
        [Color.Cyan]: 0,
        [Color.Magenta]: 0,
        [Color.White]: 0,
        [Color.Black]: 0,
        [Color.Luminosity]: 0,
        [Color.Darkness]: 0,
        [Color.AmbientLight]: 0
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
    export function readColorFromVEML6040(color: Color, loggingToSerial: boolean = true): number {
        if (!_veml6040) {
            _veml6040 = new grove.sensors.VEML6040(0x10, false);
            while (!_veml6040.connect());
        }
        if (!_veml6040.isConnected()) {
            _veml6040 = null;
            return NaN;
        }


        let current_time = control.millis();
        while ((current_time - _veml6040_last_read_time) > _veml6040.getIntegrationTimeMs()
            || _veml6040_last_read_time == 0
        ) {
            let rgb_raw: RGB = {
                r: _veml6040.readRed(),
                g: _veml6040.readGreen(),
                b: _veml6040.readBlue()
            };
            let w_raw = _veml6040.readWhite();
            if (isNaN(rgb_raw.r) || isNaN(rgb_raw.g) || isNaN(rgb_raw.b) || isNaN(w_raw)) {
                current_time = control.millis();
                continue;
            }
            _veml6040_last_read_time = current_time;

            const g_sensitivity = _veml6040.getGSensitivity();
            w_raw *= g_sensitivity;

            const lux_range = _veml6040.getLuxRange();
            w_raw /= lux_range;
            w_raw = Math.max(0.0, Math.min(1.0, w_raw));

            _veml6040_decoupled[Color.Luminosity] = Math.round(w_raw * 255.0);
            _veml6040_decoupled[Color.Darkness] = 255 - _veml6040_decoupled[Color.Luminosity];

            const ambient_light = (rgb_raw.g * g_sensitivity) / lux_range;
            _veml6040_decoupled[Color.AmbientLight] = Math.round(ambient_light * 255.0);

            if (loggingToSerial) {
                serial.writeLine(`VEML6040 RGB Raw: ${JSON.stringify(rgb_raw)}`);
            }
            const calibration_matrix: number[][] = [
                [-0.023249, 0.291014, -0.364880],
                [-0.042799, 0.272148, -0.279591],
                [-0.155901, 0.251534, -0.076240]
            ];
            const xyz_cie: CIE = raw_rgb_2_cie(rgb_raw, calibration_matrix);
            if (loggingToSerial) {
                serial.writeLine(`VEML6040 CIE XYZ: ${JSON.stringify(xyz_cie)}`);
            }
            const xyz_cie_normalized: CIE = cie_2_cie_normalized(xyz_cie);
            if (loggingToSerial) {
                serial.writeLine(`VEML6040 CIE XYZ Normalized: ${JSON.stringify(xyz_cie_normalized)}`);
            }

            const rgb_linear: RGB = cie_normalized_2_rgb_linear(xyz_cie_normalized);
            if (loggingToSerial) {
                serial.writeLine(`VEML6040 RGB Linear: ${JSON.stringify(rgb_linear)}`);
            }
            const rgb_linear_luminance = rgb_linear_apply_luminance(rgb_linear, w_raw);
            if (loggingToSerial) {
                serial.writeLine(`VEML6040 RGB Linear with Luminance: ${JSON.stringify(rgb_linear_luminance)}`);
            }

            const rgb_srgb: RGB = rgb_linear_2_srgb(rgb_linear_luminance);
            if (loggingToSerial) {
                serial.writeLine(`VEML6040 RGB sRGB: ${JSON.stringify(rgb_srgb)}`);
            }
            const hsv: HSV = srgb_normalized_2_hsv_normalized(rgb_srgb);
            if (loggingToSerial) {
                serial.writeLine(`VEML6040 HSV: ${JSON.stringify(hsv)}`);
            }

            const weight: HSV = { h: 8, s: 3, v: 3 };

            // for in statement not supported in micro:bit
            _veml6040_decoupled[Color.Red] = Math.round(hsv_normalized_color_strength(hsv, hsv_normalized_presets[Color.Red], weight) * 255.0);
            _veml6040_decoupled[Color.Green] = Math.round(hsv_normalized_color_strength(hsv, hsv_normalized_presets[Color.Green], weight) * 255.0);
            _veml6040_decoupled[Color.Blue] = Math.round(hsv_normalized_color_strength(hsv, hsv_normalized_presets[Color.Blue], weight) * 255.0);
            _veml6040_decoupled[Color.Yellow] = Math.round(hsv_normalized_color_strength(hsv, hsv_normalized_presets[Color.Yellow], weight) * 255.0);
            _veml6040_decoupled[Color.Cyan] = Math.round(hsv_normalized_color_strength(hsv, hsv_normalized_presets[Color.Cyan], weight) * 255.0);
            _veml6040_decoupled[Color.Magenta] = Math.round(hsv_normalized_color_strength(hsv, hsv_normalized_presets[Color.Magenta], weight) * 255.0);
            _veml6040_decoupled[Color.White] = Math.round(hsv_normalized_color_strength(hsv, hsv_normalized_presets[Color.White], weight) * 255.0);
            _veml6040_decoupled[Color.Black] = Math.round(hsv_normalized_color_strength(hsv, hsv_normalized_presets[Color.Black], weight) * 255.0);

            break;
        }

        return _veml6040_decoupled[color];
    }

}
