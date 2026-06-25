package com.escriba.pos.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Filtro de rate limiting para el endpoint de login.
 * Limita a 10 intentos por IP en una ventana de 5 minutos.
 * No reemplaza el bloqueo por cuenta, sino que protege contra ataques DDoS/fuerza bruta distribuida.
 */
@Component
@Order(1)
@Slf4j
public class RateLimitingFilter implements Filter {

    private final Map<String, RateLimitEntry> attempts = new ConcurrentHashMap<>();
    private static final int MAX_ATTEMPTS = 10;
    private static final long WINDOW_MS = 5 * 60 * 1000; // 5 minutos

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse,
                         FilterChain filterChain) throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        // Solo aplicar a POST /auth/login
        String path = request.getRequestURI();
        if ("POST".equalsIgnoreCase(request.getMethod()) && path.endsWith("/auth/login")) {

            String clientIp = getClientIp(request);
            long now = System.currentTimeMillis();

            RateLimitEntry entry = attempts.compute(clientIp, (key, existing) -> {
                if (existing == null || now - existing.windowStart > WINDOW_MS) {
                    return new RateLimitEntry(now);
                }
                existing.count.incrementAndGet();
                return existing;
            });

            if (entry.count.get() > MAX_ATTEMPTS) {
                log.warn("Rate limit excedido para IP: {}", clientIp);
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write(
                    "{\"success\":false,\"message\":\"Demasiados intentos. Intenta de nuevo en 5 minutos.\"}");
                return;
            }
        }

        filterChain.doFilter(servletRequest, servletResponse);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    private static class RateLimitEntry {
        final long windowStart;
        final AtomicInteger count;

        RateLimitEntry(long windowStart) {
            this.windowStart = windowStart;
            this.count = new AtomicInteger(1);
        }
    }
}
