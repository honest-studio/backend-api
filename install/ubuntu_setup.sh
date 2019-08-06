echo "Checking working directory"
BASEDIR=$(basename $(pwd))
if [ "$BASEDIR" != "install" ]; then
    echo "ERROR: You must be inside the install directory"
    exit 1
fi
echo "Done"
echo

echo "Installing MongoDB"
sudo apt install mongodb-org -y
echo "Done"
echo

echo "Installing IPFS"
sudo snap install ipfs
echo "Done"
echo

echo "Installing Webp and HEIC/HEIF stuff"
sudo apt-get install -y libpng-dev libtiff-dev libjpeg-dev libheif-dev build-essential libcairo2-dev
sudo apt-get install -y libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
sudo apt-get install -y webp
echo "Done"
echo

# This should run on install, but just in case
echo "Starting MongoDB"
sudo systemctl start mongodb
echo "Done"
echo

# Initialize IPFS repo
echo "Initializing IPFS repo"
/snap/bin/ipfs init --profile server
echo "Done"
echo

# Create systemd service for ipfs daemon and start it
echo "Creating IPFS systemd service"
mkdir -p ~/.config/systemd/user/
cp ipfs.service ~/.config/systemd/user/
systemctl --user daemon-reload
echo "Starting IPFS daemon"
systemctl --user start ipfs
echo "Done"

# Install NodeJS 11 & NPM
curl -sL https://deb.nodesource.com/setup_11.x | sudo -E bash -
sudo apt install nodejs -y

# Install Redis
sudo apt-get install redis-server

# Install NPM packages
cd ..
npm install
