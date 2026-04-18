# [CI 환경 동기화용 Ubuntu Dockerfile]
ARG VARIANT="22-bookworm"
FROM mcr.microsoft.com/devcontainers/javascript-node:1-${VARIANT}

# Playwright 및 Supabase 실행에 필요한 OS 종속성 설치
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    libnss3 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxshmfence1 \
    libx11-xcb1 \
    postgresql-client \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 전역 프로젝트 도구 설치
RUN su node -c "npm install -g npm@latest"
# Supabase CLI 공식 바이너리 설치 (Linux)
RUN curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz -o supabase.tar.gz \
    && tar -xvf supabase.tar.gz \
    && mv supabase /usr/local/bin/ \
    && rm supabase.tar.gz

# 기본 작업 디렉토리 설정
WORKDIR /workspaces/solve-climb
