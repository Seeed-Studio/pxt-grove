grove.onGesture(GroveGesture.Up, () => {
    basic.showString("U")
})
grove.onGesture(GroveGesture.Down, () => {
    basic.showString("D")
})
grove.onGesture(GroveGesture.Right, () => {
    basic.showString("R")
})
grove.onGesture(GroveGesture.Left, () => {
    basic.showString("L")
})
grove.onGesture(GroveGesture.Wave, () => {
    basic.showString("W")
})
grove.onGesture(GroveGesture.Clockwise, () => {
    basic.showString("C")
})
grove.onGesture(GroveGesture.Anticlockwise, () => {
    basic.showString("A")
})

{
    let display = grove.createDisplay(DigitalPin.P0, DigitalPin.P1);
    let data = 0;

    display.point(true);
    display.clear();
    display.bit(3, 3);
    basic.pause(500);
    
    display.point(false);
    display.clear();
    display.bit(2, 2);
    basic.pause(500);
    
    display.point(true);
    display.clear();
    display.bit(1, 1);
    basic.pause(500);
    
    display.point(false);
    display.clear();
    display.bit(0, 0);
    basic.pause(500);
    
    display.set(7);
    
    while(true)
    {
        display.show(data ++);
        let distance = grove.measureInCentimeters(DigitalPin.P0);
        basic.showNumber(distance);
        basic.pause(500);
    }
}