package com.escriba.pos.admin.service;

import com.escriba.pos.admin.model.entity.ServiceHealthLog;
import com.escriba.pos.admin.repository.ServiceHealthLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.net.HttpURLConnection;
import java.net.URI;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Realiza health checks automáticos sobre los servicios del sistema
 * y almacena los resultados en service_health_logs.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HealthCheckService {

    private final ServiceHealthLogRepository healthLogRepository;
    private final DataSource dataSource;
    private final JavaMailSenderImpl mailSender;

    // Track previous status to detect changes
    private String lastDbStatus = "UP";
    private String lastMailStatus = "UP";
    private String lastApiStatus = "UP";

    /**
     * Ejecuta health checks cada 5 minutos.
     */
    @Scheduled(fixedRateString = "${app.health-check.interval-ms:300000}")
    public void runAllChecks() {
        log.debug("Ejecutando health checks automáticos...");
        checkDatabase();
        checkMailServer();
        checkSelfApi();

        // Calcular uptime 30d desde los logs existentes
        updateUptimeMetrics();
    }

    /**
     * Health check de base de datos: ejecuta SELECT 1
     */
    public ServiceHealthLog checkDatabase() {
        long start = System.currentTimeMillis();
        try {
            JdbcTemplate jdbc = new JdbcTemplate(dataSource);
            jdbc.queryForObject("SELECT 1", Integer.class);
            long ms = System.currentTimeMillis() - start;

            ServiceHealthLog log = saveHealthLog("PostgreSQL", "UP", (int) ms, null);
            if (!"UP".equals(lastDbStatus)) {
                log.warn("PostgreSQL recuperado — estado UP");
            }
            lastDbStatus = "UP";
            return log;
        } catch (Exception e) {
            long ms = System.currentTimeMillis() - start;
            log.error("Health check DB falló: {}", e.getMessage());
            lastDbStatus = "DOWN";
            return saveHealthLog("PostgreSQL", "DOWN", (int) ms, e.getMessage());
        }
    }

    /**
     * Health check del servidor SMTP: intenta conectar al host:puerto
     */
    public ServiceHealthLog checkMailServer() {
        long start = System.currentTimeMillis();
        try {
            String host = mailSender.getHost();
            int port = mailSender.getPort();

            if (host == null || host.isBlank()) {
                return saveHealthLog("Email SMTP", "DEGRADED", 0, "SMTP no configurado");
            }

            try (var socket = new java.net.Socket()) {
                socket.connect(new java.net.InetSocketAddress(host, port), 5000);
                long ms = System.currentTimeMillis() - start;

                ServiceHealthLog log = saveHealthLog("Email SMTP", "UP", (int) ms, null);
                if (!"UP".equals(lastMailStatus)) {
                    log.warn("SMTP recuperado — estado UP");
                }
                lastMailStatus = "UP";
                return log;
            }
        } catch (Exception e) {
            long ms = System.currentTimeMillis() - start;
            log.error("Health check SMTP falló: {}", e.getMessage());
            lastMailStatus = "DOWN";
            return saveHealthLog("Email SMTP", "DOWN", (int) ms, e.getMessage());
        }
    }

    /**
     * Health check de la propia API REST: GET /admin/ping
     */
    public ServiceHealthLog checkSelfApi() {
        long start = System.currentTimeMillis();
        try {
            URI uri = new URI("http://localhost:8080/admin/ping");
            HttpURLConnection conn = (HttpURLConnection) uri.toURL().openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(3000);
            conn.setReadTimeout(3000);
            int code = conn.getResponseCode();
            long ms = System.currentTimeMillis() - start;

            String status = (code == 200) ? "UP" : "DEGRADED";
            ServiceHealthLog log = saveHealthLog("API REST", status, (int) ms,
                    code != 200 ? "HTTP " + code : null);
            if (!"UP".equals(lastApiStatus) && "UP".equals(status)) {
                log.warn("API REST recuperada — estado UP");
            }
            lastApiStatus = status;
            return log;
        } catch (Exception e) {
            long ms = System.currentTimeMillis() - start;
            log.error("Health check API falló: {}", e.getMessage());
            lastApiStatus = "DOWN";
            return saveHealthLog("API REST", "DOWN", (int) ms, e.getMessage());
        }
    }

    /**
     * Calcula y actualiza métricas de uptime basadas en los logs existentes.
     */
    public void updateUptimeMetrics() {
        // Actualizar métricas de uptime se hace desde la consulta
        // comparando logs UP vs total en los últimos 30 días
    }

    private ServiceHealthLog saveHealthLog(String serviceName, String status,
                                            int responseTimeMs, String errorMessage) {
        ServiceHealthLog log = ServiceHealthLog.builder()
                .serviceName(serviceName)
                .checkedAt(LocalDateTime.now())
                .status(status)
                .responseTimeMs(responseTimeMs)
                .errorMessage(errorMessage)
                .build();
        return healthLogRepository.save(log);
    }

    /**
     * Calcula uptime de los últimos 30 días para un servicio.
     */
    public double calculateUptime30d(String serviceName) {
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        var checks = healthLogRepository.findRecentByService(serviceName, since);
        if (checks.isEmpty()) return 100.0;

        long total = checks.size();
        long up = checks.stream().filter(h -> "UP".equals(h.getStatus())).count();
        return total > 0 ? Math.round((up * 10000.0 / total)) / 100.0 : 100.0;
    }
}
