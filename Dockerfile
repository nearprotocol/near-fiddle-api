FROM phusion/baseimage:0.11

RUN curl -o /tmp/node_setup.sh "https://deb.nodesource.com/setup_11.x"
RUN bash /tmp/node_setup.sh
RUN curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo 'deb https://dl.yarnpkg.com/debian/ stable main' | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update -qq && apt-get install -y \
    jq \
    nodejs \
    postgresql

COPY /scripts/postgresql.conf /etc/postgresql/10/main/postgresql.conf
COPY /scripts/init_postgres.sh /etc/my_init.d/
RUN mkdir /near-fiddle-api
COPY . /near-fiddle-api/
WORKDIR /near-fiddle-api
RUN npm install
RUN mkdir /etc/service/fiddle
COPY /scripts/run.sh /etc/service/fiddle/run
