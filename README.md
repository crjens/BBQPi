BBQPi
=====

Raspberry Pi BBQ meter


Install Instructions
--------------------

1. Start with latest Raspian image from http://downloads.raspberrypi.org/raspbian_latest
2. login to Pi with Putty or other 
3. run 'sudo raspi-config' 
	1. set locale and timezone under internationalisation options
	2. enable SPI and I2C under Advanced Options
	3. expand filesystem
4. Enable I2C by adding the following two lines to /etc/modules
	1. i2c-bcm2708 
	2. i2c-dev
5. Install nodejs:
	1.	wget http://nodejs.org/dist/v0.10.28/node-v0.10.28-linux-arm-pi.tar.gz
	2.	tar -xvzf node-v0.10.28-linux-arm-pi.tar.gz
	3.  create symbolic links to node and npm
		1.	sudo ln -s /home/pi/node-v0.10.28-linux-arm-pi/bin/node /usr/bin/node
		2.	sudo ln -s /home/pi/node-v0.10.28-linux-arm-pi/bin/npm /usr/bin/npm
	4. (both node -v and npm -v should now show current version)
6. Clone BBQPi into app directory
	1. git clone https://github.com/crjens/BBQPi.git app
7. cd into the 'app' directory and type 'npm install'
