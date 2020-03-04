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
# sudo yum update
# sudo yum install -y libtiff-devel libpng-devel libheif-devel cairo cairo-devel cairomm-devel libjpeg-turbo-devel pango 
# sudo yum install -y pango-devel librsvg2
sudo apt-get install -y libpng-dev libtiff-dev libjpeg-dev libheif-dev build-essential libcairo2-dev
sudo apt-get install -y libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
sudo apt-get install -y webp libvips-dev
echo "Done"
echo

echo "Installing PhantomJS Stuff"
# sudo yum install -y glibc fontconfig fontconfig-devel freetype freetype-devel wget bzip2
# wget https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2
# sudo tar xvjf phantomjs-2.1.1-linux-x86_64.tar.bz2 -C /usr/local/share/
# sudo ln -sf /usr/local/share/phantomjs-2.1.1-linux-x86_64/bin/phantomjs /usr/local/bin
# sudo apt-get install build-essential chrpath libssl-dev libxft-dev
# sudo apt-get install libfreetype6 libfreetype6-dev
# sudo apt-get install libfontconfig1 libfontconfig1-dev

echo "Done"
echo

echo "Installing Handbrake-js stuff"
# cd ~
# sudo yum groupinstall -y "Development Tools" "Additional Development"
# sudo yum install -y fribidi-devel git jansson-devel libogg-devel libsamplerate-devel libtheora-devel libvorbis-devel opus-devel speex-devel xz-devel
# sudo yum install -y epel-release
# sudo yum install -y libass-devel yasm
# sudo yum localinstall -y $(curl -L -s 'https://dl.fedoraproject.org/pub/epel/6/x86_64/Packages/o/' | grep -Eo 'opus-[^">]+\.x86_64\.rpm' | sort -u | awk '{ print "https://dl.fedoraproject.org/pub/epel/6/x86_64/Packages/o/"$0 }')
# sudo curl -L 'https://nasm.us/nasm.repo' -o /etc/yum.repos.d/nasm.repo
# sudo yum install -y nasm
# sudo yum localinstall -y --nogpgcheck https://download1.rpmfusion.org/free/el/rpmfusion-free-release-7.noarch.rpm
# sudo yum install -y lame-devel x264-devel
# sudo yum install -y centos-release-scl
# sudo yum install -y devtoolset-7
# sudo scl enable devtoolset-7 bash
# git clone https://github.com/HandBrake/HandBrake.git && cd HandBrake
# git tag --list | grep ^1\.2\.
# git checkout refs/tags/$(git tag -l | grep -E '^1\.2\.[0-9]+$' | tail -n 1)
# ./configure --launch-jobs=$(nproc) --launch --disable-gtk
# sudo make --directory=build install
sudo add-apt-repository --yes ppa:stebbins/handbrake-releases
sudo apt-get update -qq
sudo apt-get install -qq handbrake-cli
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
npm install -g imagemin-cli --unsafe-perm=true --allow-root
npm install
