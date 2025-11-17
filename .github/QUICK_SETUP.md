# Quick Setup Guide for EC2 Deployment

This is a streamlined guide to get your deployment working in 5 minutes.

## Step 1: Prepare Your EC2 Instance

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Create app directory
sudo mkdir -p /var/www/cinehub-pro-dev
sudo chown ec2-user:ec2-user /var/www/cinehub-pro-dev

# Create .env file
nano /var/www/cinehub-pro-dev/.env
```

Add your environment variables and save (Ctrl+X, Y, Enter):
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=your_database_url
SESSION_SECRET=your_secret_here
```

## Step 2: Configure GitHub Secrets

Go to: **Repository → Settings → Secrets and variables → Actions**

Add these secrets:

### Required Secrets

1. **EC2_SSH_KEY**
   ```bash
   # On your local machine, copy your SSH key:
   cat your-key.pem
   # Paste the entire output (including BEGIN/END lines)
   ```

2. **EC2_HOST**
   - Your EC2 public IP or DNS
   - Example: `54.123.45.67`

3. **EC2_USER**
   - Value: `ec2-user`

4. **GIT_REPO**
   - Your repository URL
   - Example: `https://github.com/yourusername/yourrepo.git`

### Optional Secrets (has defaults)

5. **GIT_BRANCH** (optional, default: `develop`)
6. **APP_DIR** (optional, default: `/var/www/cinehub-pro-dev`)
7. **APP_NAME** (optional, default: `cinehub-pro-dev`)
8. **APP_PORT** (optional, default: `5000`)

## Step 3: Deploy

### Option A: Automatic (Recommended)
```bash
git checkout develop  # or dev
git push origin develop
```

GitHub Actions will automatically deploy!

### Option B: Manual
1. Go to GitHub → Actions tab
2. Select "Deploy to EC2 (Development Mode)"
3. Click "Run workflow"
4. Click green "Run workflow" button

## Step 4: Verify

Check the GitHub Actions tab to see deployment progress. When complete, visit:
```
http://your-ec2-ip:5000
```

## Step 5: Monitor (Optional)

SSH into your server and run:
```bash
# Check if app is running
pm2 status

# View live logs
pm2 logs cinehub-pro-dev
```

---

## Troubleshooting

### "Permission denied (publickey)" Error
- Verify `EC2_SSH_KEY` secret contains the complete private key
- Check that the key matches the one in your EC2 instance

### "GIT_REPO secret not set" Error
- Add `GIT_REPO` secret with your repository URL

### App not accessible
1. Check EC2 security group allows port 5000
2. Run `pm2 logs cinehub-pro-dev` on the server

### Need help?
See full documentation in [DEPLOYMENT.md](./DEPLOYMENT.md)
