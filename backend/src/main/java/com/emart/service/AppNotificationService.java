package com.emart.service;

import com.emart.dto.NotificationResponse;
import com.emart.entity.Notification;
import com.emart.entity.Role;
import com.emart.repository.NotificationRepository;
import com.emart.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * P4-NOTI: in-app notification centre. Creates notifications when orders/dealers change and
 * lets each user read their own. Best-effort: write failures are swallowed so they never break
 * the order/registration flow.
 */
@Service
public class AppNotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public AppNotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void notifyUser(Long userId, String type, String title, String message, String link) {
        try {
            Notification n = new Notification();
            n.setRecipientUserId(userId);
            n.setType(type);
            n.setTitle(title);
            n.setMessage(message);
            n.setLink(link);
            notificationRepository.save(n);
        } catch (Exception ignored) {
        }
    }

    /** Send a notification to every admin user. */
    @Transactional
    public void notifyAdmins(String type, String title, String message, String link) {
        try {
            for (var admin : userRepository.findByRoleOrderByCreatedAtDesc(Role.ADMIN)) {
                notifyUser(admin.getId(), type, title, message, link);
            }
        } catch (Exception ignored) {
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(Long userId) {
        return notificationRepository.findTop30ByRecipientUserIdOrderByCreatedAtDesc(userId)
                .stream().map(NotificationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return notificationRepository.countByRecipientUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllRead(userId);
    }
}
