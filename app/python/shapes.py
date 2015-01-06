# Copyright (c) 2014 Adafruit Industries
# Author: Tony DiCola
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.
import Image
import ImageDraw
import ImageFont
import sys, json, datetime

import Adafruit_ILI9341 as TFT
import Adafruit_GPIO as GPIO
import Adafruit_GPIO.SPI as SPI


# Raspberry Pi configuration.
DC = 17
RST = 23
SPI_PORT = 0
SPI_DEVICE = 0

# BeagleBone Black configuration.
# DC = 'P9_15'
# RST = 'P9_12'
# SPI_PORT = 1
# SPI_DEVICE = 0

# x,y coordinates of plot area
plotxy = (5,5,185,295)

# load input data
for line in sys.stdin:
  data = json.loads(line)
#  print json.dumps(data)

# Define a function to create rotated text.  Unfortunately PIL doesn't have good
# native support for rotated fonts, but this function can be used to make a 
# text image and rotate it so it's easy to paste in the buffer.
def draw_rotated_text(image, text, position, angle, font, fill=(255,255,255)):
	# Get rendered font width and height.
	draw = ImageDraw.Draw(image)
	width, height = draw.textsize(text, font=font)
	# Create a new image with transparent background to store the text.
	textimage = Image.new('RGBA', (width, height), (0,0,0,0))
	# Render the text.
	textdraw = ImageDraw.Draw(textimage)
	textdraw.text((0,0), text, font=font, fill=fill)
	# Rotate the text image.
	rotated = textimage.rotate(angle, expand=1)
	# Paste the text into the image, using it as a mask for transparency.
	image.paste(rotated, position, rotated)

# plot temps on graph
def plot(temps, color):
	lastx=0
	lasty=0
	for i,val in enumerate(temps):
		x = plotxy[2] - ((temps[i]-yrange[0])/float(yrange[1]-yrange[0]))*(plotxy[2]-plotxy[0])
		y = plotxy[3] - ((data["time"][i]-xrange[0])/float(xrange[1]-xrange[0]))*(plotxy[3]-plotxy[1])
		draw.rectangle((x-1,y-1,x+1, y+1), fill=color, outline=color)	
		if i>0:
			draw.line((lastx, lasty, x, y), fill=color)	
		lastx=x
		lasty=y

# find min and max temps
def minmax (x):
    # this function fails if the list length is 0 
    minimum = maximum = x[0]
    for i in x[1:]:
        if i < minimum: 
            minimum = i 
        else: 
            if i > maximum: maximum = i
    return (minimum,maximum)          

# format timestamp
def formattime(timestamp):
	return datetime.datetime.fromtimestamp(timestamp/1000.0).strftime('%I:%M')


# load fonts
font = ImageFont.truetype('fonts/segoeui.ttf', 16)
font2 = ImageFont.truetype('fonts/segoeui.ttf', 12)

# find min max ranges for input data
yrange = minmax(data["probe1"]+data["probe2"]+data["probe3"]+data["probe4"])
xrange = minmax(data["time"])


# Create TFT LCD display class.
disp = TFT.ILI9341(DC, rst=RST, spi=SPI.SpiDev(SPI_PORT, SPI_DEVICE, max_speed_hz=64000000))

# Initialize display.
disp.begin()

# clear display to black:
disp.clear((0,0,0))

# Get a PIL Draw object to start drawing on the display buffer.
draw = disp.draw()

# Draw graph rectangle
draw.line((plotxy[0], plotxy[1], plotxy[2], plotxy[1]), fill=(255,255,255), width=2)
draw.line((plotxy[2], plotxy[1], plotxy[2], plotxy[3]), fill=(255,255,255), width=2)
draw.line((plotxy[2], plotxy[3], plotxy[0], plotxy[3]), fill=(255,255,255), width=2)
draw.line((plotxy[0], plotxy[3], plotxy[0], plotxy[1]), fill=(255,255,255), width=2)

# horizontal gridlines and labels
offset = (plotxy[2]-plotxy[0]) / 4
for i in range(5):
	if i>0 and i<5:
		draw.line((offset*i, plotxy[1], offset*i, plotxy[3]), fill=(128,128,128))
	draw_rotated_text(disp.buffer, "%3d" % (yrange[0] + ((yrange[1]-yrange[0])/5.0)*i), (plotxy[2]-offset*i-10, plotxy[3]+5), 90, font2, fill=(255,255,255))

# vertical gridlines and labels
offset = (plotxy[3]-plotxy[1]) / 5
for i in range(6):
	if i>0 and i<6:
		draw.line((plotxy[0], plotxy[0] + offset*i, plotxy[2], plotxy[0] + offset*i), fill=(128,128,128))
	draw_rotated_text(disp.buffer, formattime(xrange[0] + ((xrange[1]-xrange[0])/6.0)*i), (plotxy[2], plotxy[3]-offset*i - 15 + 3*i), 90, font2, fill=(255,255,255))



# plot probe temps
plot(data["probe1"], (255,0,0))
plot(data["probe2"], (0, 255,0))
plot(data["probe3"], (0, 0, 255))
plot(data["probe4"], (255,255,0))

# draw text for current probe temps
draw_rotated_text(disp.buffer, "%s: %3d %s" % (data["probe1label"], data["probe1"][0], data["templabel"]), (200, 190), 90, font, fill=(255,0,0))
draw_rotated_text(disp.buffer, "%s: %3d %s" % (data["probe2label"], data["probe2"][0], data["templabel"]), (220, 190), 90, font, fill=(0, 255,0))
draw_rotated_text(disp.buffer, "%s: %3d %s" % (data["probe3label"], data["probe3"][0], data["templabel"]), (200, 20), 90, font, fill=(0, 0, 255))
draw_rotated_text(disp.buffer, "%s: %3d %s" % (data["probe4label"], data["probe4"][0], data["templabel"]), (220, 20), 90, font, fill=(255,255,0))

# Write buffer to display hardware, must be called to make things visible on the display!
disp.display()
