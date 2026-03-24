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
- **Storage**: o2switch via SFTP
- **Auth**: Simple password protection

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in your o2switch SFTP credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:
- `SFTP_HOST`: Your o2switch hostname
- `SFTP_USER`: SFTP username
- `SFTP_PASSWORD`: SFTP password
- `SFTP_BASE_PATH`: Base path for client folders (default: `/clients`)
- `ADMIN_USER`: Admin username (default: `admin`)
- `ADMIN_PASSWORD`: Admin password (default: `password`)
- `NEXT_PUBLIC_APP_URL`: Your deployment URL

### 3. o2switch Setup

1. Log into o2switch cPanel
2. Create an SFTP account with access to the clients directory
3. Create the `/clients` folder via File Manager or SSH
4. Note the SFTP credentials

### 4. Run locally

```bash
npm run dev
```

Visit `http://127.0.0.1:4096`

### 5. Deploy to Vercel

```bash
vercel deploy
```

Or connect your GitHub repo to Vercel for automatic deployments.

Add environment variables in Vercel dashboard.

## Usage

### Admin

1. Go to `/` and click "Admin Access"
2. Login with default credentials: `admin` / `password`
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
