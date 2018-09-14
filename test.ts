// grove.onGesture(GroveGesture.Up, () => {
//     basic.showString("U")
// })
// grove.onGesture(GroveGesture.Down, () => {
//     basic.showString("D")
// })
// grove.onGesture(GroveGesture.Right, () => {
//     basic.showString("R")
// })
// grove.onGesture(GroveGesture.Left, () => {
//     basic.showString("L")
// })
// grove.onGesture(GroveGesture.Wave, () => {
//     basic.showString("W")
// })
// grove.onGesture(GroveGesture.Clockwise, () => {
//     basic.showString("C")
// })
// grove.onGesture(GroveGesture.Anticlockwise, () => {
//     basic.showString("A")
// })

// grove.onJoystick(GroveJoystickKey.Right, AnalogPin.P0,AnalogPin.P1, () => {
//     // basic.showArrow(ArrowNames.East);
//     basic.showString("1");
// })

// grove.onJoystick(GroveJoystickKey.Left, AnalogPin.P0,AnalogPin.P1, () => {
//     // basic.showArrow(ArrowNames.West);
//     basic.showString("2");
// })

// grove.onJoystick(GroveJoystickKey.Up, AnalogPin.P0,AnalogPin.P1, () => {
//     // basic.showArrow(ArrowNames.North);
//     basic.showString("3");
// })

// grove.onJoystick(GroveJoystickKey.Down, AnalogPin.P0,AnalogPin.P1, () => {
//     // basic.showArrow(ArrowNames.South);
//     basic.showString("4");
// })

// grove.onJoystick(GroveJoystickKey.UL, AnalogPin.P0,AnalogPin.P1, () => {
//     // basic.showArrow(ArrowNames.NorthEast);
//     basic.showString("5");
// })

// grove.onJoystick(GroveJoystickKey.UR, AnalogPin.P0,AnalogPin.P1, () => {
//     // basic.showArrow(ArrowNames.NorthWest);
//     basic.showString("6");
// })

// grove.onJoystick(GroveJoystickKey.LL, AnalogPin.P0,AnalogPin.P1, () => {
//     // basic.showArrow(ArrowNames.SouthWest);
//     basic.showString("7");
// })

// grove.onJoystick(GroveJoystickKey.LR, AnalogPin.P0,AnalogPin.P1, () => {
//     // basic.showArrow(ArrowNames.SouthEast);
//     basic.showString("8");
// })

// grove.onJoystick(GroveJoystickKey.Press, AnalogPin.P0,AnalogPin.P1, () => {
//     basic.showString("9");
// })



{
    // let display = grove.createDisplay(DigitalPin.P0, DigitalPin.P1);
    // let data = 0;

    // display.point(true);
    // display.clear();
    // display.bit(3, 3);
    // basic.pause(500);
    
    // display.point(false);
    // display.clear();
    // display.bit(2, 2);
    // basic.pause(500);
    
    // display.point(true);
    // display.clear();
    // display.bit(1, 1);
    // basic.pause(500);
    
    // display.point(false);
    // display.clear();
    // display.bit(0, 0);
    // basic.pause(500);
    
    // display.set(7);
    // let p : grove.PAJ7620;
    // p.init();
    
    while(true)
    {
    //     display.show(data ++);
    //     let distance = grove.measureInCentimeters(DigitalPin.P0);
        basic.showNumber(12);
        basic.pause(2000);
    }
}