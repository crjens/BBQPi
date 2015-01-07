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
#plotxy = (5,5,185,295)
plotxy = (0,0,225,295)

# load input data
for line in sys.stdin:
  data = json.loads(line)
#  print json.dumps(data)

# Define a function to create rotated text.  Unfortunately PIL doesn't have good
# native support for rotated fonts, but this function can be used to make a 
# text image and rotate it so it's easy to paste in the buffer.
def draw_rotated_text(image, text, position, font, fill=(255,255,255), halign='top', valign='right'):
	# Get rendered font width and height.
	draw = ImageDraw.Draw(image)
	width, height = draw.textsize(text, font=font)
	# Create a new image with transparent background to store the text.
	textimage = Image.new('RGBA', (width, height), (0,0,0,0))
	#textimage = Image.new('RGBA', (width, height), (255,0,0))
	# Render the text.
	textdraw = ImageDraw.Draw(textimage)
	textdraw.text((0,0), text, font=font, fill=fill)
	# Rotate the text image.
	rotated = textimage.rotate(90, expand=1)
	#draw.line((position[0]-5, position[1]-5, position[0]+5, position[1]+5), fill=(255,255,255))
	#draw.line((position[0]-5, position[1]+5, position[0]+5, position[1]-5), fill=(255,255,255))
	# adjust position
	if valign=='center':
		position = (position[0]-height/2, position[1])
	elif valign=='bottom':
		position = (position[0]-height, position[1])
	if halign=='center':
		position = (position[0], position[1]-width/2)
	elif halign=='left':
		position = (position[0], position[1]-width)
	# Paste the text into the image, using it as a mask for transparency.
	image.paste(rotated, position, rotated)
	

# plot temps on graph
def plot(temps, color):
	lastx=0
	lasty=0
	for i,val in enumerate(temps):
		x = plotxy[2] - ((temps[i]-yrange[0])/float(yrange[1]-yrange[0]))*(plotxy[2]-plotxy[0])
		y = plotxy[3] - ((data["time"][i]-xrange[0])/float(xrange[1]-xrange[0]))*(plotxy[3]-plotxy[1])
		draw.rectangle((x-2,y-2,x+2, y+2), fill=color, outline=color)	
		if i>0:
			draw.line((lastx, lasty, x, y), fill=color, width=1)	
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
	time = datetime.datetime.fromtimestamp(timestamp/1000.0)
	if time.hour > 12:
		return "%d:%02d" % (time.hour-12, time.minute)
	else:
		return "%d:%02d" % (time.hour, time.minute)
	#return datetime.datetime.fromtimestamp(timestamp/1000.0).strftime('%I:%M')


# load fonts
font = ImageFont.truetype('fonts/segoeui.ttf', 18)
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
draw.line((plotxy[0], plotxy[1], plotxy[2], plotxy[1]), fill=(255,255,255))
draw.line((plotxy[2], plotxy[1], plotxy[2], plotxy[3]), fill=(255,255,255))
draw.line((plotxy[2], plotxy[3], plotxy[0], plotxy[3]), fill=(255,255,255))
draw.line((plotxy[0], plotxy[3], plotxy[0], plotxy[1]), fill=(255,255,255))

# horizontal gridlines and labels
offset = (plotxy[2]-plotxy[0]) / 4
for i in range(5):
	if i>0 and i<4:
		draw.line((plotxy[2]-offset*i, plotxy[1], plotxy[2]-offset*i, plotxy[3]), fill=(50,50,50))
	if i==0: align='bottom'
	elif i==4: align='top'
	else: align='center'
	draw_rotated_text(disp.buffer, "%3d" % (yrange[0] + ((yrange[1]-yrange[0])/4.0)*i), (plotxy[2]-offset*i, plotxy[3]+5), font2, fill=(255,255,255), valign=align)

# vertical gridlines and labels
offset = (plotxy[3]-plotxy[1]) / 5
for i in range(6):
	if i>0 and i<5:
		draw.line((plotxy[0], plotxy[0] + offset*i, plotxy[2], plotxy[0] + offset*i), fill=(50,50,50))
	if i==0: align='left'
	elif i==5: align='right'
	else: align='center'
	draw_rotated_text(disp.buffer, formattime(xrange[0] + ((xrange[1]-xrange[0])/5.0)*i), (plotxy[2], plotxy[3]-offset*i), font2, fill=(255,255,255), halign=align)



# plot probe temps
plot(data["probe1"], (255,0,0))
plot(data["probe2"], (0, 255,0))
plot(data["probe3"], (0, 0, 255))
plot(data["probe4"], (255,255,0))

# draw text for current probe temps
#draw_rotated_text(disp.buffer, "%s: %3d %s" % (data["probe1label"], data["probe1"][0], data["templabel"]), (200, 310), font, fill=(255,0,0), halign='left')
#draw_rotated_text(disp.buffer, "%s: %3d %s" % (data["probe2label"], data["probe2"][0], data["templabel"]), (220, 310), font, fill=(0, 255,0), halign='left')
#draw_rotated_text(disp.buffer, "%s: %3d %s" % (data["probe3label"], data["probe3"][0], data["templabel"]), (200, 10), font, fill=(0, 0, 255), halign='right')
#draw_rotated_text(disp.buffer, "%s: %3d %s" % (data["probe4label"], data["probe4"][0], data["templabel"]), (220, 10), font, fill=(255,255,0), halign='right')


draw_rotated_text(disp.buffer, "%s: %3d %s" % (data["probe1label"], data["probe1"][len(data["probe1"])-1], data["templabel"]), (10, 280), font, fill=(255,0,0), halign='left')
draw_rotated_text(disp.buffer, "%s: %3d %s" % (data["probe2label"], data["probe2"][len(data["probe2"])-1], data["templabel"]), (30, 280), font, fill=(0, 255,0), halign='left')
draw_rotated_text(disp.buffer, "%s: %3d %s" % (data["probe3label"], data["probe3"][len(data["probe3"])-1], data["templabel"]), (50, 280), font, fill=(0, 0, 255), halign='left')
draw_rotated_text(disp.buffer, "%s: %3d %s" % (data["probe4label"], data["probe4"][len(data["probe4"])-1], data["templabel"]), (70, 280), font, fill=(255,255,0), halign='left')

# Write buffer to display hardware, must be called to make things visible on the display!
disp.display()
