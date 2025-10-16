# Amazon Linux EC2 Deployment Guide

Complete guide for deploying CineHub Pro to Amazon Linux 2 or Amazon Linux 2023 EC2 instances.

## Table of Contents

- [Prerequisites](#prerequisites)
- [EC2 Instance Setup](#ec2-instance-setup)
- [Manual Deployment](#manual-deployment)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [Environment Variables](#environment-variables)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### AWS Requirements

1. **AWS Account** with EC2 access
2. **EC2 Instance** running Amazon Linux 2 or Amazon Linux 2023
3. **Instance Type**: t2.medium or larger (minimum 2GB RAM)
4. **Storage**: 20GB+ EBS volume
5. **Security Group** with the following inbound rules:
   - SSH (22) - Your IP
   - HTTP (80) - 0.0.0.0/0
   - HTTPS (443) - 0.0.0.0/0
   - Custom TCP (5000) - 0.0.0.0/0

### Required Services

- PostgreSQL database (Neon recommended or RDS)
- TMDB API account
- Cloudinary account
- SendGrid account (optional)
- Twilio account (optional)

## EC2 Instance Setup

### Step 1: Launch EC2 Instance

1. Log in to AWS Console
2. Navigate to EC2 > Instances > Launch Instance
3. Select Amazon Linux 2023 AMI
4. Choose instance type: `t2.medium` or larger
5. Configure Security Group (see Prerequisites)
6. Create or select a key pair for SSH access
7. Launch instance

### Step 2: Connect to Instance

```bash
# SSH into your instance
ssh -i /path/to/your-key.pem ec2-user@your-ec2-ip-address
```

### Step 3: Update System

For **Amazon Linux 2023**:
```bash
sudo dnf update -y
sudo dnf upgrade -y
```

For **Amazon Linux 2**:
```bash
sudo yum update -y
sudo yum upgrade -y
```

### Step 4: Install Node.js 20

```bash
# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### Step 5: Install Git

```bash
sudo yum install -y git
```

### Step 6: Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2@latest

# Configure PM2 to start on system boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user

# Enable PM2 service
sudo systemctl enable pm2-ec2-user
```

### Step 7: Configure Firewall (Optional)

Amazon Linux uses `firewalld` (if installed):

```bash
# Check if firewalld is running
sudo systemctl status firewalld

# If running, open necessary ports
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

## Manual Deployment

### Step 1: Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www/cinehub-pro
sudo chown -R ec2-user:ec2-user /var/www/cinehub-pro

# Clone repository
cd /var/www/cinehub-pro
git clone https://github.com/yourusername/cinehub-pro.git .
```

### Step 2: Install Dependencies

```bash
# Install production dependencies
npm ci --production --omit=dev
```

### Step 3: Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add the following (update with your values):

```env
# Environment
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Session & JWT
SESSION_SECRET=your-secret-key-32-chars-minimum
JWT_ACCESS_SECRET=your-jwt-access-secret-32-chars
JWT_REFRESH_SECRET=your-jwt-refresh-secret-32-chars

# TMDB
TMDB_API_KEY=your-tmdb-api-key
TMDB_ACCESS_TOKEN=your-tmdb-access-token

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Optional)
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=CineHub Pro

# SMS (Optional)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-phone-number

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Admin User
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@cinehubpro.com
ADMIN_PASSWORD=secure-admin-password
```

Save the file (Ctrl+X, Y, Enter)

### Step 4: Build Application

```bash
# Build frontend and backend
npm run build
```

### Step 5: Run Database Migration

```bash
# Push database schema
npm run db:push
```

### Step 6: Start with PM2

```bash
# Start application
pm2 start npm --name "cinehub-pro" -- start

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs cinehub-pro
```

### Step 7: Configure Nginx Reverse Proxy (Recommended)

Install Nginx:
```bash
sudo yum install -y nginx
```

Create Nginx configuration:
```bash
sudo nano /etc/nginx/conf.d/cinehub-pro.conf
```

Add configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js app
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable and start Nginx:
```bash
# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Restart Nginx
sudo systemctl restart nginx
```

## GitHub Actions CI/CD

### Step 1: Generate SSH Key Pair

On your local machine:
```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -f ~/.ssh/cinehub-deploy-key

# This creates:
# - Private key: ~/.ssh/cinehub-deploy-key
# - Public key: ~/.ssh/cinehub-deploy-key.pub
```

### Step 2: Add Public Key to EC2

```bash
# Copy public key content
cat ~/.ssh/cinehub-deploy-key.pub

# SSH to EC2 and add to authorized_keys
ssh -i /path/to/your-key.pem ec2-user@your-ec2-ip
nano ~/.ssh/authorized_keys
# Paste the public key on a new line
```

### Step 3: Configure GitHub Secrets

Go to GitHub: Repository > Settings > Secrets and variables > Actions

Add the following secrets:

**EC2 Deployment Secrets:**
- `PRODUCTION_EC2_HOST`: Your EC2 public IP or domain
- `PRODUCTION_EC2_USER`: `ec2-user`
- `PRODUCTION_EC2_SSH_KEY`: Contents of `~/.ssh/cinehub-deploy-key` (private key)
- `PRODUCTION_APP_DIR`: `/var/www/cinehub-pro`
- `PRODUCTION_URL`: `http://yourdomain.com`

**Staging (Optional):**
- `STAGING_EC2_HOST`: Staging EC2 IP
- `STAGING_EC2_USER`: `ec2-user`
- `STAGING_EC2_SSH_KEY`: Staging private key
- `STAGING_APP_DIR`: `/var/www/cinehub-pro-staging`
- `STAGING_URL`: `http://staging.yourdomain.com`

**Application Secrets:**
- `DATABASE_URL`: Production database connection string
- `TEST_DATABASE_URL`: Test database connection string
- `SESSION_SECRET`: 32+ character random string
- `JWT_ACCESS_SECRET`: 32+ character random string
- `JWT_REFRESH_SECRET`: 32+ character random string
- `TMDB_API_KEY`: TMDB API key
- `TMDB_ACCESS_TOKEN`: TMDB access token
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret

**Optional Secrets:**
- `SENDGRID_API_KEY`: SendGrid API key
- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `CODECOV_TOKEN`: Codecov token (optional)

### Step 4: Trigger Deployment

```bash
# Push to main/production branch
git push origin main

# Or trigger manually from GitHub Actions tab
```

### Step 5: Monitor Deployment

1. Go to GitHub > Actions
2. Click on the latest workflow run
3. Monitor each job's progress
4. Check deployment logs

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Application port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `SESSION_SECRET` | Session secret (32+ chars) | `your-secret-key` |
| `JWT_ACCESS_SECRET` | JWT access secret | `jwt-access-secret` |
| `JWT_REFRESH_SECRET` | JWT refresh secret | `jwt-refresh-secret` |
| `TMDB_API_KEY` | TMDB API key | `your-api-key` |
| `TMDB_ACCESS_TOKEN` | TMDB access token | `your-token` |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `CLOUDINARY_*` | Image hosting credentials |
| `SENDGRID_*` | Email service credentials |
| `TWILIO_*` | SMS service credentials |
| `GOOGLE_CLIENT_*` | Google OAuth |
| `FACEBOOK_APP_*` | Facebook OAuth |
| `GITHUB_CLIENT_*` | GitHub OAuth |

## SSL/HTTPS Setup

### Using Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run

# Set up auto-renewal (cron)
sudo crontab -e
# Add line:
0 12 * * * /usr/bin/certbot renew --quiet
```

The Nginx configuration will be automatically updated by Certbot.

### Manual SSL Certificate

If using a purchased SSL certificate:

```bash
# Upload certificates to server
scp -i /path/to/key.pem /path/to/certificate.crt ec2-user@ip:/tmp/
scp -i /path/to/key.pem /path/to/private.key ec2-user@ip:/tmp/

# Move to appropriate location
sudo mkdir -p /etc/nginx/ssl
sudo mv /tmp/certificate.crt /etc/nginx/ssl/
sudo mv /tmp/private.key /etc/nginx/ssl/
sudo chmod 600 /etc/nginx/ssl/*
```

Update Nginx configuration:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/certificate.crt;
    ssl_certificate_key /etc/nginx/ssl/private.key;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Monitoring

### PM2 Monitoring

```bash
# View application status
pm2 status

# View logs
pm2 logs cinehub-pro

# View specific logs
pm2 logs cinehub-pro --lines 100

# Monitor resources
pm2 monit
```

### System Monitoring

```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check running processes
ps aux | grep node
```

### Application Logs

```bash
# Application logs
tail -f /var/www/cinehub-pro/logs/app.log

# PM2 logs
tail -f ~/.pm2/logs/cinehub-pro-out.log
tail -f ~/.pm2/logs/cinehub-pro-error.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 status
pm2 status

# View error logs
pm2 logs cinehub-pro --err

# Check Node.js version
node --version  # Should be 20.x

# Verify environment variables
cat .env | grep -v PASSWORD
```

### Database Connection Issues

```bash
# Test database connection
psql $DATABASE_URL

# Check if DATABASE_URL is set
echo $DATABASE_URL

# Verify .env file
cat /var/www/cinehub-pro/.env | grep DATABASE_URL
```

### Port Already in Use

```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>

# Restart PM2
pm2 restart cinehub-pro
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Test certificate
sudo certbot certificates

# Force renew
sudo certbot renew --force-renewal

# Check expiration
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Deployment Failures

```bash
# Check GitHub Actions logs
# Go to GitHub > Actions > Latest run

# Verify SSH connection
ssh -i ~/.ssh/deploy_key ec2-user@your-ec2-ip

# Check deployment artifacts
ls -la /tmp/deploy-*.tar.gz

# Verify permissions
ls -la /var/www/cinehub-pro
```

### Performance Issues

```bash
# Check PM2 process
pm2 show cinehub-pro

# Increase Node.js memory
pm2 delete cinehub-pro
pm2 start npm --name "cinehub-pro" --node-args="--max-old-space-size=2048" -- start

# Check database queries
# Enable query logging in .env:
# DATABASE_LOGGING=true
```

### Rollback Deployment

```bash
# SSH to EC2
ssh -i /path/to/key.pem ec2-user@your-ec2-ip

# Navigate to app directory
cd /var/www/cinehub-pro

# List backups
ls -la backups/

# Restore from backup
cp -r backups/backup-YYYYMMDD-HHMMSS/dist .
cp backups/backup-YYYYMMDD-HHMMSS/package.json .

# Reinstall dependencies
npm ci --production --omit=dev

# Restart application
pm2 restart cinehub-pro
```

## Maintenance

### Regular Updates

```bash
# Update system packages
sudo yum update -y

# Update Node.js dependencies
npm update

# Rebuild application
npm run build

# Restart with zero downtime
pm2 reload cinehub-pro
```

### Backup Strategy

```bash
# Create backup script
nano ~/backup.sh
```

Add:
```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/var/backups/cinehub-pro"
APP_DIR="/var/www/cinehub-pro"

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/backup-$TIMESTAMP.tar.gz \
  $APP_DIR/dist \
  $APP_DIR/.env \
  $APP_DIR/package.json

# Keep only last 7 backups
ls -t $BACKUP_DIR/backup-*.tar.gz | tail -n +8 | xargs rm -f
```

Make executable and schedule:
```bash
chmod +x ~/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /home/ec2-user/backup.sh
```

## Security Best Practices

1. **Keep system updated**: `sudo yum update -y`
2. **Use strong passwords**: Generate with `openssl rand -base64 32`
3. **Restrict SSH access**: Update Security Group to your IP only
4. **Enable firewall**: Configure firewalld or AWS Security Groups
5. **Use HTTPS**: Install SSL certificate with Let's Encrypt
6. **Regular backups**: Automate with cron
7. **Monitor logs**: Check regularly for suspicious activity
8. **Update dependencies**: Run `npm audit fix` regularly

## Support

For issues specific to Amazon Linux deployment:

- AWS Documentation: https://docs.aws.amazon.com/linux/
- PM2 Documentation: https://pm2.keymetrics.io/docs/
- Nginx Documentation: https://nginx.org/en/docs/

For application issues:
- GitHub Issues: https://github.com/yourusername/cinehub-pro/issues
- Email: support@cinehubpro.com

---

**Last Updated**: January 2025
