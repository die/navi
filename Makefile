DOCKER_COMPOSE = docker compose

debug:
	$(DOCKER_COMPOSE) restart navi && $(DOCKER_COMPOSE) logs -f navi
