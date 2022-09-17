# Simple Post
Sebuah backend microservices yang mengimplementasi API Composition pattern dan CQRS

### Requirement General
- docker
- docker compose

### Run mode development
1. Install Node.js dan pnpm
2. lakukan `pnpm install` pada folder: 
    - api_gateway
    - svc_comment
    - svc_post
    - svc_query
    - _dump
3. Run docker compose
    ```sh
    docker compose -f docker-compose.dev.yaml up -d
    ```
4. Buka `http://localhost:5000`

### Run mode production
1. Run docker compose
    ```sh
    docker compose -f docker-compose.prod.yaml up -d
    ```
2. Buka `http://localhost:5000`