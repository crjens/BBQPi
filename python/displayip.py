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


# load input data
for line in sys.stdin:
  data = json.loads(line)

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
	



# load fonts
font = ImageFont.truetype('fonts/segoeui.ttf', 26)

# Create TFT LCD display class.
disp = TFT.ILI9341(DC, rst=RST, spi=SPI.SpiDev(SPI_PORT, SPI_DEVICE, max_speed_hz=64000000))

# Initialize display.
disp.begin()

# clear display to black:
disp.clear((0,0,0))

# Get a PIL Draw object to start drawing on the display buffer.
draw = disp.draw()


for i, val in enumerate(data):
	draw_rotated_text(disp.buffer, val, (17 + i*30, 160), font, fill=(255,255,255), halign='center')

# Write buffer to display hardware, must be called to make things visible on the display!
disp.display()
