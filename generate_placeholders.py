#!/usr/bin/env python3

import os
from PIL import Image, ImageDraw

def ensure_dir(directory):
    """Make sure a directory exists"""
    if not os.path.exists(directory):
        os.makedirs(directory)

def create_favicon():
    """Create a simple favicon.png file"""
    print("Creating favicon.png...")
    
    # Ensure the static directory exists
    ensure_dir("static")
    
    # Create a 32x32 black image
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a simple game controller icon
    # Main body
    draw.rectangle([(8, 12), (24, 20)], fill=(50, 120, 220))
    
    # Left circle
    draw.ellipse([(4, 8), (12, 16)], fill=(50, 120, 220))
    
    # Right circle
    draw.ellipse([(20, 8), (28, 16)], fill=(50, 120, 220))
    
    # D-pad
    draw.rectangle([(6, 18), (10, 22)], fill=(30, 90, 180))
    
    # Buttons
    draw.ellipse([(22, 18), (24, 20)], fill=(255, 50, 50))
    draw.ellipse([(25, 18), (27, 20)], fill=(50, 255, 50))
    
    # Save the image
    img.save("static/favicon.png")
    print("Favicon created at static/favicon.png")

def create_player_sprite():
    """Create a placeholder player sprite sheet"""
    print("Creating player sprite sheet...")
    
    # Ensure the sprites directory exists
    sprite_dir = "static/assets/sprites"
    ensure_dir(sprite_dir)
    
    # Create a 128x64 transparent image (4 frames x 32px for idle and walk animations)
    sprite_width = 32 * 4  # 4 frames per animation
    sprite_height = 32 * 2  # 2 animations (idle and walk)
    
    img = Image.new('RGBA', (sprite_width, sprite_height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw frames for idle animation (top row)
    colors = [(100, 100, 255), (120, 120, 255), (140, 140, 255), (160, 160, 255)]
    
    for i in range(4):
        x_offset = i * 32
        # Draw player body
        draw.rectangle([(x_offset + 8, 4), (x_offset + 24, 28)], fill=colors[i])
        # Draw player head
        draw.ellipse([(x_offset + 11, 0), (x_offset + 21, 10)], fill=colors[i])
        # Draw player eyes
        draw.ellipse([(x_offset + 13, 3), (x_offset + 15, 5)], fill=(255, 255, 255))
        draw.ellipse([(x_offset + 17, 3), (x_offset + 19, 5)], fill=(255, 255, 255))
    
    # Draw frames for walk animation (bottom row)
    for i in range(4):
        x_offset = i * 32
        y_offset = 32  # Second row
        # Draw player body
        draw.rectangle([(x_offset + 8, y_offset + 4), (x_offset + 24, y_offset + 28)], fill=colors[i])
        # Draw player head
        draw.ellipse([(x_offset + 11, y_offset + 0), (x_offset + 21, y_offset + 10)], fill=colors[i])
        # Draw player eyes
        draw.ellipse([(x_offset + 13, y_offset + 3), (x_offset + 15, y_offset + 5)], fill=(255, 255, 255))
        draw.ellipse([(x_offset + 17, y_offset + 3), (x_offset + 19, y_offset + 5)], fill=(255, 255, 255))
        
        # Add walking animation by offsetting the legs
        leg_offset = [4, 0, -4, 0][i]  # Different leg positions for each frame
        draw.rectangle([(x_offset + 12 + leg_offset, y_offset + 28), (x_offset + 16 + leg_offset, y_offset + 31)], fill=colors[i])
        draw.rectangle([(x_offset + 16 - leg_offset, y_offset + 28), (x_offset + 20 - leg_offset, y_offset + 31)], fill=colors[i])
    
    # Save the image
    img.save(f"{sprite_dir}/player.png")
    print(f"Player sprite sheet created at {sprite_dir}/player.png")

if __name__ == "__main__":
    create_favicon()
    create_player_sprite()
    print("All placeholder images have been generated successfully!") 