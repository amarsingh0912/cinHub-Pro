# EC2 Deployment Guide

This guide explains how to deploy CineHub Pro to an Amazon EC2 instance running Linux.

## Prerequisites

- AWS EC2 instance (Ubuntu 20.04+ or Amazon Linux 2)
- Node.js 20.x installed on EC2
- PostgreSQL database (local or RDS)
- PM2 for process management
- GitHub repository access

## Required GitHub Secrets

Configure these secrets in your GitHub repository settings:

### Staging Environment
- `STAGING_EC2_HOST` - EC2 instance public IP or domain
- `STAGING_EC2_USER` - SSH username (usually `ubuntu` or `ec2-user`)
- `STAGING_EC2_SSH_KEY` - Private SSH key for authentication
- `STAGING_APP_DIR` - Application directory (e.g., `/var/www/cinehub-staging`)
- `STAGING_URL` - Public URL of staging environment

### Production Environment
- `PRODUCTION_EC2_HOST` - EC2 instance public IP or domain
- `PRODUCTION_EC2_USER` - SSH username
- `PRODUCTION_EC2_SSH_KEY` - Private SSH key for authentication
- `PRODUCTION_APP_DIR` - Application directory (e.g., `/var/www/cinehub-pro`)
- `PRODUCTION_URL` - Public URL of production environment

### Application Secrets
- `TMDB_API_KEY` - The Movie Database API key
- `TMDB_ACCESS_TOKEN` - TMDB Bearer token
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `SENDGRID_API_KEY` - SendGrid API key for emails
- `TWILIO_ACCOUNT_SID` - Twilio account SID for SMS
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `DATABASE_URL` - PostgreSQL connection string

## EC2 Instance Setup

### 1. Install Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Amazon Linux 2
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

### 2. Install PM2

```bash
sudo npm install -g pm2
```

### 3. Install PostgreSQL (if using local database)

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Amazon Linux 2
sudo amazon-linux-extras install postgresql14
sudo yum install -y postgresql-server
```

### 4. Setup Application Directory

```bash
# Create app directory
sudo mkdir -p /var/www/cinehub-pro
sudo chown -R $USER:$USER /var/www/cinehub-pro

# Create backups directory
mkdir -p /var/www/cinehub-pro/backups
```

### 5. Configure Environment Variables

Create `.env` file in the application directory:

```bash
cd /var/www/cinehub-pro
nano .env
```

Add the following variables:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/cinehub
SESSION_SECRET=your-secure-secret-key
TMDB_API_KEY=your-tmdb-api-key
TMDB_ACCESS_TOKEN=your-tmdb-bearer-token
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

### 6. Configure Nginx (Optional but recommended)

```bash
# Install Nginx
sudo apt-get install -y nginx  # Ubuntu/Debian
sudo yum install -y nginx       # Amazon Linux

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/cinehub-pro
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/cinehub-pro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Configure Firewall

```bash
# Ubuntu/Debian with UFW
sudo ufw allow 22     # SSH
sudo ufw allow 80     # HTTP
sudo ufw allow 443    # HTTPS
sudo ufw allow 5000   # Application (if not using Nginx)
sudo ufw enable

# Amazon Linux with firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload
```

## Deployment Workflow

### Automatic Deployment

The GitHub Actions workflow automatically deploys when you push to:
- `staging` branch → Deploys to staging environment
- `production` branch → Deploys to production environment
- `main` branch → Deploys to staging by default

### Manual Deployment

You can trigger manual deployment from GitHub Actions:

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select **Deploy to EC2** workflow
4. Click **Run workflow**
5. Select environment (staging or production)
6. Click **Run workflow** button

## Deployment Process

The automated deployment:

1. **Tests** - Runs all unit and integration tests
2. **Build** - Compiles TypeScript and bundles assets
3. **Package** - Creates deployment archive
4. **Backup** - Creates backup of current version on EC2
5. **Deploy** - Extracts new version and installs dependencies
6. **Migrate** - Runs database migrations
7. **Restart** - Restarts application with PM2
8. **Health Check** - Verifies application is running
9. **Rollback** - Automatically rolls back if deployment fails

## Rollback

### Automatic Rollback

If deployment fails health checks, the workflow automatically:
- Restores the most recent backup
- Restarts the application
- Verifies the rollback was successful

### Manual Rollback

To manually rollback:

```bash
ssh user@your-ec2-host
cd /var/www/cinehub-pro

# List available backups
ls -la backups/

# Choose a backup
BACKUP_DIR="backups/backup-20250116-143022"

# Restore backup
rm -rf dist
cp -r $BACKUP_DIR/dist .
cp $BACKUP_DIR/package.json .

# Restart application
pm2 restart cinehub-pro-production
```

## Monitoring

### PM2 Monitoring

```bash
# View application logs
pm2 logs cinehub-pro-production

# Check application status
pm2 status

# Monitor resources
pm2 monit

# View process info
pm2 info cinehub-pro-production
```

### Application Logs

```bash
# Real-time logs
tail -f /var/www/cinehub-pro/logs/app.log

# Error logs
tail -f /var/www/cinehub-pro/logs/error.log

# Database migration logs
cat /var/www/cinehub-pro/migration.log
```

## Troubleshooting

### Application Won't Start

1. Check PM2 logs:
   ```bash
   pm2 logs cinehub-pro-production --lines 100
   ```

2. Check environment variables:
   ```bash
   cat .env
   ```

3. Verify database connection:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

### Database Migration Errors

1. Check migration log:
   ```bash
   cat migration.log
   ```

2. Manually run migrations:
   ```bash
   npm run db:push
   ```

### Health Check Failures

1. Test health endpoint locally:
   ```bash
   curl http://localhost:5000/api/health
   ```

2. Check if port is in use:
   ```bash
   sudo lsof -i :5000
   ```

3. Restart Nginx (if used):
   ```bash
   sudo systemctl restart nginx
   ```

## Security Best Practices

1. **Keep secrets secure** - Never commit `.env` files
2. **Regular updates** - Keep OS and packages updated
3. **Firewall rules** - Only allow necessary ports
4. **SSH keys** - Use SSH keys instead of passwords
5. **SSL/TLS** - Use Let's Encrypt for HTTPS
6. **Backup database** - Regular automated backups
7. **Monitor logs** - Set up log monitoring and alerts

## Scaling Considerations

### Horizontal Scaling

For multiple EC2 instances:
- Use Application Load Balancer
- Share session storage (Redis)
- Use RDS for database
- Centralized logging (CloudWatch)

### Vertical Scaling

- Monitor resource usage with CloudWatch
- Upgrade instance type as needed
- Optimize database queries
- Implement caching strategy

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [AWS EC2 Best Practices](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-best-practices.html)
- [PostgreSQL on EC2](https://aws.amazon.com/getting-started/hands-on/create-connect-postgresql-db/)
