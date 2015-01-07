BBQPi
=====

Raspberry Pi BBQ meter


Install Instructions
--------------------

1) Start with latest Raspian image from http://downloads.raspberrypi.org/raspbian_latest
2) login to Pi with Putty or other
3) run 'sudo raspi-config'
	a. set locale and timezone under internationalisation options
	b. enable SPI and I2C under Advanced Options
4) Install nodejs:
	a.	wget http://nodejs.org/dist/v0.10.28/node-v0.10.28-linux-arm-pi.tar.gz
	b.	tar -xvzf node-v0.10.28-linux-arm-pi.tar.gz
	c.  create symbolic links to node and npm
		i.	sudo ln -s /home/pi/node-v0.10.28-linux-arm-pi/bin/node /usr/bin/node
		ii.	sudo ln -s /home/pi/node-v0.10.28-linux-arm-pi/bin/npm /usr/bin/npm
	d. (both node -v and npm -v should now show current version)
5) Create an 'app' directory on Pi and copy install.sh and package.json from the github install directory to it
6) cd into the 'app' directory and type 'npm install'
