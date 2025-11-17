# GitHub Actions Deployment Guide

This guide explains how to deploy CineHub Pro to Amazon Linux 2023 EC2 instances using GitHub Actions.

## Available Workflows

### 1. Production Deployment (`deploy.yml`)
- **Trigger**: Push to `main` branch or manual dispatch
- **Mode**: Production (builds and optimizes code)
- **Process**: Builds the app, creates optimized bundles, deploys via PM2

### 2. Development Deployment (`deploy-dev.yml`)
- **Trigger**: Push to `develop` or `dev` branch or manual dispatch
- **Mode**: Development (runs with hot reload)
- **Process**: Clones/pulls code, installs dependencies, runs `npm run dev` via PM2

## Prerequisites

### 1. EC2 Instance Setup (Amazon Linux 2023)

1. **Launch EC2 Instance**
   - AMI: Amazon Linux 2023
   - Instance type: t3.small or larger (recommended)
   - Security group: Allow SSH (port 22) and HTTP/HTTPS (ports 80/443 or your app port)

2. **Connect to your instance**
   ```bash
   ssh -i your-key.pem ec2-user@your-ec2-ip
   ```

3. **Install Git** (if not already installed)
   ```bash
   sudo yum update -y
   sudo yum install -y git
   ```

4. **Create application directory**
   ```bash
   # For production
   sudo mkdir -p /var/www/cinehub-pro
   sudo chown ec2-user:ec2-user /var/www/cinehub-pro
   
   # For development
   sudo mkdir -p /var/www/cinehub-pro-dev
   sudo chown ec2-user:ec2-user /var/www/cinehub-pro-dev
   ```

5. **Create environment file**
   ```bash
   # For production
   nano /var/www/cinehub-pro/.env
   
   # For development
   nano /var/www/cinehub-pro-dev/.env
   ```
   
   Add your environment variables:
   ```env
   NODE_ENV=development  # or production
   PORT=5000
   DATABASE_URL=your_database_url
   SESSION_SECRET=your_session_secret
   # Add other required environment variables
   ```

### 2. GitHub Repository Setup

#### Required GitHub Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

**Common Secrets (required for both workflows):**

| Secret Name | Description | Example |
|------------|-------------|---------|
| `EC2_SSH_KEY` | Private SSH key for EC2 access | Contents of your `.pem` file |
| `EC2_HOST` | EC2 instance public IP or hostname | `54.123.45.67` or `ec2-xxx.compute.amazonaws.com` |
| `EC2_USER` | SSH username | `ec2-user` (default for Amazon Linux) |

**Production-Specific Secrets:**

| Secret Name | Description | Example | Default |
|------------|-------------|---------|---------|
| `APP_DIR` | Production deployment directory | `/var/www/cinehub-pro` | `/var/www/cinehub-pro` |
| `APP_NAME` | PM2 process name for production | `cinehub-pro` | `cinehub-pro` |
| `APP_PORT` | Application port | `5000` | `5000` |

**Development-Specific Secrets:**

| Secret Name | Description | Example | Default |
|------------|-------------|---------|---------|
| `APP_DIR` | Development deployment directory | `/var/www/cinehub-pro-dev` | `/var/www/cinehub-pro-dev` |
| `APP_NAME` | PM2 process name for development | `cinehub-pro-dev` | `cinehub-pro-dev` |
| `GIT_REPO` | Git repository URL | `https://github.com/username/repo.git` | Required |
| `GIT_BRANCH` | Git branch to deploy | `develop` | `develop` |
| `APP_PORT` | Application port | `5000` | `5000` |

#### How to Get Your SSH Private Key

1. If you already have a `.pem` file from AWS:
   ```bash
   cat your-key.pem
   ```
   Copy the entire output including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`

2. If you need to create a new key pair:
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/ec2_deploy_key
   ```
   Then add the public key to your EC2 instance's `~/.ssh/authorized_keys`

## Usage

### Deploying to Development

1. **Automatic Deployment**: Push to `develop` or `dev` branch
   ```bash
   git checkout develop
   git add .
   git commit -m "Your changes"
   git push origin develop
   ```

2. **Manual Deployment**: 
   - Go to GitHub Actions tab
   - Select "Deploy to EC2 (Development Mode)"
   - Click "Run workflow"
   - Select branch and run

### Deploying to Production

1. **Automatic Deployment**: Push or merge to `main` branch
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

