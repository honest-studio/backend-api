echo "Checking working directory"
BASEDIR=$(basename $(pwd))
if [ "$BASEDIR" != "install" ]; then
    echo "ERROR: You must be inside the install directory"
    exit 1
fi
echo "Done"
echo

echo "Installing MongoDB"
sudo apt install mongodb 
echo "Done"
echo

echo "Installing IPFS"
sudo snap install ipfs
echo "Done"
echo

# This should run on install, but just in case
echo "Starting MongoDB"
sudo systemctl start mongodb
echo "Done"
echo

# Initialize IPFS repo
echo "Initializing IPFS repo"
/snap/bin/ipfs init
echo "Done"
echo

# Create systemd service for ipfs daemon and start it
echo "Creating IPFS systemd service"
sudo cp ipfs.service /etc/systemd/system/ipfs.service
sudo systemctl daemon-reload
echo "Starting IPFS daemon"
sudo systemctl start ipfs
echo "Done"
