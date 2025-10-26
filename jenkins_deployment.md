# 📘 Jenkins Deployment Documentation for Dashboard Project

# 1. Launch EC2 Instance
>>> Creating EC2 Instace.
>>> Configure Security Group: 
        - 22 (SSH) – from your IP.
        - 80 (HTTP) – from your IP.
        - 443 (HTTPS) – from your IP.
        - 8080 (Jenkins UI) – from your IP.
>>> Create and Download the .pem file

# 2. Install System Dependencies on EC2 Server login using IP and .pem file on ModaXtream, Putty....
>>>Update system:
- sudo apt update && sudo apt upgrade -y 

>>>Install required tools:
- sudo apt install -y curl git unzip

>>>Install Java (Required for Jenkins):
- sudo apt install fontconfig openjdk-17-jre -y
- java -version

>>>Add Jenkins repo:
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null

echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/" | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

>>>Install Jenkins:
- sudo apt update
- sudo apt install jenkins -y

>>>Enable, Start and Status ofJenkins:
- sudo systemctl enable jenkins
- sudo systemctl start jenkins
- sudo systemctl status jenkins

# 1️⃣ Update packages
sudo apt update

# 2️⃣ Install dependencies
sudo apt install ca-certificates curl gnupg lsb-release -y

# 3️⃣ Add Docker’s official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# 4️⃣ Add Docker repository to APT sources
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5️⃣ Update apt again
sudo apt update

# 6️⃣ Install Docker Engine + CLI + Compose plugin
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

# 7️⃣ Enable and start Docker
sudo systemctl enable docker
sudo systemctl start docker

# 8️⃣ Verify installation
docker --version
docker compose version

👤 Give permission to your user
sudo usermod -aG docker $USER


(Then logout and login again or run newgrp docker)

✅ Test Docker
docker run hello-world



>>>Give Jenkins user permission:
- sudo usermod -aG docker jenkins
- sudo systemctl restart jenkins

>> Option 1: Run with sudo
- sudo docker-compose up -d --build

>> Option 2: Add your user to the docker group (recommended for convenience)
- sudo usermod -aG docker $USER {Add your user (ubuntu) to the Docker group:}
- newgrp docker


# 3. Open Jenkies UI and Setup and install required plugins
>>> Open Browser "http://<EC2-PUBLIC-IP>:8080"
>>>Get initial password: Run below cmd in EC2 Server terminal to get password 
- sudo cat /var/lib/jenkins/secrets/initialAdminPassword
>>> Complete setup wizard: Install suggested plugins, Create Admin user
>>> Required Plugins for Deployement
- Git Plugin 
- Pipeline Plugin
- Credentials Binding Plugin
- SSH Agent Plugin
- Docker Pipeline Plugin
>>>Add Credentials:
- GitHub (Personal Access Token or username/password).

# 4. Run Jenkies file 
- Create the CI/CD Pipeline file. Uses Github for script when you run the build script automatically jenkies script will run.
- Come back to terminal give permission to <deploy.sh> file for execute using <chmod +x /home/ubuntu/microserivce/deploy.sh>


  
# 5. About storage problem
   Go through the <Storage-Prob.md> file for solution

  - df -h
  - lsblk
  🧩 Step 1: Identify the correct disk

  From your lsblk output:

  NAME     MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
  xvda     202:0    0   17G  0 disk
  ├─xvda1  202:1    0    7G  0 part /
  ├─xvda14 202:14   0    4M  0 part
  ├─xvda15 202:15   0  106M  0 part /boot/efi
  └─xvda16 259:0    0  913M  0 part /boot

  ✅ Step 2: Correct growpart command

  You used /dev/nvme0n1, but your EC2 uses xvda, not nvme.
  So run this instead:

  - sudo growpart /dev/xvda 1

  ✅ Step 3: Resize the filesystem

  After growing the partition, you must also resize the filesystem to use the extra space:

  If your root filesystem is ext4, run:

  - sudo resize2fs /dev/xvda1

  ✅ Step 4: Verify

  Check the new size with:

  - df -h



--------------------
- sudo apt-get update
- sudo apt-get install ca-certificates curl gnupg -y

- sudo install -m 0755 -d /etc/apt/keyrings
- sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
- sudo chmod a+r /etc/apt/keyrings/docker.asc

- echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

- sudo apt-get update
- sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
- docker compose version
- sudo usermod -aG docker $USER

- sudo docker compose up -d --build

-------------------

# Completely remove all old Docker containers, images, volumes, and networks to start fresh, here’s the safest step-by-step way 

1️⃣ Stop all running containers
- sudo docker stop $(sudo docker ps -aq)
2️⃣ Remove all stopped containers
- sudo docker rm $(sudo docker ps -aq)
3️⃣ Remove all Docker images
- sudo docker rmi -f $(sudo docker images -q)
4️⃣ Remove all Docker volumes
- sudo docker volume prune -f
5️⃣ Remove all Docker networks
- sudo docker network prune -f
6️⃣ Optional: Remove dangling build cache
- sudo docker builder prune -a -f

>> sudo docker compose up -d --build

