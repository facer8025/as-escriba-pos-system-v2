package com.escriba.pos;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.MountableFile;

import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Test de integración que replica el arranque de docker-compose:
 * PostgreSQL 16 con los scripts init del schema + Redis 7.
 * Valida que el contexto Spring Boot carga por completo (beans, JPA,
 * Flyway V5 idempotente) sobre un schema real.
 */
@Testcontainers
@SpringBootTest
class EscribaPosApplicationIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("escriba_pos")
            .withUsername("escriba_user")
            .withPassword("escriba_secret_2025")
            // Mismo init que docker-compose (docker-entrypoint-initdb.d)
            .withCopyFileToContainer(
                    MountableFile.forHostPath("../database/init/01-schema.sql"),
                    "/docker-entrypoint-initdb.d/01-schema.sql")
            .withCopyFileToContainer(
                    MountableFile.forHostPath("../database/init/02-admin-schema.sql"),
                    "/docker-entrypoint-initdb.d/02-admin-schema.sql");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void datasourceProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
        registry.add("app.health-check.interval-ms", () -> "3600000"); // desactivar checks frecuentes
    }

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    @DisplayName("El contexto Spring Boot arranca con el schema real de PostgreSQL")
    void contextLoads() {
        assertNotNull(applicationContext, "El contexto debe inicializarse");
        assertNotNull(applicationContext.getBean(com.escriba.pos.EscribaPosApplication.class));
        // Los repositorios admin se registran correctamente
        assertNotNull(applicationContext.getBean(com.escriba.pos.admin.repository.TenantRepository.class));
        assertNotNull(applicationContext.getBean(com.escriba.pos.admin.repository.PlanRepository.class));
        // Repositorios del dominio POS
        assertNotNull(applicationContext.getBean(com.escriba.pos.repository.SaleRepository.class));
        assertNotNull(applicationContext.getBean(com.escriba.pos.repository.ProductRepository.class));
    }
}
