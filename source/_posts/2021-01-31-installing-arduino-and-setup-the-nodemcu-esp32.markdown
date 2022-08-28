---
layout: post
title: "Installing Arduino and Setup the NodeMCU ESP32"
date: 2021-01-31 11:33:31 -0500
comments: true
categories: ["arduino", "nodemcu", "esp32"] 
---

A couple of weeks ago I got myself the [NodeMCU ESP32 Development Board]():

![image](https://user-images.githubusercontent.com/567298/106391027-f5626080-63f3-11eb-9dca-5efce53fbf80.png)

If you want to view more in-depth specs about the board you can have a look at the [ESP32 Datasheet](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf), but in short it has:

- ESP32-D0WDQ6 Processor
- WiFi with frequency range of 2.4G ~ 2.5G (2400M ~ 2483.5M)
- Bluetooth 4.2
- 32Mbit built in Flash 
- 2x19pin extension headers, breakout all the I/O pins of the module
- 2x keys, used as reset or user-defined

## About this Tutorial

In this tutorial we will download and install Arduino and how to setup our ESP32 Board, then just running a basic hello world application

## Installing Arduino

Head over to [arduino.cc/en/software](https://www.arduino.cc/en/software) and download arduino for your operating system. 

Once installed you can reference [arduino-esp32](https://github.com/espressif/arduino-esp32) for your operating system, but in general you will open the Arduino application, select Preferences and provide the following link on the "Additional Boards Manager URL":

```
https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
```

Hit OK, then select Tools, Board, Board Manager, then search for "esp32", then install esp32 by Espressif Systems:

<img width="800" alt="image" src="https://user-images.githubusercontent.com/567298/106391354-8c7be800-63f5-11eb-852d-d472fe3624e9.png">

Then make sure to select the board by navigating to Tools, Board, ESP32 Arduino, ESP32 Dev Module:

<img width="1110" alt="image" src="https://user-images.githubusercontent.com/567298/106391458-06ac6c80-63f6-11eb-8a0b-eed0ae7e786b.png">

Select the upload rate from Tools, Upload Rate to 115200 and select the serial port, from mine it is Tools, Port, usb-serial-0001 (your's might differ)

## Hello World Application

Now that we have Arduino installed and our board configured, let's write a hello world application, from the input text section:

```
void setup() {
  Serial.begin(115200);
  Serial.println("Setup done");
  delay(5000);
}

void loop() {
  Serial.println("Hello, World");
  delay(1000);
}
```

From the setup function we set the baud rate and print a line then sleep for 5 seconds, once that is done we call the loop function which will print "Hello, World" and sleep for 1 second, and that will loop indefinitely.

Once you are done, save your sketch and upload it to the board by either selecting the upload button or from Sketch, Upload.

When the code has been compiled the device will reset and you can open the serial monitor, by selecting Tools, Serial Monitor:

<img width="936" alt="image" src="https://user-images.githubusercontent.com/567298/106391690-47f14c00-63f7-11eb-85bf-227f1ac5f92a.png">

## Thank You

Thank you for reading.
