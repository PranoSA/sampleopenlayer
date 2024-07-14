#!/bin/bash

# Read Line by Line through ./download_links.txt

# For Each Line, wget the file

# For Each File, Unzip the file to /usr/share/geoserver/data_dir

# Define the target directory for unzipping files
TARGET_DIR="/usr/share/geoserver/data_dir"

# Check if the download_links.txt file exists
if [ ! -f ./download_links.txt ]; then
    echo "The file download_links.txt does not exist."
    exit 1
fi

# Read each line from download_links.txt
while IFS= read -r line; do
    # Use wget to download the file
    echo "Downloading: $line"
    wget -q "$line" -O temp.zip

    # Check if the download was successful
    if [ $? -eq 0 ]; then
        # Unzip the file to the target directory
        echo "Unzipping to $TARGET_DIR"
        unzip -o temp.zip -d "$TARGET_DIR"
        # Remove the temporary zip file
        rm temp.zip
    else
        echo "Failed to download: $line"
    fi
done <./download_links.txt
