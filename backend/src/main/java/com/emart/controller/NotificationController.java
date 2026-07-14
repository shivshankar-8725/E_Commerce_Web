package com.emart.controller;

import com.emart.dto.NotificationResponse;
import com.emart.security.SecurityUtils;
import com.emart.service.AppNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * P4-NOTI: each authenticated user reads their own notifications.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final AppNotificationService notificationService;

    public NotificationController(AppNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> list() {
        return ResponseEntity.ok(notificationService.list(SecurityUtils.currentUserId()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount() {
        return ResponseEntity.ok(Map.of("count", notificationService.unreadCount(SecurityUtils.currentUserId())));
    }

    @PostMapping("/read-all")
    public ResponseEntity<Map<String, String>> readAll() {
        notificationService.markAllRead(SecurityUtils.currentUserId());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read."));
    }
}
