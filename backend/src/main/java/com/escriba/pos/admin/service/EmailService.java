package com.escriba.pos.admin.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:notificaciones@escriba.co}")
    private String fromEmail;

    @Value("${app.base-url:https://admin.escriba.co}")
    private String baseUrl;

    /**
     * Envía un email HTML con asunto y cuerpo.
     * Las variables en el cuerpo se reemplazan con {{key}} → value.
     */
    @Async
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        sendHtmlEmail(to, subject, htmlBody, null);
    }

    @Async
    public void sendHtmlEmail(String to, String subject, String htmlBody, Map<String, String> variables) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);

            String body = htmlBody;
            if (variables != null) {
                for (Map.Entry<String, String> entry : variables.entrySet()) {
                    body = body.replace("{{" + entry.getKey() + "}}", entry.getValue() != null ? entry.getValue() : "");
                }
            }

            helper.setText(body, true);
            mailSender.send(message);
            log.info("Email enviado a {}: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Error al enviar email a {}: {}", to, e.getMessage());
        }
    }

    /**
     * Email de bienvenida para nueva empresa creada en el sistema.
     */
    @Async
    public void sendWelcomeEmail(String to, String companyName, String adminName, String tempPassword) {
        String subject = "¡Bienvenido a ESCRIBA POS! — Acceso a tu panel de administración";
        String body = """
            <!DOCTYPE html>
            <html><body style="font-family: Inter, sans-serif; background: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden;">
                <div style="background: #1a1a2e; padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">ESCRIBA POS</h1>
                    <p style="color: #94a3b8; margin: 5px 0 0;">Sistema de Inventario y Punto de Venta</p>
                </div>
                <div style="padding: 30px;">
                    <h2 style="color: #1a1a2e; margin-top: 0;">¡Bienvenido, {{adminName}}!</h2>
                    <p style="color: #64748b; line-height: 1.6;">
                        Tu empresa <strong>{{companyName}}</strong> ha sido registrada exitosamente en ESCRIBA POS.
                    </p>
                    <p style="color: #64748b; line-height: 1.6;">
                        Puedes acceder al sistema con las siguientes credenciales:
                    </p>
                    <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
                        <p style="margin: 0 0 10px;"><strong>URL:</strong> <a href="{{baseUrl}}" style="color: #1a1a2e;">{{baseUrl}}</a></p>
                        <p style="margin: 0 0 10px;"><strong>Email:</strong> {{email}}</p>
                        <p style="margin: 0;"><strong>Contraseña temporal:</strong> <code style="background: #1a1a2e; color: white; padding: 4px 8px; border-radius: 4px; font-size: 14px;">{{tempPassword}}</code></p>
                    </div>
                    <p style="color: #ef4444; font-size: 13px;">
                        ⚠️ Por seguridad, cambia tu contraseña en el primer inicio de sesión.
                    </p>
                </div>
                <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                        © 2026 ESCRIBA · Todos los derechos reservados<br>
                        Si tienes dudas, escríbenos a <a href="mailto:soporte@escriba.co" style="color: #1a1a2e;">soporte@escriba.co</a>
                    </p>
                </div>
            </div>
            </body></html>
            """;

        sendHtmlEmail(to, subject, body, Map.of(
                "adminName", adminName,
                "companyName", companyName,
                "baseUrl", baseUrl.replace("/admin", "/app"),
                "email", to,
                "tempPassword", tempPassword
        ));
    }

    /**
     * Email de notificación de nuevo ticket de soporte.
     */
    @Async
    public void sendTicketNotification(String to, String ticketNumber, String subject, String description, String ticketUrl) {
        String emailSubject = "[ESCRIBA] Nuevo ticket " + ticketNumber + ": " + subject;
        String body = """
            <!DOCTYPE html>
            <html><body style="font-family: Inter, sans-serif; background: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden;">
                <div style="background: #1a1a2e; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 20px;">🎫 Nuevo ticket de soporte</h1>
                </div>
                <div style="padding: 30px;">
                    <p style="color: #64748b;">Se ha creado un nuevo ticket:</p>
                    <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 15px 0; border: 1px solid #e2e8f0;">
                        <p style="margin: 0 0 5px;"><strong>Ticket:</strong> {{ticketNumber}}</p>
                        <p style="margin: 0 0 5px;"><strong>Asunto:</strong> {{subject}}</p>
                        <p style="margin: 0;"><strong>Descripción:</strong> {{description}}</p>
                    </div>
                    <a href="{{ticketUrl}}" style="display: inline-block; background: #1a1a2e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ver ticket</a>
                </div>
            </div>
            </body></html>
            """;

        sendHtmlEmail(to, emailSubject, body, Map.of(
                "ticketNumber", ticketNumber,
                "subject", subject,
                "description", description != null && description.length() > 200 ? description.substring(0, 200) + "..." : (description != null ? description : ""),
                "ticketUrl", ticketUrl
        ));
    }

    /**
     * Email de anuncio masivo a múltiples destinatarios.
     */
    @Async
    public void sendAnnouncement(String to, String title, String bodyHtml) {
        sendHtmlEmail(to, "[ESCRIBA] " + title, bodyHtml);
    }
}
