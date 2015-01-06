BBQPi
=====

Raspberry Pi BBQ meter


Install Instructions
--------------------

1) Start with latest Raspian image from http://downloads.raspberrypi.org/raspbian_latest
2) login to Pi with Putty or other
3) Install nodejs:
	a.	wget http://nodejs.org/dist/v0.10.28/node-v0.10.28-linux-arm-pi.tar.gz
	b.	tar -xvzf node-v0.10.28-linux-arm-pi.tar.gz
	c.  create symbolic links to node and npm
		i.	sudo ln –s /home/pi/node-v0.10.28-linux-arm-pi/bin/node /usr/bin/node
		ii.	sudo ln –s /home/pi/node-v0.10.28-linux-arm-pi/bin/npm /usr/bin/npm
	d. (both node -v and npm -v should now show current version)
4) Enable SPI on Pi
	a.  sudo nano /etc/modprobe.d/raspi-blacklist.conf
		i. #blacklist spi-bcm2708
	b. (or use sudo raspi-config advanced options)
5) Install LCD dependencies
	a. sudo apt-get update
	b. sudo apt-get install build-essential python-dev python-smbus python-pip python-imaging python-numpy git
	c. sudo pip install RPi.GPIO
6) Install Adafruit LCD library (see https://learn.adafruit.com/user-space-spi-tft-python-library-ili9341-2-8/usage)
	a. cd ~
	b. git clone https://github.com/adafruit/Adafruit_Python_ILI9341.git
	c. cd Adafruit_Python_ILI9341
	d. sudo python setup.py install
7) copy app folder from git depot to app folder on Pi
8) install node dependencies (cd into app folder created above then run commands below)
	a. npm install express
	b. npm install serve-favicon
	c. npm install python-shell
	
