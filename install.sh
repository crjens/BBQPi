#!/bin/bash
sudo rm -rf .git 
sudo apt-get update
sudo apt-get install -y build-essential python-dev python-smbus python-pip python-imaging python-numpy git
sudo pip install RPi.GPIO
if [ -d ~/Adafruit_Python_ILI9341 ]; then
	echo "Adafruit_Python_ILI9341 already installed"
else
	cd ~
	git clone https://github.com/adafruit/Adafruit_Python_ILI9341.git
	cd Adafruit_Python_ILI9341
	sudo python setup.py install
	echo "installed Adafruit_Python_ILI9341"
fi
sudo npm install -g forever
if [ -f /etc/init.d/node-server.sh ]; then
	echo "node-server.sh already installed"
	sudo unlink node-server.sh
else
	sudo mv node-server.sh /etc/init.d/
	cd /etc/init.d
	sudo chmod 755 node-server.sh
	sudo update-rc.d node-server.sh defaults
	cd ~
	echo "installed node-server.sh"
fi
if [ -f ~/.bash_aliases ]; then
	echo ".bash_aliases already installed"
	sudo unlink .bash_aliases
else
	sudo mv .bash_aliases ~
	echo "installed .bash_aliases"
fi
echo "finshed" 