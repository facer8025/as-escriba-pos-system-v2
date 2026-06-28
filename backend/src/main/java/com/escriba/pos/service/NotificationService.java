package com.escriba.pos.service;

import com.escriba.pos.model.entity.*;
import com.escriba.pos.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Servicio encargado de generar notificaciones in-app y preparar
 * notificaciones por otros canales (email, push) cuando ocurren
 * eventos de negocio como stock bajo, productos agotados, etc.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationConfigRepository configRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    /**
     * Verifica el stock de un producto después de un cambio y genera
     * notificaciones si está por debajo del mínimo o agotado.
     * Se invoca después de cualquier operación que modifique el stock.
     */
    @Transactional
    public void checkAndNotifyStockAlerts(Product product, UUID companyId) {
        if (product.getManageInventory() == null || !product.getManageInventory()) {
            return; // Producto sin control de inventario
        }

        BigDecimal currentStock = product.getCurrentStock() != null ? product.getCurrentStock() : BigDecimal.ZERO;
        BigDecimal stockMin = product.getStockMin() != null ? product.getStockMin() : BigDecimal.ZERO;

        // Determinar el tipo de alerta según el nivel de stock
        if (currentStock.compareTo(BigDecimal.ZERO) <= 0) {
            // Producto totalmente agotado
            createStockNotification(
                    companyId,
                    "STOCK_OUT_ALERT",
                    "Producto sin stock: " + product.getName(),
                    "El producto \"" + product.getName() + "\" (código: " +
                            (product.getInternalCode() != null ? product.getInternalCode() : "N/A") +
                            ") se ha agotado por completo. Stock actual: 0.",
                    "AlertTriangle",
                    "/inventario/alertas",
                    product
            );
        } else if (stockMin.compareTo(BigDecimal.ZERO) > 0 && currentStock.compareTo(stockMin) <= 0) {
            // Producto por debajo del stock mínimo
            createStockNotification(
                    companyId,
                    "STOCK_MIN_ALERT",
                    "Stock crítico: " + product.getName(),
                    "El producto \"" + product.getName() + "\" tiene " +
                            currentStock.stripTrailingZeros().toPlainString() +
                            " unidades, por debajo del mínimo de " +
                            stockMin.stripTrailingZeros().toPlainString() + ".",
                    "AlertTriangle",
                    "/inventario/alertas",
                    product
            );
        }
    }

    /**
     * Crea una notificación in-app para todos los usuarios relevantes
     * (administradores, bodegueros) si la configuración de la empresa
     * tiene habilitado el canal in-app para ese tipo de notificación.
     */
    private void createStockNotification(UUID companyId, String notificationType,
                                          String title, String message,
                                          String icon, String link,
                                          Product product) {
        // Verificar configuración: ¿está habilitado el canal in-app?
        NotificationConfig config = configRepository
                .findByCompanyIdAndNotificationType(companyId, notificationType)
                .orElse(null);

        boolean inAppEnabled = config != null && Boolean.TRUE.equals(config.getInAppEnabled());
        if (!inAppEnabled) {
            log.debug("Notificación {} deshabilitada para company {}", notificationType, companyId);
            return;
        }

        // Buscar usuarios destinatarios (AD, BO y cualquier rol que tenga acceso a inventario)
        List<User> recipients = userRepository.findByCompanyId(companyId).stream()
                .filter(u -> u.getActive() && isInventoryRole(u.getRoleId()))
                .toList();

        if (recipients.isEmpty()) {
            log.warn("No hay usuarios destinatarios para notificación de stock en company {}", companyId);
            return;
        }

        // Crear una notificación por cada usuario
        for (User user : recipients) {
            Notification notification = Notification.builder()
                    .company(product.getCompany())
                    .user(user)
                    .notificationType(notificationType)
                    .title(title)
                    .message(message)
                    .icon(icon)
                    .link(link)
                    .isRead(false)
                    .build();

            notificationRepository.save(notification);
            log.debug("Notificación creada para usuario {}: {}", user.getEmail(), title);
        }
    }

    /**
     * Determina si un roleId tiene acceso a ver alertas de inventario.
     */
    private boolean isInventoryRole(Short roleId) {
        if (roleId == null) return false;
        int id = roleId.intValue();
        // SA=1, AD=2, BO=4 — roles que ven inventario
        return id == 1 || id == 2 || id == 4;
    }
}
