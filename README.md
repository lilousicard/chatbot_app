# Complete Chatwoot Development Setup Guide for macOS

This comprehensive guide walks you through setting up a Chatwoot development environment on macOS, incorporating solutions for all common issues encountered during setup.

## Prerequisites

- macOS with Homebrew installed
- Basic terminal knowledge
- Admin access to your machine

## Step 1: Install Core Dependencies

### Install System Tools
```bash
# Install essential development tools
brew install rbenv postgresql redis node
```

### Install Ruby Version Manager and Ruby
```bash
# Set up rbenv in your shell
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(rbenv init -)"' >> ~/.zshrc
source ~/.zshrc

# Install Ruby 3.4.4 (required by Chatwoot)
rbenv install 3.4.4
```

### Verify Ruby Installation
```bash
# Check if rbenv is working
rbenv --version

# This should show Ruby 3.4.4
ruby -v
```

**⚠️ Troubleshooting**: If `ruby -v` still shows an old version:
```bash
# Manually load rbenv for current session
export PATH="$HOME/.rbenv/bin:$PATH"
eval "$(rbenv init -)"
ruby -v
```

## Step 2: Handle Node.js Version Conflicts

### Check Current Node.js Setup
```bash
# Check what Node versions are installed
brew list | grep node
which node
node -v
```

### Fix Node.js Priority Issues
```bash
# Ensure Homebrew's Node.js takes priority
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify correct Node.js version (should be 18+)
node -v
```

### Install pnpm (Node Package Manager)
```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

**⚠️ Troubleshooting**: If you get Node.js version errors:
- You may have multiple Node.js versions installed
- Keep both if needed (MongoDB might require older version)
- Use full paths: `/opt/homebrew/bin/npm install -g pnpm`

## Step 3: PostgreSQL Setup with Proper Permissions

### Start PostgreSQL Service
```bash
# Start PostgreSQL
brew services start postgresql

# Verify it's running
brew services list | grep postgresql
```

### Create PostgreSQL User with Superuser Privileges
```bash
# Create postgres user with SUPERUSER privileges (important!)
createuser -s postgres

# Set password for the user
psql postgres -c "ALTER USER postgres PASSWORD 'password';"

# Verify user has superuser privileges
psql postgres -c "SELECT usename, usesuper FROM pg_user WHERE usename = 'postgres';"
```

**🔑 Key Point**: Superuser privileges are essential for installing PostgreSQL extensions that Chatwoot requires.

### Install PostgreSQL Extensions
```bash
# Install pgvector extension (required for AI features)
brew install pgvector

# Restart PostgreSQL to load new extensions
brew services restart postgresql
```

## Step 4: Redis Setup
```bash
# Start Redis service
brew services start redis

# Verify Redis is running
brew services list | grep redis
```

## Step 5: Project Setup

### Navigate to Your Project
```bash
cd ~/RubymineProjects/chatbot_test
# or wherever your Chatwoot project is located
```

### Set Ruby Version for Project
```bash
# Set Ruby 3.4.4 for this project
rbenv local 3.4.4

