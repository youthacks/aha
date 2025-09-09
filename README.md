# Youthacks Token System

A token system for hackathons. Try it out at [aha.youthacks.org](https://aha.youthacks.org).

DISCLAIMER: 

Running Aha locally requires a lot of setup and configuiring multiple API keys, tokens, etc. There are also multiple other dependencies and pre-deployment commands that are required and are not here. Please contact me (at bottom of page) if you need any help, or want the exact instructions.

The demo website is known to frequently not work (due to the nest-deploy-aha.sh that Nest runs every 5 minutes not working when there is a new commit). If that happens, please let me know and I'll redeploy.

The following instructions below are not great but get you part of the way there (for Windows).

---

## Table of Contents
- [Features](#features)
- [Requirements](#requirements)
- [Installation (Windows)](#installation-windows)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features
- Participant and event management
- Token transactions
- Admin and manager roles
- Email notifications

## Requirements
- Ruby (see `.ruby-version` or Gemfile for version)
- Rails (see Gemfile)
- PostgreSQL
- Node.js & Yarn (for asset compilation)
- Git

## Installation (Windows)

### 1. Install Ruby and Rails
- Download and install Ruby from [rubyinstaller.org](https://rubyinstaller.org/).
- Install Rails:
  ```sh
  gem install rails
  ```

### 2. Install PostgreSQL
- Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/).
- During installation, ensure the command line tools are included.
- Add the PostgreSQL `bin` directory (e.g., `C:\Program Files\PostgreSQL\16\bin`) to your PATH environment variable.

### 3. Install Node.js and Yarn
- You actually don't need this.
- Download and install Node.js from [nodejs.org](https://nodejs.org/).
- Install Yarn:
  ```sh
  npm install --global yarn
  ```

### 4. Clone the Repository
```sh
git clone https://github.com/yourusername/Youthacks-Token-System.git
cd Youthacks-Token-System
```

### 5. Install Dependencies
```sh
bundle install
yarn install
```

### 6. Database Setup
- Create a PostgreSQL user and database, or update `config/database.yml` with your credentials.
- Run:
  ```sh
  rails db:setup
  ```

---

## Configuration
- Copy `config/credentials.yml.enc` and `config/master.key` if needed (for secrets).
- Set up email server settings in `config/environments/production.rb` and/or `config/environments/development.rb`.

---

## Running the Application
```sh
rails server
```
- Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment
You can deploy this app using:
- **Heroku**: Push to a Heroku app with a PostgreSQL add-on.
- **Docker**: Use the provided `Dockerfile`:
  ```sh
  docker build -t youthacks-token-system .
  docker run -e RAILS_ENV=production -p 3000:3000 youthacks-token-system
  ```
- **VPS/Cloud**: Set up Ruby, Rails, PostgreSQL, and follow the installation steps above.

---

---

## License
See [LICENSE](LICENSE).

## Help and Support
Add and issue on GitHub or [contact us](mailto:matthew@youthacks.org)
