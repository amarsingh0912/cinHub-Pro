# Deployment Guide

Complete guide for deploying CineHub Pro to production environments, including EC2 deployment with GitHub Actions.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [EC2 Deployment](#ec2-deployment)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Services

1. **AWS EC2 Instance**
   - Ubuntu 22.04 LTS or later
   - t2.medium or larger (2GB+ RAM recommended)
   - 20GB+ storage
   - Security group with ports 22, 80, 443, and 5000 open

2. **Domain Name**
   - Registered domain
   - DNS configured to point to EC2 instance

3. **PostgreSQL Database**
   - Neon (recommended) or self-hosted PostgreSQL
   - Database created and accessible

4. **Third-party Services**
   - TMDB API account
   - Cloudinary account
   - SendGrid account (optional)
   - Twilio account (optional)

## Environment Setup

### 1. Local Development Environment

Ensure your local environment is properly configured:

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Test production build locally
npm start
```

### 2. Production Environment Variables

Create a `.env.production` file with production values:

```env
# Environment
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Session
SESSION_SECRET=<generate-strong-secret-32-chars>

# TMDB
TMDB_API_KEY=<your-tmdb-api-key>
TMDB_ACCESS_TOKEN=<your-tmdb-access-token>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Email (SendGrid)
SENDGRID_API_KEY=<your-sendgrid-key>
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=<your-account-sid>
TWILIO_AUTH_TOKEN=<your-auth-token>
TWILIO_PHONE_NUMBER=<your-phone-number>

# OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
FACEBOOK_APP_ID=<your-facebook-app-id>
FACEBOOK_APP_SECRET=<your-facebook-app-secret>
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>

# Application URLs
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

### Generate Secure Secrets

```bash
# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Database Setup

### Using Neon (Recommended)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Create a database
4. Copy connection string to `DATABASE_URL`
5. Run migrations:

```bash
npm run db:push
```

### Self-hosted PostgreSQL

1. Install PostgreSQL on your server:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

2. Create database and user:

```sql
CREATE DATABASE cinehub;
CREATE USER cinehub_user WITH ENCRYPTED PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE cinehub TO cinehub_user;
```

3. Configure PostgreSQL for remote connections (if needed)
4. Update `DATABASE_URL` with connection string
5. Run migrations

## EC2 Deployment

### 1. Launch EC2 Instance

1. Go to AWS Console → EC2
2. Click "Launch Instance"
3. Choose Ubuntu Server 22.04 LTS
4. Select t2.medium or larger
5. Configure security group:
   - SSH (22) - Your IP
   - HTTP (80) - 0.0.0.0/0
   - HTTPS (443) - 0.0.0.0/0
   - Custom TCP (5000) - 0.0.0.0/0
6. Create/select key pair for SSH
7. Launch instance

### 2. Connect to EC2

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### 3. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx
```

### 4. Clone Repository

```bash
# Create app directory
mkdir -p /var/www
cd /var/www

# Clone your repository
git clone https://github.com/yourusername/cinehub-pro.git
cd cinehub-pro

# Install dependencies
npm install

# Build application
npm run build
```

### 5. Configure Environment

```bash
# Create .env file
nano .env

# Paste your production environment variables
# Save with Ctrl+X, Y, Enter
```

### 6. Set Up PM2

```bash
# Start application with PM2
pm2 start npm --name "cinehub-pro" -- start

# Save PM2 process list
pm2 save

# Set PM2 to start on boot
pm2 startup systemd
# Follow the generated command output
```

### 7. Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/cinehub-pro
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable the configuration:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/cinehub-pro /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## GitHub Actions CI/CD

### 1. Set Up GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:
- `EC2_HOST`: Your EC2 public IP or domain
- `EC2_USERNAME`: ubuntu
- `EC2_SSH_KEY`: Contents of your .pem key file
- All environment variables (DATABASE_URL, TMDB_API_KEY, etc.)

### 2. Create Deployment Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to EC2

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build

      - name: Deploy to EC2
        env:
          SSH_PRIVATE_KEY: ${{ secrets.EC2_SSH_KEY }}
          HOST: ${{ secrets.EC2_HOST }}
          USER: ${{ secrets.EC2_USERNAME }}
        run: |
          # Set up SSH
          mkdir -p ~/.ssh
          echo "$SSH_PRIVATE_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H $HOST >> ~/.ssh/known_hosts

          # Create deployment package
          tar -czf deploy.tar.gz dist package.json package-lock.json

          # Transfer to EC2
          scp -i ~/.ssh/deploy_key deploy.tar.gz $USER@$HOST:/tmp/

          # Deploy on EC2
          ssh -i ~/.ssh/deploy_key $USER@$HOST << 'ENDSSH'
            cd /var/www/cinehub-pro
            
            # Backup current version
            cp -r dist dist.backup
            
            # Extract new version
            tar -xzf /tmp/deploy.tar.gz
            
            # Install production dependencies
            npm ci --production
            
            # Restart application
            pm2 restart cinehub-pro
            
            # Clean up
            rm /tmp/deploy.tar.gz
          ENDSSH

      - name: Health check
        run: |
          sleep 10
          curl -f http://${{ secrets.EC2_HOST }} || exit 1
```

### 3. Alternative: Deploy Script

Create `scripts/deploy.sh`:

```bash
#!/bin/bash

# Configuration
SERVER_USER="ubuntu"
SERVER_HOST="your-ec2-ip"
APP_DIR="/var/www/cinehub-pro"
SSH_KEY="path/to/your-key.pem"

echo "Building application..."
npm run build

echo "Creating deployment package..."
tar -czf deploy.tar.gz dist package.json package-lock.json .env.production

echo "Transferring files to server..."
scp -i $SSH_KEY deploy.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/

echo "Deploying on server..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_HOST << 'ENDSSH'
  cd /var/www/cinehub-pro
  
  # Backup current version
  cp -r dist dist.backup
  
  # Extract new version
  tar -xzf /tmp/deploy.tar.gz
  
  # Copy environment file
  cp .env.production .env
  
  # Install dependencies
  npm ci --production
  
  # Restart application
  pm2 restart cinehub-pro
  
  # Clean up
  rm /tmp/deploy.tar.gz
ENDSSH

echo "Deployment complete!"
rm deploy.tar.gz
```

Make executable and run:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Free)

1. Install Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
```

2. Obtain SSL certificate:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

3. Follow prompts to configure HTTPS redirect

4. Test auto-renewal:

```bash
sudo certbot renew --dry-run
```

Certbot automatically renews certificates before expiry.

### Update Nginx Configuration

Certbot automatically updates Nginx, but verify:

```bash
sudo nano /etc/nginx/sites-available/cinehub-pro
```

Should include:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # ... rest of configuration
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Monitoring

### PM2 Monitoring

```bash
# View application logs
pm2 logs cinehub-pro

# Monitor application
pm2 monit

# View application status
pm2 status

# Restart application
pm2 restart cinehub-pro
```

### Set Up Log Rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### System Monitoring

```bash
# Install monitoring tools
sudo apt install htop

# View system resources
htop

# View disk usage
df -h

# View memory usage
free -h
```

### Application Health Check

Create a simple health check endpoint:

```bash
# Check application health
curl http://localhost:5000/api/health

# Set up automated health check
(crontab -l 2>/dev/null; echo "*/5 * * * * curl -f http://localhost:5000/api/health || pm2 restart cinehub-pro") | crontab -
```

## Troubleshooting

### Application Won't Start

1. Check PM2 logs:
```bash
pm2 logs cinehub-pro --lines 100
```

2. Verify environment variables:
```bash
pm2 env cinehub-pro
```

3. Check database connection:
```bash
psql $DATABASE_URL
```

### Nginx Issues

1. Test configuration:
```bash
sudo nginx -t
```

2. Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

3. Restart Nginx:
```bash
sudo systemctl restart nginx
```

### SSL Certificate Issues

1. Check certificate status:
```bash
sudo certbot certificates
```

2. Renew certificate manually:
```bash
sudo certbot renew
```

### Database Issues

1. Check connection:
```bash
psql $DATABASE_URL -c "SELECT version();"
```

2. Run migrations:
```bash
npm run db:push
```

### Performance Issues

1. Increase Node.js memory:
```bash
pm2 start npm --name "cinehub-pro" -- start --node-args="--max-old-space-size=2048"
```

2. Enable PM2 cluster mode:
```bash
pm2 start npm --name "cinehub-pro" -i max -- start
```

3. Monitor resources:
```bash
pm2 monit
```

## Maintenance

### Regular Updates

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Restart application
pm2 restart cinehub-pro
```

### Database Backups

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/cinehub"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql
# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/cinehub-pro/backup.sh") | crontab -
```

### Security Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
npm audit fix

# Update PM2
npm install -g pm2@latest
pm2 update
```

## Rollback Procedure

If deployment fails:

```bash
# SSH to server
ssh -i your-key.pem ubuntu@your-ec2-ip

# Go to app directory
cd /var/www/cinehub-pro

# Restore previous version
rm -rf dist
mv dist.backup dist

# Restart application
pm2 restart cinehub-pro
```

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
