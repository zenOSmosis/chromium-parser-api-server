FROM ubuntu:xenial
MAINTAINER info@zenosmosis.com

RUN apt-get update && \
    apt-get install -y \
    gconf-service \
    git \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    ttf-freefont \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget \
    curl \
    python-pip \
    && wget https://github.com/Yelp/dumb-init/releases/download/v1.2.1/dumb-init_1.2.1_amd64.deb \
    && dpkg -i dumb-init_*.deb && rm -f dumb-init_*.deb \
    && apt-get clean && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash - \
    && apt-get install nodejs

# Install Yarn
RUN curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
     && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
     && apt-get update \
     && apt-get install yarn

# This line is separated for development purposes only
RUN yarn global add puppeteer@1.4.0

RUN yarn global add \
    apidoc \
    pm2 \
    typedoc \
    webpack \
    webpack-cli \
    && yarn cache clean

ENV NODE_PATH="/usr/local/share/.config/yarn/global/node_modules:${NODE_PATH}"

# Add user & set directory permissions
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser \
    && mkdir -p /app \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /usr/local/share/.config/yarn/global/node_modules \
    && chown -R pptruser:pptruser /app \
    && chmod g+s /app

WORKDIR /app

COPY . /app

# Run everything after as non-privileged user
USER pptruser

# Link puppeteer as a local npm package
# TODO: Use Yarn global configuration here, instead
RUN cd /usr/local/share/.config/yarn/global/node_modules/puppeteer \
    && yarn link

RUN yarn install \
    && yarn link puppeteer \
    && yarn run compile:dev

# Install dependencies for article-date-extractor
# Must switch to root account for this
USER root
RUN pip install lxml \
    && cd node_modules/article-date-extractor \
    && python setup.py install
# Switch back to user account
USER pptruser

# Specify our public API port
ENV HTTP_API_PORT=8080

EXPOSE 8080

# @see # @see https://github.com/Yelp/dumb-init
ENTRYPOINT ["dumb-init", "--"]

CMD ["./pm2.start.sh", "--no-daemon"]