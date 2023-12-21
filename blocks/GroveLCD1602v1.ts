/**
 * Custom blocks
 */
//% groups=['LCD1602v1']
namespace grove 
{
	let _lcdI2cAddr = 0x3e;
    let _displayfunction = 0;
	let _displaycontrol = 0;
	let _displaymode = 0;
	
	function i2c_send_byte(buf: Buffer) {
		pins.i2cWriteBuffer(_lcdI2cAddr, buf, false);
	}

	function lcd_send_cmd(cmd: number) {
		let buf: Buffer = pins.createBuffer(2);
		buf[0] = 0x80;
		buf[1] = cmd;
		i2c_send_byte(buf);
	}

	function lcd_send_data(data: number) {
		let buf: Buffer = pins.createBuffer(2);
		buf[0] = 0x40;
		buf[1] = data;
		i2c_send_byte(buf);
	}
	
	function lcd_set_cursor(col: number, row: number) {
		let buf: Buffer = pins.createBuffer(2);
		col = (row == 0 ? col | 0x80 : col | 0xc0);
		buf[0] = 0x80;
		buf[1] = col;
		i2c_send_byte(buf);
	}
	
    /**
     * initial LCD
     */
    //% group="LCD1602v1"
    //% block="[Grove - LCD 16x2]|LCD initialize"
    //% weight=3
    export function lcd_init() {
        _displayfunction |= 0x08;
		lcd_send_cmd(0x20 | _displayfunction); // set command sequence
		
		_displaycontrol = 0x04 | 0x00 | 0x00;
		lcd_send_cmd(0x08 | _displaycontrol); // set display control
		
		_displaymode = 0x02 | 0x00;
		lcd_send_cmd(0x04|_displaymode); // set display mode
		
		lcd_clear(); // 
    }

    /**
     * show a number in LCD at given position
     * @param n is number will be show, eg: 10, 100, 200
     * @param x is LCD column position, eg: 0
     * @param y is LCD row position, eg: 0
     */
    //% group="LCD1602v1"
    //% block="[Grove - LCD 16x2]|show number %n|at x %x|y %y"
    //% weight=3
	//% x.min=0 x.max=15
    //% y.min=0 y.max=1
    export function lcd_show_number(n: number, x: number, y: number): void {
        let s = n.toString()
		lcd_show_string(s, x, y)
    }

    /**
     * show a string in LCD at given position
     * @param s is string will be show, eg: "Hello"
     * @param x is LCD column position, [0 - 15], eg: 0
     * @param y is LCD row position, [0 - 1], eg: 0
     */
    //% group="LCD1602v1"
    //% block="[Grove - LCD 16x2]|show string %n|at x %x|y %y"
    //% weight=3
	//% x.min=0 x.max=15
    //% y.min=0 y.max=1
    export function lcd_show_string(s: string, x: number, y: number): void {
        lcd_set_cursor(x,y);
		for(let i = 0; i < s.length; i++) {
			lcd_send_data(s.charCodeAt(i))
		}
    }

    /**
     * turn on LCD
     */
    //% group="LCD1602v1"
    //% block="[Grove - LCD 16x2]|display trun on"
    //% weight=3
    export function lcd_dispaly_on(): void {
        _displaycontrol |= 0x04;
		lcd_send_cmd(0x08 | _displaycontrol);
    }

    /**
     * turn off LCD
     */
    //% group="LCD1602v1"
    //% block="[Grove - LCD 16x2]|dispaly trun off"
    //% weight=3
    export function lcd_dispaly_off(): void {
        _displaycontrol &= ~0x04;
		lcd_send_cmd(0x08 | _displaycontrol);
    }

    /**
     * clear all display content
     */
    //% group="LCD1602v1"
    //% block="[Grove - LCD 16x2]|display clear"
    //% weight=3
    export function lcd_clear(): void {
        lcd_send_cmd(0x01);
		basic.pause(2);
    }
}