# GitHub Actions CI/CD Guide

This document explains how to set up and use the GitHub Actions workflows for continuous integration and deployment.

## Overview

The project includes two main workflows:

1. **Test Workflow** (`test.yml`) - Runs on pull requests and develop branch
2. **Deploy Workflow** (`deploy-ec2.yml`) - Deploys to EC2 on main/production branches

## Required GitHub Secrets

Navigate to your repository → Settings → Secrets and variables → Actions, then add the following secrets:

### EC2 Deployment Secrets

| Secret Name | Description | Example |
|------------|-------------|---------|
| `EC2_HOST` | EC2 instance public IP or domain | `ec2-xx-xx-xx-xx.compute.amazonaws.com` |
| `EC2_USERNAME` | SSH username for EC2 | `ubuntu` |
| `EC2_SSH_KEY` | Private SSH key content | Contents of your `.pem` file |
| `EC2_APP_DIR` | Application directory on EC2 | `/var/www/cinehub-pro` |

### Application Secrets

| Secret Name | Description | Required For |
|------------|-------------|--------------|
| `DATABASE_URL` | Production database connection string | Deployment |
| `TEST_DATABASE_URL` | Test database connection string | Testing |
| `SESSION_SECRET` | Secure session secret (32+ chars) | Deployment |
| `TMDB_API_KEY` | TMDB API key | Testing & Deployment |
| `TMDB_ACCESS_TOKEN` | TMDB access token | Testing & Deployment |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Deployment |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Deployment |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Deployment |
| `SENDGRID_API_KEY` | SendGrid API key (optional) | Deployment |
| `TWILIO_ACCOUNT_SID` | Twilio account SID (optional) | Deployment |
| `TWILIO_AUTH_TOKEN` | Twilio auth token (optional) | Deployment |

### OAuth Secrets (Optional)

| Secret Name | Description |
|------------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `FACEBOOK_APP_ID` | Facebook app ID |
| `FACEBOOK_APP_SECRET` | Facebook app secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |

### Optional Secrets

| Secret Name | Description |
|------------|-------------|
| `CODECOV_TOKEN` | Codecov token for coverage reports |

## Workflow Details

### Test Workflow

**Triggers:**
- Pull requests to `main` or `develop`
- Pushes to `develop`
- Manual trigger via workflow_dispatch

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run type checking
5. Run unit tests
6. Run integration tests
7. Run component tests
8. Generate coverage report
9. Upload coverage to Codecov (optional)

**Usage:**
```bash
# Tests run automatically on PR creation
# Or trigger manually from Actions tab
```

### Deploy Workflow

**Triggers:**
- Pushes to `main` or `production` branches
- Manual trigger via workflow_dispatch

**Steps:**
1. Run tests
2. Build application
3. Create deployment package
4. Transfer to EC2
5. Deploy on EC2
6. Run health check
7. Notify status

**Deployment Process:**
1. Backs up current version
2. Extracts new version
3. Installs dependencies
4. Runs database migrations
5. Restarts application with PM2
6. Performs health check

## Setting Up EC2 for Deployment

### 1. Prepare EC2 Instance

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Create app directory
sudo mkdir -p /var/www/cinehub-pro
sudo chown ubuntu:ubuntu /var/www/cinehub-pro
```

### 2. Configure Environment Variables

Create `/var/www/cinehub-pro/.env`:

```bash
# Copy from deployment documentation
# Include all required environment variables
```

### 3. Initial Setup

```bash
cd /var/www/cinehub-pro

# Clone or initial deployment
git clone <repo-url> .

# Install dependencies
npm ci --production

# Build
npm run build

# Start with PM2
pm2 start npm --name "cinehub-pro" -- start
pm2 save
pm2 startup
```

### 4. Configure Nginx (Optional)

```bash
sudo apt install nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/cinehub-pro

# Enable site
sudo ln -s /etc/nginx/sites-available/cinehub-pro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Setup SSL (Optional)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## SSH Key Setup

### Generate Deployment Key (if needed)

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy

# Add public key to EC2
ssh-copy-id -i ~/.ssh/github_deploy.pub ubuntu@your-ec2-ip

# Copy private key content
cat ~/.ssh/github_deploy
# Add this to EC2_SSH_KEY secret
```

### Add SSH Key to GitHub Secrets

1. Go to repository Settings → Secrets → Actions
2. Click "New repository secret"
3. Name: `EC2_SSH_KEY`
4. Value: Paste the entire private key content (including BEGIN/END lines)

## Manual Deployment

To manually trigger deployment:

1. Go to repository → Actions tab
2. Select "Deploy to EC2" workflow
3. Click "Run workflow"
4. Select branch
5. Click "Run workflow" button

## Monitoring Deployments

### View Workflow Runs

1. Go to Actions tab
2. Select workflow run
3. View logs for each step

### Check Deployment on EC2

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Check PM2 status
pm2 status

# View logs
pm2 logs cinehub-pro

# Check application
curl http://localhost:5000/api/health
```

### Rollback

If deployment fails:

```bash
# SSH into EC2
cd /var/www/cinehub-pro

# Restore backup
rm -rf dist
mv dist.backup dist

# Restart
pm2 restart cinehub-pro
```

## Troubleshooting

### Deployment Fails at Transfer Step

**Issue:** SSH connection fails

**Solutions:**
1. Verify `EC2_HOST` is correct
2. Check `EC2_SSH_KEY` is complete private key
3. Ensure EC2 security group allows SSH (port 22)
4. Verify SSH key is added to EC2 authorized_keys

### Deployment Fails at Health Check

**Issue:** Application not responding

**Solutions:**
1. SSH to EC2 and check `pm2 logs`
2. Verify environment variables are set
3. Check database connectivity
4. Review application startup logs

### Tests Fail

**Issue:** Test workflow fails

**Solutions:**
1. Check test database is accessible
2. Verify all test secrets are set
3. Review test logs in Actions tab
4. Run tests locally to debug

### Build Fails

**Issue:** Build step fails

**Solutions:**
1. Check for TypeScript errors
2. Verify all dependencies are installed
3. Review build logs
4. Test build locally: `npm run build`

## Best Practices

1. **Always test locally before pushing:**
   ```bash
   npm test
   npm run build
   ```

2. **Use feature branches and PRs:**
   - Create feature branch
   - Make changes
   - Open PR (tests run automatically)
   - Merge to main (triggers deployment)

3. **Monitor deployments:**
   - Check Actions tab after push
   - Verify health check passes
   - Test deployed application

4. **Keep secrets secure:**
   - Never commit secrets to repository
   - Rotate secrets regularly
   - Use different secrets for staging/production

5. **Database migrations:**
   - Test migrations locally first
   - Use `npm run db:push` carefully
   - Backup database before major migrations

## Environment-Specific Deployments

### Staging Environment

1. Create `staging` branch
2. Add staging secrets (with `STAGING_` prefix)
3. Modify workflow to deploy to staging EC2

### Production Environment

1. Use `main` or `production` branch
2. Add production secrets
3. Enable deployment protection rules in GitHub

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
