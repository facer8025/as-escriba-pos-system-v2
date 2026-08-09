package com.escriba.pos.admin.config;

import com.escriba.pos.admin.security.AdminJwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Configuración de seguridad específica para el panel administrativo.
 * Se ejecuta con orden 1 (antes de la seguridad general).
 * Las rutas /api/v1/admin/** son manejadas aquí.
 */
@Configuration
@RequiredArgsConstructor
@Order(1)
public class AdminSecurityConfig {

    private final AdminJwtAuthenticationFilter adminJwtFilter;

    @Bean
    public SecurityFilterChain adminSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/admin/**")
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(request -> {
                var corsConfiguration = new org.springframework.web.cors.CorsConfiguration();
                corsConfiguration.setAllowedOrigins(java.util.List.of(
                    "http://localhost:5173", "http://localhost:5174",
                    "http://localhost:3000", "http://localhost:3001",
                    "https://admin.escriba.co"
                ));
                corsConfiguration.setAllowedMethods(java.util.List.of(
                    "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                corsConfiguration.setAllowedHeaders(java.util.List.of("*"));
                corsConfiguration.setAllowCredentials(true);
                corsConfiguration.setMaxAge(3600L);
                return corsConfiguration;
            }))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Manejo de excepciones: 401 para no autenticados, 403 para prohibidos
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":false,\"message\":\"Token de admin inválido o expirado\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":false,\"message\":\"Acceso denegado\"}");
                })
            )

            .authorizeHttpRequests(auth -> auth
                // Auth pública
                .requestMatchers("/admin/auth/login").permitAll()
                .requestMatchers("/admin/auth/login/verify-2fa").permitAll()
                .requestMatchers("/admin/auth/refresh").permitAll()
                .requestMatchers("/admin/ping").permitAll()
                .requestMatchers(HttpMethod.GET, "/admin/public/**").permitAll()
                // Todo lo demás requiere autenticación admin
                .anyRequest().authenticated()
            )
            .addFilterBefore(adminJwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // PasswordEncoder y AuthenticationManager se reutilizan
    // del SecurityConfig principal (BCryptPasswordEncoder)
}