# Verify project is using correct Ruby
ruby -v
```

### Create Environment Variables
```bash
# Create .env file with database credentials
cat > .env << EOF
POSTGRES_DATABASE=chatwoot_dev
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=password
EOF
```

**📝 Note**: The project already has `dotenv-rails` gem, so no need to add it again.

## Step 6: Install Dependencies

### Install Ruby Gems
```bash
# Install all Ruby dependencies
bundle install
```

**⚠️ Troubleshooting**: If you get a Gemfile syntax error:
- Check for accidentally pasted text in Gemfile (like `pnpm install`)
- Remove any duplicate gem entries

### Install Node.js Packages
```bash
# Install frontend dependencies
pnpm install
```

## Step 7: Database Creation and Migration

### Create Database
```bash
# Create the development database
bin/rails db:create
```

### Handle Migration Issues

**Issue 1: Extension Permission Errors**
If you get `permission denied to create extension "pg_stat_statements"`:
```bash
# This should already be fixed with superuser setup, but if not:
psql postgres -c "ALTER USER postgres WITH SUPERUSER;"
```

**Issue 2: Acts-as-taggable-on Error**
If migration fails with `uninitialized constant ActsAsTaggableOn::Taggable::Cache`:
```bash
# Edit the problematic migration file
nano db/migrate/*_add_cached_labels_list.rb

# Comment out or remove this line:
# ActsAsTaggableOn::Taggable::Cache.included(Conversation)
```

**Issue 3: Vector Extension Error**
If you get `could not open extension control file vector.control`:
```bash
# This should be fixed with pgvector installation, but verify:
brew install pgvector
brew services restart postgresql
```

### Run Migrations
```bash
# Run all database migrations
bin/rails db:migrate
```

## Step 8: Configure Vite for Frontend Assets

### Fix Vite Host Configuration
```bash
# Edit Vite configuration to prevent WebSocket issues
nano config/vite.json
```

Add host configuration:
```json
{
  "all": {
    "sourceCodeDir": "app/javascript",
    "watchAdditionalPaths": []
  },
  "development": {
    "autoBuild": true,
    "publicOutputDir": "vite-dev",
    "port": 3036,
    "host": "127.0.0.1"
  },
  "test": {
    "autoBuild": true,
    "publicOutputDir": "vite-test",
    "port": 3037,
    "host": "127.0.0.1"
  }
}
```

## Step 9: Start Development Services

### Install Overmind (Process Manager)
```bash
# Install tmux and overmind for managing multiple processes
brew install tmux overmind
```

### Start All Services
```bash
# This starts Rails server, Vite dev server, and Sidekiq worker
pnpm run dev
```

**✅ Success Indicators**:
- Rails server running on port 3000
- Vite dev server running on port 3036
- No "server already running" errors
- Vite WebSocket connection successful

### Alternative: Manual Service Startup
If `pnpm run dev` doesn't work:

**Terminal 1 - Rails Server:**
```bash
bin/rails s -p 3000
```

**Terminal 2 - Vite Dev Server:**
```bash
bin/vite dev
```

**Terminal 3 - Sidekiq Worker:**
```bash
bundle exec sidekiq -C config/sidekiq.yml
```

## Step 10: User and Account Setup

### Create Super Admin User
```bash
rails console
```

```ruby
# Create super admin user
SuperAdmin.create!(
  email: 'admin@example.com',
  password: 'Password123!',
  name: 'Super Admin'
)
# Find your SuperAdmin user
admin = SuperAdmin.find_by(email: 'admin@example.com')

# Confirm the email
admin.update(confirmed_at: Time.current)

# Verify it worked
admin.confirmed_at

exit
```

### Create Account and Regular User
```bash
rails console
```

```ruby
# Create an account (required for regular users)
account = Account.create!(name: 'My Company')

# Create regular user
user = User.create!(
  email: 'user@example.com',
  password: 'Password123!',
  name: 'Regular User'
)

# Confirm user email (skip verification)
user.update(confirmed_at: Time.current)

# Associate user with account
AccountUser.create!(
  account: account,
  user: user,
  role: 'administrator'
)

exit
```

**🔐 Password Requirements**: Must contain uppercase, lowercase, number, and special character.

## Step 11: Verify Setup

### Check Service Status
```bash
# Check what's running on each port
lsof -i :3000  # Rails server
lsof -i :3036  # Vite dev server
lsof -i :6379  # Redis

# Check service status
brew services list | grep -E "(redis|postgresql)"
```

### Test Application Access

**Super Admin Interface:**
- URL: `http://127.0.0.1:3000/super_admin/sign_in`
- Login: `admin@example.com` / `Password123!`

**Regular User Interface:**
- URL: `http://127.0.0.1:3000/app/login`
- Login: `user@example.com` / `Password123!`

**Root URL:**
- URL: `http://127.0.0.1:3000/`
- Should redirect to appropriate dashboard

### Verify Frontend Assets
- Pages should load without infinite loading wheels
- Browser console should show: `[vite] connected.`
- No WebSocket connection errors

## RubyMine Configuration

### Ruby SDK Configuration
1. **RubyMine → Preferences → Languages & Frameworks → Ruby SDK and Gems**
2. **Set Ruby interpreter to**: `/Users/[username]/.rbenv/versions/3.4.4/bin/ruby`

### Node.js Configuration
1. **RubyMine → Preferences → Languages & Frameworks → Node.js**
2. **Node interpreter**: `/opt/homebrew/bin/node`
3. **Package manager**: `pnpm` at `/opt/homebrew/bin/pnpm`

### Rails Run Configuration
1. **Run → Edit Configurations → + → Rails**
2. **Settings**:
   - Name: `Chatwoot Server`
   - Ruby interpreter: `rbenv: 3.4.4`
   - Server: `Default`
   - Port: `3000`
   - Environment: `development`
3. **Environment Variables**:
   ```
   POSTGRES_DATABASE=chatwoot_dev
   POSTGRES_USERNAME=postgres
   POSTGRES_PASSWORD=password
   ```

## Common Issues and Quick Fixes

### "Server Already Running" Error
```bash
# Remove stale PID file
rm tmp/pids/server.pid

# Or kill existing process
lsof -i :3000
kill -9 [PID]
```

### Loading Wheel Never Disappears
- Ensure both Rails AND Vite are running
- Check browser console for WebSocket errors
- Verify Vite host configuration in `config/vite.json`

### "No Rails Found in Interpreter"
- Verify Ruby interpreter in RubyMine settings
- Run `bundle install` to ensure Rails gem is installed
- Restart RubyMine after changing Ruby interpreter

### Authentication Issues
- Create account before testing regular user login
- Ensure user is associated with an account via `AccountUser`
- Check if user email is confirmed

### Database Connection Errors
- Verify PostgreSQL is running: `brew services list | grep postgresql`
- Check `.env` file has correct credentials
- Ensure postgres user has correct password

## Maintenance Commands

### Restart All Services
```bash
# Stop services
brew services stop postgresql redis
pkill -f "rails\|vite\|sidekiq\|overmind"

# Start services
brew services start postgresql redis
pnpm run dev
```

### Update Dependencies
```bash
# Update Ruby gems
bundle update

# Update Node packages
pnpm update

# Update system packages
brew upgrade
```

### Reset Database
```bash
# Drop and recreate database
bin/rails db:drop db:create db:migrate

# Recreate users and accounts as needed
```

## Success Checklist

- ✅ Ruby 3.4.4 installed and active
- ✅ Node.js 18+ with pnpm working
- ✅ PostgreSQL running with superuser postgres
- ✅ Redis running
- ✅ pgvector extension installed
- ✅ Database created and migrated successfully
- ✅ Rails server running on port 3000
- ✅ Vite dev server running on port 3036 with WebSocket connection
- ✅ Sidekiq worker running
- ✅ Super admin user created
- ✅ Account created with associated regular users
- ✅ Both login interfaces accessible and functional
- ✅ Frontend assets loading without errors

## Getting Help

If you encounter issues not covered in this guide:

1. **Check service logs** in the terminals where services are running
2. **Use browser developer tools** (`Cmd + Option + I`) to check for JavaScript errors
3. **Check Rails console** (`rails console`) to verify database state
4. **Verify service status** with `brew services list` and port checks with `lsof`

## Development Workflow

Once setup is complete:

1. **Start development**: `pnpm run dev`
2. **Access super admin**: `http://127.0.0.1:3000/super_admin/sign_in`
3. **Access user interface**: `http://127.0.0.1:3000/app/login`
4. **Stop development**: `Ctrl+C` in the terminal running `pnpm run dev`

Your Chatwoot development environment is now ready for development!
