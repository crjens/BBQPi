#!/bin/bash
 
sudo apt-get update&&sudo apt-get install -y build-essential python-dev python-smbus python-pip python-imaging python-numpy git&&sudo pip install RPi.GPIO
cd ~&&git clone https://github.com/adafruit/Adafruit_Python_ILI9341.git&&cd Adafruit_Python_ILI9341&&sudo python setup.py install 