2. **Manual Deployment**:
   - Go to GitHub Actions tab
   - Select "Deploy to Amazon Linux 2023 (SSR)"
   - Click "Run workflow"
   - Select branch and run

## What Each Workflow Does

### Development Workflow (`deploy-dev.yml`)

1. **Setup SSH**: Configures SSH key for secure connection
2. **Deploy to EC2**:
   - Clones repository (first time) or pulls latest changes
   - Installs Node.js if not present
   - Runs `npm install`
   - Installs PM2 globally
   - Starts app with `npm run dev` via PM2
3. **Verify**: Checks if app is running and responding on specified port

**Key Features:**
- Runs in development mode with hot reload
- Uses `tsx` for TypeScript execution
- Automatically pulls latest code on each deployment
- No build step required (faster deployments)

### Production Workflow (`deploy.yml`)

1. **Build**: Builds client, server, and backend bundles
2. **Verify Build**: Ensures all required files are created
3. **Setup SSH**: Configures SSH key for secure connection
4. **Create Archive**: Packages built files for deployment
5. **Copy to EC2**: Transfers deployment archive
6. **Deploy**:
   - Creates timestamped release directory
   - Extracts files
   - Links environment file
   - Installs production dependencies
   - Runs database migrations
   - Creates backup of previous version
   - Updates symlink to new release
   - Restarts app via PM2
7. **Verify**: Checks SSR functionality and server response

**Key Features:**
- Production-optimized builds
- Zero-downtime deployments with symlinks
- Automatic backups of previous releases
- Database migration support
- Rollback capability (keeps last 5 releases)

## Managing Your Application on EC2

### View Application Status
```bash
pm2 status
# or for specific app
pm2 status cinehub-pro-dev
```

### View Logs
```bash
pm2 logs cinehub-pro-dev
# or with line limit
pm2 logs cinehub-pro-dev --lines 100
```

### Restart Application
```bash
pm2 restart cinehub-pro-dev
```

### Stop Application
```bash
pm2 stop cinehub-pro-dev
```

### Manual Start (if needed)
```bash
cd /var/www/cinehub-pro-dev
pm2 start npm --name cinehub-pro-dev -- run dev
pm2 save
```

## Troubleshooting

### Deployment Fails

1. **Check GitHub Actions logs**: View detailed error messages in the Actions tab
2. **Verify secrets**: Ensure all required secrets are set correctly
3. **Test SSH connection**:
   ```bash
   ssh -i your-key.pem ec2-user@your-ec2-ip
   ```

### Application Not Running

1. **Check PM2 status**:
   ```bash
   pm2 status
   ```

2. **View error logs**:
   ```bash
   pm2 logs cinehub-pro-dev --err --lines 50
   ```

3. **Check environment file**:
   ```bash
   cat /var/www/cinehub-pro-dev/.env
   ```

### Port Already in Use

```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process if needed
sudo kill -9 <PID>

# Restart PM2 app
pm2 restart cinehub-pro-dev
```

### Permission Denied Errors

```bash
# Fix ownership
sudo chown -R ec2-user:ec2-user /var/www/cinehub-pro-dev

# Fix SSH key permissions (on your local machine)
chmod 600 your-key.pem
```

## Security Best Practices

1. **Never commit secrets**: Keep `.env` files out of git
2. **Use GitHub Secrets**: Store all sensitive data in GitHub Secrets
3. **Restrict SSH access**: Limit EC2 security group to specific IPs
4. **Use IAM roles**: Consider AWS IAM roles instead of storing credentials
5. **Regular updates**: Keep EC2 instance and dependencies updated
   ```bash
   sudo yum update -y
   npm update
   ```

## Advanced Configuration

### Using a Different Port

1. Update your `.env` file on EC2:
   ```env
   PORT=3000
   ```

2. Update `APP_PORT` secret in GitHub

3. Update EC2 security group to allow the new port

### Setting Up Nginx Reverse Proxy

```bash
# Install Nginx
sudo yum install -y nginx

# Configure reverse proxy
sudo nano /etc/nginx/conf.d/cinehub.conf
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Setting Up SSL with Let's Encrypt

```bash
# Install certbot
sudo yum install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

## Support

For issues or questions:
- Check GitHub Actions logs for deployment errors
- Review PM2 logs on the server for runtime errors
- Verify all environment variables are set correctly
- Ensure EC2 security groups allow necessary traffic
