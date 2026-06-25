package com.escriba.pos.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI escribaOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
            .info(new Info()
                .title("ESCRIBA POS API v2")
                .description("API REST del Sistema de Punto de Venta e Inventario ESCRIBA")
                .version("2.0.0")
                .contact(new Contact()
                    .name("ESCRIBA Team")
                    .email("dev@escriba.co")
                    .url("https://escriba.co"))
                .license(new License()
                    .name("Proprietary")
                    .url("https://escriba.co/license")))
            .servers(List.of(
                new Server().url("http://localhost:8080/api/v1").description("Local Development"),
                new Server().url("https://api.escriba.co/api/v1").description("Production")
            ))
            .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
            .components(new Components()
                .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                    .name(securitySchemeName)
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")));
    }
}
