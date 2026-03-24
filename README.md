# MDrive

A client file exchange and validation portal.

## Features

- **Admin Dashboard**: Create client spaces, manage files, validate uploads
- **Client Portal**: Password-protected spaces, file uploads, notes/validation system
- **File Preview**: Images, videos, PDFs with inline preview
- **Notes System**: Timestamped comments with file references
- **Validation**: Mark files as approved/validated

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Storage**: Local filesystem (o2switch)
- **Auth**: bcrypt password hashing

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
- `ADMIN_USER`: Admin username (default: `admin`)
- `ADMIN_PASSWORD`: Admin password (default: `password`)
- `NEXT_PUBLIC_APP_URL`: Your deployment URL
- `DATA_DIR`: Directory for storing files (default: `./data`)

### 3. Run locally

```bash
npm run dev
```

Visit `http://127.0.0.1:4096`

## Deploy to o2switch

### Option 1: SSH + PM2

```bash
# SSH into o2switch
ssh user@your-o2switch-host

# Install Node.js if needed
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone/pull your repo
cd ~/apps/mdrive
git pull origin main
npm install
npm run build

# Start with PM2
pm2 start npm --name "mdrive" -- start
pm2 save
pm2 startup  # For auto-restart on reboot
```

### Option 2: Deploy via GitHub Actions (auto-deploy)

Add these secrets to your GitHub repo:
- `SSH_HOST`
- `SSH_USER`
- `SSH_KEY` (private key)
- `SSH_PORT` (default: 22)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to o2switch
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.10
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          port: ${{ secrets.SSH_PORT }}
          script: |
            cd ~/apps/mdrive
            git pull
            npm install
            npm run build
            pm2 restart mdrive
```

## Usage

### Admin

1. Go to `/` and click "Admin Access"
2. Login with credentials: `admin` / `password`
3. Create client spaces with names and passwords
4. Upload files to client spaces
5. Validate files with the ✓ button
6. Share client portal URLs with clients

### Clients

1. Access their space URL (e.g., `/client/ecolearn`)
2. Enter their password
3. View and download shared files
4. Upload their own files
5. Add notes/comments with timestamps

## Domain Setup (o2switch)

1. In o2switch cPanel → Domains → Point to folder
2. Point your domain/subdomain to `/your-app-path/public`
3. Or use PM2 + reverse proxy with Nginx

Example Nginx config:

```nginx
server {
    listen 80;
    server_name mdrive.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then enable SSL with `sudo certbot --nginx`
